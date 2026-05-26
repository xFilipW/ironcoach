import { SYSTEM_PROMPT, CHAT_ERRORS } from "./coachPrompts"

export const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || "gemini-2.5-flash-lite"
const MAX_OUTPUT_TOKENS = 2048
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 2000

const RETRYABLE_ERROR = /high demand|try again|resource exhausted|overloaded|429|503|unavailable/i

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function toGeminiContents(messages) {
  return messages
    .filter(m => m.id !== 1)
    .map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.text }],
    }))
}

async function requestGemini(apiKey, model, contents, systemPrompt) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: {
          maxOutputTokens: MAX_OUTPUT_TOKENS,
          ...(model.includes("2.5") ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
        },
      }),
    }
  )
  const data = await res.json()
  return { res, data }
}

export async function callGemini(apiKey, contents, systemPrompt = SYSTEM_PROMPT) {
  let lastError = new Error("Nie udało się uzyskać odpowiedzi.")

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (attempt > 0) await sleep(RETRY_DELAY_MS * attempt)

    const { res, data } = await requestGemini(apiKey, GEMINI_MODEL, contents, systemPrompt)

    if (res.ok) {
      const candidate = data?.candidates?.[0]
      let reply = candidate?.content?.parts?.map(p => p.text).join("")?.trim()

      if (candidate?.finishReason === "MAX_TOKENS" && reply) {
        reply += CHAT_ERRORS.truncated
      }

      return reply || "Brak odpowiedzi."
    }

    const message = data?.error?.message || `Błąd API (${res.status})`
    lastError = new Error(message)

    const retryable = RETRYABLE_ERROR.test(message) || res.status === 429 || res.status === 503
    if (!retryable) break
  }

  if (RETRYABLE_ERROR.test(lastError.message)) {
    throw new Error("Serwer jest chwilowo przeciążony. Spróbuj ponownie za minutę.")
  }

  throw lastError
}
