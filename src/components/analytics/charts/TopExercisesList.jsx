import { TrendingUp } from "lucide-react"
import { Badge } from "../../ui/badge"
import { ChartCard } from "../AnalyticsCards"

export default function TopExercisesList({ exercises }) {
  if (exercises.length === 0) return null

  return (
    <ChartCard title="Najczęstsze ćwiczenia" description="Liczba sesji i najlepsze szac. 1RM">
      <div className="space-y-3">
        {exercises.map((ex, i) => (
          <div key={ex.name} className="flex items-center gap-3">
            <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}.</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm truncate">{ex.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {ex.count}×
                </Badge>
                {ex.best1RM != null && (
                  <Badge variant="outline" className="text-xs gap-1">
                    <TrendingUp size={10} />
                    ~{ex.best1RM} kg 1RM
                  </Badge>
                )}
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-foreground rounded-full transition-all"
                  style={{ width: `${(ex.count / exercises[0].count) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </ChartCard>
  )
}
