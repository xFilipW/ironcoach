import { useState, useRef, useEffect } from "react"
import { INITIAL_MESSAGES, CHAT_ERRORS, buildSystemPrompt } from "../lib/coachPrompts"
import { callGemini, toGeminiContents } from "../lib/geminiApi"

export function useCoachChat(workouts, measurements) {
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [loading, setLoading] = useState(false)
  const messagesRef = useRef(messages)
  const workoutsRef = useRef(workouts)
  const measurementsRef = useRef(measurements)
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY

  messagesRef.current = messages
  workoutsRef.current = workouts
  measurementsRef.current = measurements

  const appendMessage = (role, text) => {
    setMessages(prev => [...prev, { id: crypto.randomUUID(), role, text }])
  }

  const sendText = async text => {
    const trimmed = text?.trim()
    if (!trimmed || loading) return

    const userMsg = { id: crypto.randomUUID(), role: "user", text: trimmed }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    if (!apiKey) {
      setTimeout(() => {
        appendMessage("assistant", CHAT_ERRORS.noApiKey)
        setLoading(false)
      }, 600)
      return
    }

    try {
      const contents = toGeminiContents([...messagesRef.current, userMsg])
      const reply = await callGemini(apiKey, contents, buildSystemPrompt(workoutsRef.current, measurementsRef.current))
      appendMessage("assistant", reply)
    } catch (err) {
      appendMessage(
        "assistant",
        err?.message ? `Błąd: ${err.message}` : CHAT_ERRORS.connection
      )
    } finally {
      setLoading(false)
    }
  }

  const clearChat = () => {
    if (loading) return
    setMessages(INITIAL_MESSAGES)
  }

  return { messages, loading, sendText, clearChat }
}

export function useScrollToBottom(deps) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, deps)

  return bottomRef
}
