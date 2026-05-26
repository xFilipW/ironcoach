import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card"
import { BarChart3 } from "lucide-react"

export function StatCard({ icon: Icon, label, value, hint }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="text-2xl font-black mt-1 truncate">{value}</p>
            {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
          </div>
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <Icon size={18} className="text-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function ChartCard({ title, description, children, className = "" }) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export function EmptyAnalytics() {
  return (
    <div className="rounded-lg border border-dashed border-border p-10 text-center">
      <BarChart3 size={40} className="mx-auto text-muted-foreground mb-4" />
      <p className="font-bold text-lg">Brak danych do analizy</p>
      <p className="text-muted-foreground text-sm mt-2 max-w-md mx-auto">
        Ukończ kilka treningów z ćwiczeniami — wtedy pojawią się wykresy częstotliwości, objętości i postępów.
      </p>
    </div>
  )
}
