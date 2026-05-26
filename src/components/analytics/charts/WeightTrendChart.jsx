import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { ChartCard } from "../AnalyticsCards"
import { TOOLTIP_STYLE, AXIS_TICK, GRID_STROKE, CHART_PRIMARY } from "../../../lib/chartTheme"

export default function WeightTrendChart({ data }) {
  return (
    <ChartCard title="Trend wagi" description="Ostatnie pomiary ciała">
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Dodaj pomiary w zakładce Pomiary</p>
      ) : (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
              <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <YAxis
                domain={["auto", "auto"]}
                tick={AXIS_TICK}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => `${v} kg`}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={value => [`${value} kg`, "Waga"]}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.dateLabel ?? ""}
              />
              <Line
                type="monotone"
                dataKey="weightKg"
                stroke={CHART_PRIMARY}
                strokeWidth={2}
                dot={{ fill: CHART_PRIMARY, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  )
}
