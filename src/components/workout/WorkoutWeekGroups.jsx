import { useState } from "react"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { CalendarDays, ChevronUp, Bot } from "lucide-react"
import WorkoutCard from "./WorkoutCard"
import { isWorkoutCompleted, groupWorkoutsByWeek, getCurrentWeekKey } from "../../lib/workoutUtils"
import { formatWorkoutCount } from "../../lib/pluralize"

export default function WorkoutWeekGroups({
  items,
  expanded,
  setExpanded,
  setEditingId,
  setDeleteTarget,
  onAnalyze,
  onAnalyzeWeek,
  newestFirst,
}) {
  const weeks = groupWorkoutsByWeek(items, { newestFirst })
  const currentWeekKey = getCurrentWeekKey()
  const [expandedWeek, setExpandedWeek] = useState(() => {
    const match = weeks.find(w => w.key === currentWeekKey)
    return match?.key ?? weeks[0]?.key ?? null
  })

  return weeks.map(week => {
    const isWeekOpen = expandedWeek === week.key
    const isCurrentWeek = week.key === currentWeekKey
    const completedInWeek = week.workouts.filter(w => isWorkoutCompleted(w))
    const feelings = completedInWeek.filter(w => w.feeling != null).map(w => w.feeling)
    const avgFeeling =
      feelings.length > 0 ? (feelings.reduce((a, b) => a + b, 0) / feelings.length).toFixed(1) : null

    return (
      <div key={week.key} className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <button
            type="button"
            onClick={() => setExpandedWeek(isWeekOpen ? null : week.key)}
            className="flex items-center gap-3 w-full sm:flex-1 sm:min-w-0 text-left rounded-lg border border-border bg-muted/40 hover:bg-muted/70 transition-colors px-4 py-3"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <CalendarDays size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold text-base">{week.label}</p>
                {isCurrentWeek && (
                  <Badge variant="secondary" className="text-xs">
                    Ten tydzień
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {formatWorkoutCount(week.workouts.length)}
                {avgFeeling != null && ` · śr. samopoczucie ${avgFeeling}/10`}
              </p>
            </div>
            <ChevronUp size={20} className={`text-muted-foreground shrink-0 transition-transform ${isWeekOpen ? "" : "rotate-180"}`} />
          </button>
          {onAnalyzeWeek && week.workouts.some(w => w.exercises?.length > 0) && (
            <Button
              variant="secondary"
              size="sm"
              className="gap-2 w-full sm:w-auto shrink-0"
              onClick={() => onAnalyzeWeek(week.workouts, week.label)}
            >
              <Bot size={16} />
              Analizuj tydzień
            </Button>
          )}
        </div>
        {isWeekOpen && (
          <div className="space-y-4 pl-2 sm:pl-4 border-l-2 border-border ml-5">
            {week.workouts.map(w => (
              <WorkoutCard
                key={w.id}
                w={w}
                expanded={expanded === w.id}
                onToggle={() => setExpanded(expanded === w.id ? null : w.id)}
                onEdit={setEditingId}
                onDeleteRequest={setDeleteTarget}
                onAnalyze={onAnalyze}
              />
            ))}
          </div>
        )}
      </div>
    )
  })
}
