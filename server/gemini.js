import { getGeminiApiKey, getGeminiModel } from "./loadEnv.js"

const MAX_OUTPUT_TOKENS = 2048
const PLAN_OUTPUT_TOKENS = 8192
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 2000

const BUILTIN_FALLBACK_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"]

const TRANSIENT_ERROR =
  /high demand|try again|overloaded|503|unavailable|deadline exceeded/i

const QUOTA_ERROR =
  /quota|exceeded|resource exhausted|rate limit|limit:\s*\d|per day|per minute|rpd|rpm/i

const TRUNCATED_SUFFIX =
  "\n\n*(Odpowiedź została skrócona – wpisz 'kontynuuj', a dokończę analizę.)*"

const QUOTA_EXHAUSTED =
  "Wyczerpano dzienny limit zapytań dla wszystkich dostępnych modeli (np. flash-lite i flash). Limit odświeża się około północy czasu PT — spróbuj jutro lub ustaw inny model w .env."

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function parseFallbackModels() {
  const raw = process.env.GEMINI_FALLBACK_MODELS || process.env.VITE_GEMINI_FALLBACK_MODELS
  if (!raw?.trim()) return []
  return raw
    .split(",")
    .map(s => s.trim())
    .filter(Boolean)
}

function getGeminiModelChain() {
  const primary = getGeminiModel()
  const chain = [primary]
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
    reply += TRUNCATED_SUFFIX
  }

  return reply || "Brak odpowiedzi."
}

export async function generateGeminiReply(contents, systemPrompt, options = {}) {
  const apiKey = getGeminiApiKey()
  if (!apiKey) {
    const err = new Error(
      "Brak klucza API. Ustaw GEMINI_API_KEY w pliku .env i uruchom ponownie serwer (npm run dev)."
    )
    err.status = 503
    throw err
  }

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
  }

  if (sawQuotaError) {
    throw new Error(QUOTA_EXHAUSTED)
  }

  if (TRANSIENT_ERROR.test(lastError.message)) {
    throw new Error("Serwer jest chwilowo przeciążony. Spróbuj ponownie za minutę.")
  }

  throw lastError
}

export { PLAN_OUTPUT_TOKENS }
