import { Bot, User, CalendarPlus, Check, Loader2 } from "lucide-react"
import { Button } from "../ui/button"

function FormattedText({ text }) {
  return text.split("\n").map((line, i) => {
    const parts = line.split(/\*\*(.*?)\*\*/g)
    return (
      <p key={i} className={i > 0 ? "mt-1" : ""}>
        {parts.map((p, j) => (j % 2 === 1 ? <strong key={j}>{p}</strong> : p))}
      </p>
    )
  })
}

export default function ChatMessage({ message, onApplyPlan, applyingPlan }) {
  const isUser = message.role === "user"
  const hasPlan = Boolean(message.workoutPlan?.actions?.length)
  const isApplying = applyingPlan && !message.planApplied

  return (
    <div className={`message-enter flex gap-3 mb-4 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs ${
          isUser ? "bg-secondary text-secondary-foreground border border-border" : "bg-primary text-primary-foreground"
        }`}
      >
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>
      <div className={`max-w-[78%] flex flex-col gap-2 ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`rounded-lg px-4 py-3 text-sm leading-relaxed ${
            isUser ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
          }`}
        >
          <FormattedText text={message.text} />
        </div>
        {hasPlan && !isUser && (
          <div className="w-full space-y-1.5">
            {message.workoutPlan.summary && (
              <p className="text-[11px] text-muted-foreground px-0.5">{message.workoutPlan.summary}</p>
            )}
            <Button
              type="button"
              size="sm"
              variant={message.planApplied ? "secondary" : "default"}
              className="w-full text-xs h-8 gap-1.5"
              disabled={message.planApplied || isApplying}
              onClick={() => onApplyPlan?.(message.id)}
            >
              {isApplying ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Zapisuję w dzienniku…
                </>
              ) : message.planApplied ? (
                <>
                  <Check size={14} />
                  Zastosowano w dzienniku
                </>
              ) : (
                <>
                  <CalendarPlus size={14} />
                  Zastosuj plan w zakładce Trening
                </>
              )}
            </Button>
            {message.applyResult && (
              <p className="text-[11px] text-muted-foreground px-0.5">{message.applyResult}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
