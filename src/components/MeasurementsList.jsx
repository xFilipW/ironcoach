import { useState, lazy, Suspense } from "react"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import { Badge } from "./ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog"
import TabLoader from "./TabLoader"
import { Scale, Plus, Bot, Pencil, Trash2, StickyNote, TrendingDown, TrendingUp, Minus } from "lucide-react"
import { formatMeasurementSummary } from "../lib/measurementUtils"
import { computeMeasurementStats } from "../lib/measurementAnalytics"

const AddMeasurementForm = lazy(() => import("./AddMeasurementForm"))

function DeltaBadge({ delta, label }) {
  if (delta == null) return null
  const Icon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus
  const variant = delta > 0 ? "destructive" : delta < 0 ? "default" : "secondary"
  const sign = delta > 0 ? "+" : ""
  return (
    <Badge variant={variant} className="text-xs gap-1">
      <Icon size={10} />
      {label}: {sign}
      {delta} kg
    </Badge>
  )
}

function MeasurementCard({ m, onEdit, onDeleteRequest, onAnalyze }) {
  return (
    <Card>
      <CardContent className="px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
          <div className="flex items-start gap-4 min-w-0 flex-1">
            <div className="w-12 h-12 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0">
              <Scale size={22} />
            </div>
            <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-base">{m.weightKg} kg</p>
              {m.bodyFatPct != null && (
                <Badge variant="secondary" className="text-xs">
                  {m.bodyFatPct}% BF
                </Badge>
              )}
              {m.heightCm != null && (
                <Badge variant="outline" className="text-xs">
                  {m.heightCm} cm
                </Badge>
              )}
              {m.note?.trim() && (
                <Badge variant="outline" className="text-xs gap-1">
                  <StickyNote size={10} />
                  Notatka
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{m.dateLabel}</p>
            <p className="text-sm text-muted-foreground mt-1">{formatMeasurementSummary(m)}</p>
            {m.note?.trim() && (
              <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap rounded-md bg-muted/40 px-3 py-2">
                {m.note.trim()}
              </p>
            )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0 self-end sm:self-start">
            {onAnalyze && (
              <button
                type="button"
                onClick={() => onAnalyze(m)}
                className="text-muted-foreground hover:text-primary transition-colors p-1.5 rounded-md hover:bg-accent"
                aria-label="Analizuj w AI"
                title="Analizuj w AI"
              >
                <Bot size={18} />
              </button>
            )}
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(m.id)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-accent"
                aria-label="Edytuj pomiar"
              >
                <Pencil size={18} />
              </button>
            )}
            {onDeleteRequest && (
              <button
                type="button"
                onClick={() => onDeleteRequest(m)}
                className="text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded-md hover:bg-destructive/10"
                aria-label="Usuń pomiar"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function MeasurementsList({
  measurements,
  onAddMeasurement,
  onUpdateMeasurement,
  onDeleteMeasurement,
  onAnalyzeMeasurement,
  onAnalyzeAll,
}) {
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const editingMeasurement = measurements.find(m => m.id === editingId)
  const stats = computeMeasurementStats(measurements)

  const closeForm = () => {
    setShowAdd(false)
    setEditingId(null)
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    onDeleteMeasurement(deleteTarget.id)
    setDeleteTarget(null)
  }

  if (showAdd || editingId) {
    return (
      <Suspense fallback={<TabLoader label="Ładowanie formularza…" />}>
        <AddMeasurementForm
          initialMeasurement={editingMeasurement}
          suggestedHeightCm={measurements.find(m => m.heightCm != null)?.heightCm}
          onCancel={closeForm}
          onSave={(measurement, prompt) => {
            if (editingId) onUpdateMeasurement(measurement, prompt)
            else onAddMeasurement(measurement, prompt)
            closeForm()
          }}
        />
      </Suspense>
    )
  }

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 rounded-md bg-primary flex items-center justify-center shrink-0">
            <Scale size={24} className="text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-wider">Pomiary</h1>
            <p className="text-muted-foreground text-base mt-0.5">Waga i obwody ciała</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 w-full sm:flex-row sm:w-auto">
          {measurements.length > 0 && onAnalyzeAll && (
            <Button variant="secondary" className="gap-2 h-11 px-4 text-base w-full sm:w-auto" onClick={onAnalyzeAll}>
              <Bot size={18} />
              Analizuj w AI
            </Button>
          )}
          <Button variant="outline" className="gap-2 h-11 px-4 text-base w-full sm:w-auto" onClick={() => setShowAdd(true)}>
            <Plus size={18} />
            Dodaj pomiar
          </Button>
        </div>
      </div>

      {stats.latest && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="px-5 py-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Aktualna waga</p>
              <p className="text-2xl font-black mt-1">{stats.latest.weightKg} kg</p>
              <p className="text-xs text-muted-foreground mt-1">{stats.latest.dateLabel}</p>
              {stats.bmi != null && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  BMI {stats.bmi}
                  {stats.heightCm != null ? ` · ${stats.heightCm} cm` : ""}
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="px-5 py-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Zmiana 7 dni</p>
              <p className="text-2xl font-black mt-1">
                {stats.weightDelta7d != null ? `${stats.weightDelta7d > 0 ? "+" : ""}${stats.weightDelta7d} kg` : "—"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="px-5 py-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Zmiana 30 dni</p>
              <p className="text-2xl font-black mt-1">
                {stats.weightDelta30d != null ? `${stats.weightDelta30d > 0 ? "+" : ""}${stats.weightDelta30d} kg` : "—"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {stats.latest && (stats.weightDelta7d != null || stats.weightDelta30d != null) && (
        <div className="flex flex-wrap gap-2">
          <DeltaBadge delta={stats.weightDelta7d} label="7 dni" />
          <DeltaBadge delta={stats.weightDelta30d} label="30 dni" />
          {stats.weightDelta != null && stats.count >= 2 && (
            <DeltaBadge delta={stats.weightDelta} label="Łącznie" />
          )}
        </div>
      )}

      {measurements.length === 0 ? (
        <p className="text-muted-foreground text-base mt-5">
          Brak pomiarów. Dodaj wagę i obwody — AI Coach będzie mógł ocenić, czy schudłeś lub przytyłeś, i
          dostosować trening (np. więcej cardio) oraz dietę.
        </p>
      ) : (
        <div className="space-y-4">
          {measurements.map(m => (
            <MeasurementCard
              key={m.id}
              m={m}
              onEdit={setEditingId}
              onDeleteRequest={setDeleteTarget}
              onAnalyze={onAnalyzeMeasurement}
            />
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usunąć pomiar?</AlertDialogTitle>
            <AlertDialogDescription>
              Pomiar z {deleteTarget?.dateLabel} ({deleteTarget?.weightKg} kg) zostanie trwale usunięty.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
