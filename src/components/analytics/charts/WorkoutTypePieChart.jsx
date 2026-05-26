import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import { ChartCard } from "../AnalyticsCards"
import { TOOLTIP_STYLE } from "../../../lib/chartTheme"
import { CHART_COLORS } from "../../../lib/workoutAnalytics"

export default function WorkoutTypePieChart({ data }) {
  return (
    <ChartCard title="Typy treningów" description="Rozkład ukończonych sesji">
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Brak danych</p>
      ) : (
        <div className="h-56 flex items-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value, name) => [`${value}×`, name]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 shrink-0 min-w-[120px]">
            {data.map((item, i) => (
              <div key={item.name} className="flex items-center gap-2 text-xs">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                />
                <span className="text-muted-foreground truncate">{item.name}</span>
                <span className="font-semibold ml-auto">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </ChartCard>
  )
}
