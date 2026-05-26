import { useState } from "react"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { CalendarDays, ChevronUp, Bot, UtensilsCrossed } from "lucide-react"
import MealCard from "./MealCard"
import {
  groupMealsByWeek,
  getCurrentWeekKey,
  formatDayTotals,
} from "../../lib/dietUtils"
import { formatMealCount } from "../../lib/pluralize"

function getTodayDayKey(week) {
  const today = week.days.find(d => d.isToday)
  return today?.key ?? week.days[0]?.key ?? null
}

export default function DietWeekGroups({
  meals,
  expandedMeal,
  setExpandedMeal,
  setEditingId,
  setDeleteTarget,
  onToggleEaten,
  onAnalyzeMeal,
  onAnalyzeWeek,
}) {
  const weeks = groupMealsByWeek(meals)
  const currentWeekKey = getCurrentWeekKey()
  const [expandedWeek, setExpandedWeek] = useState(() => {
    const match = weeks.find(w => w.key === currentWeekKey)
    return match?.key ?? weeks[0]?.key ?? null
  })
  const [expandedDay, setExpandedDay] = useState(() => {
    const match = weeks.find(w => w.key === currentWeekKey) ?? weeks[0]
    return match ? getTodayDayKey(match) : null
  })

  const handleWeekToggle = week => {
    const isOpen = expandedWeek === week.key
    if (isOpen) {
      setExpandedWeek(null)
      setExpandedDay(null)
      return
    }
    setExpandedWeek(week.key)
    setExpandedDay(getTodayDayKey(week))
  }

  const handleDayToggle = dayKey => {
    setExpandedDay(expandedDay === dayKey ? null : dayKey)
  }

  return (
    <div className="space-y-6">
      {weeks.map(week => {
        const isWeekOpen = expandedWeek === week.key
        const isCurrentWeek = week.key === currentWeekKey
        const dayTotalsLabel = formatDayTotals(week.totals)

        return (
          <div key={week.key} className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => handleWeekToggle(week)}
                className="flex items-center gap-3 flex-1 min-w-0 text-left rounded-lg border border-border bg-muted/40 hover:bg-muted/70 transition-colors px-4 py-3"
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
                    {formatMealCount(week.mealCount)}
                    {dayTotalsLabel && ` · ${dayTotalsLabel} łącznie`}
                  </p>
                </div>
                <ChevronUp
                  size={20}
                  className={`text-muted-foreground shrink-0 transition-transform ${isWeekOpen ? "" : "rotate-180"}`}
                />
              </button>
              {onAnalyzeWeek && week.mealCount > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-2 shrink-0"
                  onClick={() => onAnalyzeWeek(week.days.flatMap(d => d.meals), week.label)}
                >
                  <Bot size={16} />
                  Analizuj tydzień
                </Button>
              )}
            </div>

            {isWeekOpen && (
              <div className="space-y-3 pl-2 sm:pl-4 border-l-2 border-border ml-5">
                {week.days.map(day => {
                  const isDayOpen = expandedDay === day.key
                  const totalsLabel = formatDayTotals(day.totals)

                  return (
                    <div key={day.key} className="space-y-2">
                      <button
                        type="button"
                        onClick={() => handleDayToggle(day.key)}
                        className="w-full flex items-center gap-3 text-left rounded-lg border border-border/70 bg-card hover:bg-muted/30 transition-colors px-4 py-2.5"
                      >
                        <div className="w-8 h-8 rounded-md bg-muted text-muted-foreground flex items-center justify-center shrink-0">
                          <UtensilsCrossed size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-sm sm:text-base capitalize">{day.dateLabel}</p>
                            {day.isToday && (
                              <Badge variant="outline" className="text-xs">
                                Dziś
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                            {day.eatenCount > 0 && (
                              <span className="text-primary font-medium">
                                {day.eatenCount}/{day.meals.length} zjedzone
                                {day.eatenTotals.calories > 0 &&
                                  ` · ${Math.round(day.eatenTotals.calories)} kcal`}
                                {" · "}
                              </span>
                            )}
                            {formatMealCount(day.meals.length)}
                            {totalsLabel && ` · ${totalsLabel} plan`}
                          </p>
                        </div>
                        <ChevronUp
                          size={18}
                          className={`text-muted-foreground shrink-0 transition-transform ${isDayOpen ? "" : "rotate-180"}`}
                        />
                      </button>

                      {isDayOpen && (
                        <div className="space-y-2 pl-2 sm:pl-3 border-l border-border/60 ml-4">
                          {day.meals.map(meal => (
                            <MealCard
                              key={meal.id}
                              meal={meal}
                              expanded={expandedMeal === meal.id}
                              onToggle={() =>
                                setExpandedMeal(expandedMeal === meal.id ? null : meal.id)
                              }
                              onToggleEaten={onToggleEaten}
                              onEdit={setEditingId}
                              onDeleteRequest={setDeleteTarget}
                              onAnalyze={onAnalyzeMeal}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
