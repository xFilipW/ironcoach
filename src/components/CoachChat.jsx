import { useState, forwardRef, useImperativeHandle } from "react"
import { Button } from "./ui/button"
import { Card } from "./ui/card"
import { Input } from "./ui/input"
import { ScrollArea } from "./ui/scroll-area"
import { Send, Bot, RefreshCw } from "lucide-react"
import { QUICK_PROMPTS } from "../lib/coachPrompts"
import { WORKOUT_PLAN_QUICK_PROMPTS } from "../lib/workoutPlanActions"
import { DIET_PLAN_QUICK_PROMPTS } from "../lib/dietPlanActions"
import { useCoachChat, useScrollToBottom } from "../hooks/useCoachChat"
import ChatMessage from "./chat/ChatMessage"
import TypingIndicator from "./chat/TypingIndicator"

const PLAN_QUICK_PROMPTS = [...WORKOUT_PLAN_QUICK_PROMPTS, ...DIET_PLAN_QUICK_PROMPTS]

const CoachChat = forwardRef(function CoachChat(
  {
    workouts = [],
    measurements = [],
    meals = [],
    dietProfile = null,
    addWorkout,
    updateWorkout,
    deleteWorkout,
    addMeal,
    updateMeal,
    deleteMeal,
    onPlanApplied,
  },
  ref
) {
  const [input, setInput] = useState("")
  const dietContext = { meals, profile: dietProfile }
  const { messages, loading, sendText, clearChat, applyPlan, applyingPlanId } = useCoachChat(
    workouts,
    measurements,
    dietContext,
    { addWorkout, updateWorkout, deleteWorkout, addMeal, updateMeal, deleteMeal, onPlanApplied }
  )
  const bottomRef = useScrollToBottom([messages, loading])

  useImperativeHandle(ref, () => ({ sendText }))

  const sendMessage = () => {
    const text = input.trim()
    if (!text) return
    setInput("")
    sendText(text)
  }

  const handleQuickPrompt = prompt => {
    if (PLAN_QUICK_PROMPTS.includes(prompt)) {
      sendText(prompt)
      return
    }
    setInput(prompt)
  }

  const handleApplyPlan = async messageId => {
    await applyPlan(messageId)
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="px-4 py-3 pr-12 lg:pr-4 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <Bot size={14} className="text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold uppercase tracking-wide">AI Coach</p>
            <p className="text-[11px] text-muted-foreground">Twój trener AI</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={clearChat}
            disabled={loading}
            aria-label="Wyczyść czat"
            title="Wyczyść czat"
          >
            <RefreshCw size={16} />
          </Button>
        </div>
      </div>
      <Card className="flex-1 flex flex-col min-h-0 overflow-hidden rounded-none border-0 shadow-none bg-transparent">
        <ScrollArea className="flex-1 min-h-0 p-4">
          <div className="space-y-4">
            {messages.map(m => (
              <ChatMessage
                key={m.id}
                message={m}
                onApplyPlan={handleApplyPlan}
                applyingPlan={applyingPlanId === m.id}
              />
            ))}
            {loading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>
        <div className="px-4 pt-2 pb-3 flex flex-wrap gap-x-3 gap-y-2 shrink-0">
          {QUICK_PROMPTS.map(q => (
            <button
              key={q}
              type="button"
              onClick={() => handleQuickPrompt(q)}
              disabled={loading}
              className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-accent text-muted-foreground hover:text-foreground transition-colors font-medium shrink-0 disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
        <div className="p-3 border-t border-border flex gap-2 shrink-0">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Zapytaj o trening, dietę, regenerację..."
            disabled={loading}
            className="flex-1"
          />
          <Button size="icon" onClick={sendMessage} disabled={loading || !input.trim()}>
            <Send size={16} />
          </Button>
        </div>
      </Card>
    </div>
  )
})

export default CoachChat
