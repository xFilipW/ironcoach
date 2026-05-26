import { useMemo } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Activity } from "lucide-react"
import { ChartCard } from "../AnalyticsCards"
import { TOOLTIP_STYLE, AXIS_TICK, GRID_STROKE } from "../../../lib/chartTheme"
import { CHART_COLORS } from "../../../lib/workoutAnalytics"

export default function SbdProgressChart({ series }) {
  const chartData = useMemo(() => {
    const dateMap = new Map()
    for (const s of series) {
      for (const pt of s.points) {
        const key = pt.date.getTime()
        if (!dateMap.has(key)) dateMap.set(key, { label: pt.label, date: pt.date })
        dateMap.get(key)[s.id] = pt.rm
      }
    }
    return Array.from(dateMap.values()).sort((a, b) => a.date - b.date)
  }, [series])

  return (
    <ChartCard
      title="Postęp SBD"
      description="Szacunkowe 1RM w czasie — przysiad, wyciskanie, martwy ciąg"
    >
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
            <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} />
            <YAxis
              tick={AXIS_TICK}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `${v} kg`}
              domain={["auto", "auto"]}
            />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={value => [`~${value} kg`, "1RM"]} />
            {series.map((s, i) => (
              <Line
                key={s.id}
                type="monotone"
                dataKey={s.id}
                name={s.label}
                stroke={CHART_COLORS[i % CHART_COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-3 mt-3">
        {series.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2 text-xs">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
            />
            <span className="text-muted-foreground">{s.label}</span>
            <Activity size={12} className="text-muted-foreground" />
            <span className="font-semibold">{s.points[s.points.length - 1]?.rm ?? "—"} kg</span>
          </div>
        ))}
      </div>
    </ChartCard>
  )
}
