import { useState, useRef, useEffect } from "react"
import { INITIAL_MESSAGES, CHAT_ERRORS, buildSystemPrompt } from "../lib/coachPrompts"
import { callGemini, toGeminiContents, PLAN_OUTPUT_TOKENS } from "../lib/geminiApi"
import {
  isWorkoutPlanIntent,
  parseWorkoutPlanFromReply,
  applyWorkoutPlan,
  formatApplyResult,
} from "../lib/workoutPlanActions"
import {
  isDietPlanIntent,
  parseDietPlanFromReply,
  applyDietPlan,
  formatDietApplyResult,
  getEffectiveDietPlan,
} from "../lib/dietPlanActions"

const TRUNCATED_SUFFIX = /\*\(Odpowiedź została skrócona[\s\S]*$/i

function parseAssistantReply(rawReply) {
  const workout = parseWorkoutPlanFromReply(rawReply)
  if (workout.plan) {
    return { displayText: workout.displayText || rawReply, workoutPlan: workout.plan, dietPlan: null }
  }
  const diet = parseDietPlanFromReply(rawReply)
  return {
    displayText: diet.displayText || rawReply,
    workoutPlan: null,
    dietPlan: diet.plan,
  }
}

export function useCoachChat(workouts, measurements, dietContext = {}, handlers = {}) {
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [loading, setLoading] = useState(false)
  const [applyingPlanId, setApplyingPlanId] = useState(null)
  const messagesRef = useRef(messages)
  const workoutsRef = useRef(workouts)
  const measurementsRef = useRef(measurements)
  const dietContextRef = useRef(dietContext)
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY

  messagesRef.current = messages
  workoutsRef.current = workouts
  measurementsRef.current = measurements
  dietContextRef.current = dietContext

  const appendAssistantMessage = (rawReply, { mergeWithPrevious = false } = {}) => {
    let textToParse = rawReply

    if (mergeWithPrevious) {
      const prev = [...messagesRef.current].reverse().find(m => m.role === "assistant")
      if (prev) {
        textToParse = `${prev.text.replace(TRUNCATED_SUFFIX, "").trim()}\n\n${rawReply.replace(TRUNCATED_SUFFIX, "").trim()}`
      }
    }

    const { displayText, workoutPlan, dietPlan } = parseAssistantReply(textToParse)

    if (mergeWithPrevious) {
      setMessages(prev => {
        let lastAssistantIdx = -1
        for (let i = prev.length - 1; i >= 0; i--) {
          if (prev[i].role === "assistant") {
            lastAssistantIdx = i
            break
          }
        }
        if (lastAssistantIdx === -1) {
          return [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: "assistant",
              text: displayText || textToParse,
              workoutPlan,
              dietPlan,
              planApplied: false,
            },
          ]
        }
        return prev.map((m, i) =>
          i === lastAssistantIdx
            ? {
                ...m,
                text: displayText || textToParse,
                workoutPlan: workoutPlan ?? m.workoutPlan,
                dietPlan: dietPlan ?? m.dietPlan,
                planApplied: false,
                applyResult: undefined,
              }
            : m
        )
      })
      return
    }

    setMessages(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "assistant",
        text: displayText || rawReply,
        workoutPlan,
        dietPlan,
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
      const priorMessages = messagesRef.current
      const workoutPlanMode = isWorkoutPlanIntent(trimmed)
      const dietPlanMode = isDietPlanIntent(trimmed, priorMessages)
      const planMode = workoutPlanMode || dietPlanMode
      const isContinue = /^kontynuuj$/i.test(trimmed)

      const contents = toGeminiContents([...priorMessages, userMsg])
      const reply = await callGemini(
        apiKey,
        contents,
        buildSystemPrompt(workoutsRef.current, measurementsRef.current, dietContextRef.current, {
          workoutPlanMode,
          dietPlanMode,
        }),
        { maxOutputTokens: planMode ? PLAN_OUTPUT_TOKENS : undefined }
      )
      appendAssistantMessage(reply, { mergeWithPrevious: isContinue && dietPlanMode })
    } catch (err) {
      appendAssistantMessage(err?.message ? `Błąd: ${err.message}` : CHAT_ERRORS.connection)
    } finally {
      setLoading(false)
    }
  }

  const applyPlan = async messageId => {
    const msg = messagesRef.current.find(m => m.id === messageId)
    if (!msg || msg.planApplied || applyingPlanId) return null

    if (msg.workoutPlan?.actions?.length) {
      const { addWorkout, updateWorkout, deleteWorkout, onPlanApplied } = handlers
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
        onPlanApplied?.(result, "workout")
        return result
      } finally {
        setApplyingPlanId(null)
      }
    }

    const dietPlan = getEffectiveDietPlan(msg)
    if (dietPlan?.actions?.length) {
      const { addMeal, updateMeal, deleteMeal, onPlanApplied } = handlers
      if (!addMeal || !updateMeal || !deleteMeal) return null

      setApplyingPlanId(messageId)
      try {
        const meals = dietContextRef.current?.meals ?? []
        const result = await applyDietPlan(dietPlan, meals, {
          addMeal,
          updateMeal,
          deleteMeal,
        })
        const applyResult = formatDietApplyResult(result)
        setMessages(prev =>
          prev.map(m =>
            m.id === messageId ? { ...m, planApplied: true, applyResult } : m
          )
        )
        onPlanApplied?.(result, "diet")
        return result
      } finally {
        setApplyingPlanId(null)
      }
    }

    return null
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
