import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { ChartCard } from "../AnalyticsCards"
import { TOOLTIP_STYLE, AXIS_TICK, GRID_STROKE, CHART_PRIMARY } from "../../../lib/chartTheme"
import { formatVolume } from "../../../lib/workoutAnalytics"

export default function VolumeTrendChart({ data }) {
  return (
    <ChartCard title="Objętość tygodniowa" description="Suma kg × powt. × serie">
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_PRIMARY} stopOpacity={0.3} />
                <stop offset="100%" stopColor={CHART_PRIMARY} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
            <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} />
            <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={value => [formatVolume(value), "Objętość"]}
              labelFormatter={label => `Tydzień od ${label}`}
            />
            <Area type="monotone" dataKey="volume" stroke={CHART_PRIMARY} strokeWidth={2} fill="url(#volumeGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
