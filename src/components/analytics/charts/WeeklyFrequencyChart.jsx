import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { ChartCard } from "../AnalyticsCards"
import { TOOLTIP_STYLE, AXIS_TICK, GRID_STROKE, CHART_PRIMARY } from "../../../lib/chartTheme"

export default function WeeklyFrequencyChart({ data }) {
  return (
    <ChartCard title="Treningi tygodniowo" description="Ostatnie 8 tygodni">
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
            <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={value => [`${value} treningów`, "Liczba"]}
              labelFormatter={label => `Tydzień od ${label}`}
            />
            <Bar dataKey="count" fill={CHART_PRIMARY} radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
