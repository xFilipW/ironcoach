import { Button } from "../ui/button"
import { Card, CardContent } from "../ui/card"
import { Badge } from "../ui/badge"
import {
  Layers,
  CheckCircle2,
  Heart,
  Trash2,
  Pencil,
  CalendarClock,
  Bot,
  StickyNote,
  ChevronUp,
} from "lucide-react"
import { isWorkoutCompleted } from "../../lib/workoutUtils"

function WorkoutCardContent({ w, expanded, onToggle, onEdit, onDeleteRequest, onAnalyze }) {
  const completed = isWorkoutCompleted(w)
  const analyzeLabel = completed ? "Analizuj w AI" : "Oceń plan w AI"
  const hasDetails = w.exercises?.length > 0 || w.note?.trim()

  return (
    <>
      <div className="flex items-center gap-4">
        <div
          className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${
            completed ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground"
          }`}
        >
          {completed ? <CheckCircle2 size={22} /> : <CalendarClock size={22} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-base">{w.name}</p>
            <Badge variant={completed ? "outline" : "secondary"} className="text-xs shrink-0">
              {completed ? "Ukończony" : "Nadchodzący"}
            </Badge>
            {completed && w.feeling != null && (
              <Badge variant="secondary" className="text-xs gap-1">
                <Heart size={10} />
                {w.feeling}/10
              </Badge>
            )}
            {w.note?.trim() && (
              <Badge variant="outline" className="text-xs gap-1">
                <StickyNote size={10} />
                Notatka
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {completed ? "Ukończono" : "Plan"}: {w.dateLabel ?? "—"} · {w.duration}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {onAnalyze && w.exercises?.length > 0 && (
            <button
              type="button"
              onClick={() => onAnalyze(w)}
              className="text-muted-foreground hover:text-primary transition-colors p-1.5 rounded-md hover:bg-accent"
              aria-label={analyzeLabel}
              title={analyzeLabel}
            >
              <Bot size={18} />
            </button>
          )}
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(w.id)}
              className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-accent"
              aria-label="Edytuj trening"
            >
              <Pencil size={18} />
            </button>
          )}
          {onDeleteRequest && (
            <button
              type="button"
              onClick={() => onDeleteRequest(w)}
              className="text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded-md hover:bg-destructive/10"
              aria-label="Usuń trening"
            >
              <Trash2 size={18} />
            </button>
          )}
          {onToggle && hasDetails && (
            <button
              type="button"
              onClick={onToggle}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
              aria-label={expanded ? "Zwiń" : "Rozwiń"}
            >
              <ChevronUp size={20} className={`transition-transform ${expanded ? "" : "rotate-180"}`} />
            </button>
          )}
        </div>
      </div>
      {expanded && hasDetails && (
        <div className="mt-5 pt-5 border-t border-border space-y-3">
          {w.exercises?.map((ex, i) => (
            <div key={i} className="flex items-center gap-3 text-base">
              <Layers size={16} className="text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">{ex}</span>
            </div>
          ))}
          {w.note?.trim() && (
            <div className="flex items-start gap-3 text-base rounded-md bg-muted/40 px-4 py-3">
              <StickyNote size={16} className="text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-muted-foreground whitespace-pre-wrap">{w.note.trim()}</p>
            </div>
          )}
          {onAnalyze && w.exercises?.length > 0 && (
            <Button variant="secondary" size="sm" className="mt-2 gap-2" onClick={() => onAnalyze(w)}>
              <Bot size={16} />
              {analyzeLabel}
            </Button>
          )}
        </div>
      )}
    </>
  )
}

export default function WorkoutCard({ w, expanded, onToggle, onEdit, onDeleteRequest, onAnalyze }) {
  return (
    <Card className={isWorkoutCompleted(w) ? "opacity-90" : ""}>
      <CardContent className="px-6 py-5">
        <WorkoutCardContent
          w={w}
          expanded={expanded}
          onToggle={onToggle}
          onEdit={onEdit}
          onDeleteRequest={onDeleteRequest}
          onAnalyze={onAnalyze}
        />
      </CardContent>
    </Card>
  )
}
