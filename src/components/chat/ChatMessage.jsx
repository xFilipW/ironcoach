import { Bot, User } from "lucide-react"

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

export default function ChatMessage({ message }) {
  const isUser = message.role === "user"

  return (
    <div className={`message-enter flex gap-3 mb-4 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs ${
          isUser ? "bg-secondary text-secondary-foreground border border-border" : "bg-primary text-primary-foreground"
        }`}
      >
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>
      <div
        className={`max-w-[78%] rounded-lg px-4 py-3 text-sm leading-relaxed ${
          isUser ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
        }`}
      >
        <FormattedText text={message.text} />
      </div>
    </div>
  )
}
