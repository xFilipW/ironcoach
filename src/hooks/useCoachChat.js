import { useState, useRef, useEffect } from "react"
import { INITIAL_MESSAGES, CHAT_ERRORS, buildSystemPrompt } from "../lib/coachPrompts"
import { callGemini, toGeminiContents } from "../lib/geminiApi"
import {
  isWorkoutPlanIntent,
  parseWorkoutPlanFromReply,
  applyWorkoutPlan,
  formatApplyResult,
} from "../lib/workoutPlanActions"

export function useCoachChat(workouts, measurements, workoutHandlers = {}) {
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [loading, setLoading] = useState(false)
  const [applyingPlanId, setApplyingPlanId] = useState(null)
  const messagesRef = useRef(messages)
  const workoutsRef = useRef(workouts)
  const measurementsRef = useRef(measurements)
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY

  messagesRef.current = messages
  workoutsRef.current = workouts
  measurementsRef.current = measurements

  const appendAssistantMessage = rawReply => {
    const { displayText, plan } = parseWorkoutPlanFromReply(rawReply)
    setMessages(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "assistant",
        text: displayText || rawReply,
        workoutPlan: plan,
        planApplied: false,
      },
    ])
  }

  const sendText = async text => {
    const trimmed = text?.trim()
    if (!trimmed || loading) return

    const userMsg = { id: crypto.randomUUID(), role: "user", text: trimmed }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    if (!apiKey) {
      setTimeout(() => {
        appendAssistantMessage(CHAT_ERRORS.noApiKey)
        setLoading(false)
      }, 600)
      return
    }

    try {
      const contents = toGeminiContents([...messagesRef.current, userMsg])
      const reply = await callGemini(
        apiKey,
        contents,
        buildSystemPrompt(workoutsRef.current, measurementsRef.current, {
          workoutPlanMode: isWorkoutPlanIntent(trimmed),
        })
      )
      appendAssistantMessage(reply)
    } catch (err) {
      appendAssistantMessage(err?.message ? `Błąd: ${err.message}` : CHAT_ERRORS.connection)
    } finally {
      setLoading(false)
    }
  }

  const applyPlan = async messageId => {
    const msg = messagesRef.current.find(m => m.id === messageId)
    if (!msg?.workoutPlan || msg.planApplied || applyingPlanId) return null

    const { addWorkout, updateWorkout, deleteWorkout, onPlanApplied } = workoutHandlers
    if (!addWorkout || !updateWorkout || !deleteWorkout) return null

    setApplyingPlanId(messageId)
    try {
      const result = await applyWorkoutPlan(msg.workoutPlan, workoutsRef.current, {
        addWorkout,
        updateWorkout,
        deleteWorkout,
      })
      const applyResult = formatApplyResult(result)
      setMessages(prev =>
        prev.map(m =>
          m.id === messageId ? { ...m, planApplied: true, applyResult } : m
        )
      )
      onPlanApplied?.(result)
      return result
    } finally {
      setApplyingPlanId(null)
    }
  }

  const clearChat = () => {
    if (loading) return
    setMessages(INITIAL_MESSAGES)
  }

  return { messages, loading, sendText, clearChat, applyPlan, applyingPlanId }
}

export function useScrollToBottom(deps) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, deps)

  return bottomRef
}
