import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { ChartCard } from "../AnalyticsCards"
import { TOOLTIP_STYLE, AXIS_TICK, GRID_STROKE, CHART_PRIMARY } from "../../../lib/chartTheme"

export default function FeelingTrendChart({ data }) {
  return (
    <ChartCard title="Samopoczucie po treningu" description="Ostatnie sesje z oceną">
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          Dodaj ocenę samopoczucia przy ukończonych treningach
        </p>
      ) : (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
              <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <YAxis domain={[1, 10]} allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={value => [`${value}/10`, "Samopoczucie"]}
                labelFormatter={(_, payload) => {
                  const p = payload?.[0]?.payload
                  return p ? `${p.label} · ${p.name}` : ""
                }}
              />
              <Line
                type="monotone"
                dataKey="feeling"
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
