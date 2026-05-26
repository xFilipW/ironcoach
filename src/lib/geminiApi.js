import { SYSTEM_PROMPT, CHAT_ERRORS } from "./coachPrompts"

export const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || "gemini-2.5-flash-lite"

const MAX_OUTPUT_TOKENS = 2048
const PLAN_OUTPUT_TOKENS = 8192
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 2000

const BUILTIN_FALLBACK_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"]

const TRANSIENT_ERROR =
  /high demand|try again|overloaded|503|unavailable|deadline exceeded/i

const QUOTA_ERROR =
  /quota|exceeded|resource exhausted|rate limit|limit:\s*\d|per day|per minute|rpd|rpm/i

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function parseFallbackModels() {
  const raw = import.meta.env.VITE_GEMINI_FALLBACK_MODELS
  if (!raw?.trim()) return []
  return raw
    .split(",")
    .map(s => s.trim())
    .filter(Boolean)
}

export function getGeminiModelChain() {
  const chain = [GEMINI_MODEL]
  for (const model of [...parseFallbackModels(), ...BUILTIN_FALLBACK_MODELS]) {
    if (!chain.includes(model)) chain.push(model)
  }
  return chain
}

function isQuotaOrRateLimit(status, message) {
  return status === 429 || QUOTA_ERROR.test(message)
}

function isTransient(status, message) {
  return TRANSIENT_ERROR.test(message) || status === 503
}

function isFatalError(status, message) {
  if (status === 401 || status === 403) return true
  return status === 400 && /api key|invalid/i.test(message)
}

export function toGeminiContents(messages) {
  return messages
    .filter(m => m.id !== 1)
    .map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.text }],
    }))
}

async function requestGemini(apiKey, model, contents, systemPrompt, maxOutputTokens) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: {
          maxOutputTokens,
          ...(model.includes("2.5") ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
        },
      }),
    }
  )
  const data = await res.json()
  return { res, data }
}

function extractReply(data) {
  const candidate = data?.candidates?.[0]
  let reply = candidate?.content?.parts?.map(p => p.text).join("")?.trim()

  if (candidate?.finishReason === "MAX_TOKENS" && reply) {
    reply += CHAT_ERRORS.truncated
  }

  return reply || "Brak odpowiedzi."
}

export { PLAN_OUTPUT_TOKENS }

export async function callGemini(apiKey, contents, systemPrompt = SYSTEM_PROMPT, options = {}) {
  const maxOutputTokens = options.maxOutputTokens ?? MAX_OUTPUT_TOKENS
  const models = getGeminiModelChain()
  let lastError = new Error("Nie udało się uzyskać odpowiedzi.")
  let sawQuotaError = false

  for (let modelIndex = 0; modelIndex < models.length; modelIndex++) {
    const model = models[modelIndex]

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      if (attempt > 0) await sleep(RETRY_DELAY_MS * attempt)

      const { res, data } = await requestGemini(apiKey, model, contents, systemPrompt, maxOutputTokens)

      if (res.ok) {
        return extractReply(data)
      }

      const message = data?.error?.message || `Błąd API (${res.status})`
      lastError = new Error(message)

      if (isFatalError(res.status, message)) throw lastError

      if (res.status === 404) break

      if (isQuotaOrRateLimit(res.status, message)) {
        sawQuotaError = true
        break
      }

      if (isTransient(res.status, message)) continue

      break
    }

    if (modelIndex < models.length - 1) continue
  }

  if (sawQuotaError) {
    throw new Error(CHAT_ERRORS.quotaExhausted)
  }

  if (TRANSIENT_ERROR.test(lastError.message)) {
    throw new Error("Serwer jest chwilowo przeciążony. Spróbuj ponownie za minutę.")
  }

  throw lastError
}
