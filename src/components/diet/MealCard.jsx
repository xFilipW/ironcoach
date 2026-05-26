import { Card, CardContent } from "../ui/card"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { Bot, Pencil, Trash2, StickyNote, ChevronUp, CheckCircle2, Circle } from "lucide-react"
import { getMealTypeLabel, formatMealMacros, isMealEaten } from "../../lib/dietUtils"

export default function MealCard({ meal, expanded, onToggle, onToggleEaten, onEdit, onDeleteRequest, onAnalyze }) {
  const hasDetails = meal.description?.trim() || meal.note?.trim()
  const eaten = isMealEaten(meal)

  return (
    <Card className={eaten ? "opacity-75" : ""}>
      <CardContent className="px-5 py-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onToggleEaten?.(meal)}
            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
              eaten
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            }`}
            aria-label={eaten ? "Oznacz jako niezjedzone" : "Oznacz jako zjedzone"}
            title={eaten ? "Zjedzone — kliknij, by cofnąć" : "Kliknij, gdy zjesz"}
          >
            {eaten ? <CheckCircle2 size={20} /> : <Circle size={20} />}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className={`font-bold text-sm sm:text-base ${eaten ? "line-through text-muted-foreground" : ""}`}>
                {meal.name}
              </p>
              <Badge variant={eaten ? "outline" : "secondary"} className="text-xs">
                {eaten ? "Zjedzone" : getMealTypeLabel(meal.mealType)}
              </Badge>
              {!eaten && meal.note?.trim() && (
                <Badge variant="outline" className="text-xs gap-1">
                  <StickyNote size={10} />
                  Notatka
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{formatMealMacros(meal)}</p>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            {onAnalyze && (
              <button
                type="button"
                onClick={() => onAnalyze(meal)}
                className="text-muted-foreground hover:text-primary transition-colors p-1.5 rounded-md hover:bg-accent"
                aria-label="Analizuj w AI"
                title="Analizuj w AI"
              >
                <Bot size={16} />
              </button>
            )}
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(meal.id)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-accent"
                aria-label="Edytuj posiłek"
              >
                <Pencil size={16} />
              </button>
            )}
            {onDeleteRequest && (
              <button
                type="button"
                onClick={() => onDeleteRequest(meal)}
                className="text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded-md hover:bg-destructive/10"
                aria-label="Usuń posiłek"
              >
                <Trash2 size={16} />
              </button>
            )}
            {onToggle && hasDetails && (
              <button
                type="button"
                onClick={onToggle}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
                aria-label={expanded ? "Zwiń" : "Rozwiń"}
              >
                <ChevronUp size={18} className={`transition-transform ${expanded ? "" : "rotate-180"}`} />
              </button>
            )}
          </div>
        </div>
        {expanded && hasDetails && (
          <div className="mt-4 pt-4 border-t border-border space-y-2">
            {meal.description?.trim() && (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap rounded-md bg-muted/40 px-3 py-2">
                {meal.description.trim()}
              </p>
            )}
            {meal.note?.trim() && (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap rounded-md bg-muted/40 px-3 py-2">
                {meal.note.trim()}
              </p>
            )}
            {onAnalyze && (
              <Button variant="secondary" size="sm" className="gap-2" onClick={() => onAnalyze(meal)}>
                <Bot size={14} />
                Analizuj w AI
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
