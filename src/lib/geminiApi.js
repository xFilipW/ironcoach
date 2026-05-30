import { SYSTEM_PROMPT } from "./coachPrompts"

export const PLAN_OUTPUT_TOKENS = 8192

export function toGeminiContents(messages) {
  return messages
    .filter(m => m.id !== 1)
    .map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.text }],
    }))
}

export async function callGemini(contents, systemPrompt = SYSTEM_PROMPT, options = {}) {
  let res
  try {
    res = await fetch("/api/gemini/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        systemPrompt,
        maxOutputTokens: options.maxOutputTokens,
      }),
    })
  } catch {
    throw new Error(
      "Nie można połączyć się z serwerem API. Uruchom npm run dev i odśwież stronę (port z terminala, np. localhost:5174)."
    )
  }

  const raw = await res.text()
  let data = {}
  try {
    data = raw ? JSON.parse(raw) : {}
  } catch {
    if (res.status === 404) {
      throw new Error(
        "Serwer API nie ma endpointu AI — zatrzymaj npm run dev (Ctrl+C) i uruchom ponownie, żeby wczytać najnowszy kod."
      )
    }
  }

  if (!res.ok) {
    throw new Error(data.error || `Błąd serwera AI (${res.status}).`)
  }

  if (!data.reply) {
    throw new Error("Serwer AI zwrócił pustą odpowiedź.")
  }

  return data.reply
}
