import { Bot } from "lucide-react"

export default function TypingIndicator() {
  return (
    <div className="flex gap-3 message-enter mb-4">
      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
        <Bot size={14} />
      </div>
      <div className="bg-muted rounded-lg px-4 py-3 flex gap-1 items-center">
        <span className="typing-dot w-1.5 h-1.5 bg-muted-foreground rounded-full" />
        <span className="typing-dot w-1.5 h-1.5 bg-muted-foreground rounded-full" />
        <span className="typing-dot w-1.5 h-1.5 bg-muted-foreground rounded-full" />
      </div>
    </div>
  )
}
