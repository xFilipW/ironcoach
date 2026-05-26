import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { ChartCard } from "../AnalyticsCards"
import { TOOLTIP_STYLE, AXIS_TICK, GRID_STROKE } from "../../../lib/chartTheme"

export default function DailyCaloriesChart({ data }) {
  return (
    <ChartCard title="Kalorie dzienne" description="Plan vs zjedzone — ostatnie dni z posiłkami">
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Dodaj posiłki w zakładce Dieta</p>
      ) : (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
              <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} tickFormatter={v => `${v}`} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(value, name) => [`${value} kcal`, name === "planned" ? "Plan" : "Zjedzone"]}
              />
              <Legend
                wrapperStyle={{ fontSize: "12px", color: "hsl(0 0% 63.9%)" }}
                formatter={value => (value === "planned" ? "Plan" : "Zjedzone")}
              />
              <Bar dataKey="planned" fill="hsl(0 0% 45%)" radius={[4, 4, 0, 0]} name="planned" />
              <Bar dataKey="eaten" fill="#fafafa" radius={[4, 4, 0, 0]} name="eaten" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  )
}
