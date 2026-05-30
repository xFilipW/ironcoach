import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card"
import { Input } from "./ui/input"
import { Badge } from "./ui/badge"
import { Calculator, TrendingUp } from "lucide-react"
import { calcAllFormulas, average1RM, effectiveReps } from "../lib/oneRm"

export const EXERCISES = [
  { id: "bench", name: "Wyciskanie", subtitle: "Bench Press" },
  { id: "squat", name: "Przysiad", subtitle: "Squat" },
  { id: "deadlift", name: "Martwy ciąg", subtitle: "Deadlift" },
  { id: "ohp", name: "Wycisk. nad głową", subtitle: "OHP" },
  { id: "row", name: "Wiosłowanie", subtitle: "Barbell Row" },
  { id: "frontSquat", name: "Przysiad przedni", subtitle: "Front Squat" },
  { id: "rdl", name: "RDL", subtitle: "Romanian Deadlift" },
  { id: "other", name: "Inne", subtitle: "Dowolne ćwiczenie" },
]

const EMPTY = { weight: "", reps: "", rpe: "8" }

function formatKg(value) {
  if (value == null) return "—"
  return `${value.toLocaleString("pl-PL", { maximumFractionDigits: 1 })} kg`
}

export default function OneRmCalculator() {
  const [exerciseId, setExerciseId] = useState("bench")
  const [lifts, setLifts] = useState(
    Object.fromEntries(EXERCISES.map(ex => [ex.id, { ...EMPTY }]))
  )

  const exercise = EXERCISES.find(ex => ex.id === exerciseId) ?? EXERCISES[0]
  const data = lifts[exerciseId]
  const { weight, reps, rpe } = data

  const setData = next => setLifts(prev => ({ ...prev, [exerciseId]: next }))

  const eff = effectiveReps(reps, rpe)
  const allFormulas = useMemo(() => calcAllFormulas(weight, reps, rpe), [weight, reps, rpe])
  const avgRm = useMemo(() => average1RM(weight, reps, rpe), [weight, reps, rpe])
  const hasInput = weight && reps

  const summary = useMemo(
    () =>
      EXERCISES.map(ex => ({
        ...ex,
        avg: average1RM(lifts[ex.id].weight, lifts[ex.id].reps, lifts[ex.id].rpe),
      })).filter(row => row.avg != null),
    [lifts]
  )

  return (
    <div className="space-y-7">
      <div>
        <div className="flex items-center gap-4 mb-1 min-w-0">
          <div className="w-12 h-12 rounded-md bg-primary flex items-center justify-center shrink-0">
            <Calculator size={24} className="text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-wider">Kalkulator 1RM</h1>
            <p className="text-muted-foreground text-base mt-0.5">
              Epley, Brzycki, Lander i Lombardi — wszystkie wyniki naraz
            </p>
          </div>
        </div>
      </div>

      <Card className="bg-muted/30">
        <CardContent className="pt-6 pb-6 px-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Ćwiczenie</p>
            <select
              value={exerciseId}
              onChange={e => setExerciseId(e.target.value)}
              className="h-11 w-full sm:min-w-[220px] sm:w-auto rounded-md border border-input bg-background px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Wybierz ćwiczenie z listy"
            >
              {EXERCISES.map(ex => (
                <option key={ex.id} value={ex.id}>
                  {ex.name} ({ex.subtitle})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2.5">
            {EXERCISES.map(ex => (
              <button
                key={ex.id}
                type="button"
                onClick={() => setExerciseId(ex.id)}
                className={`rounded-lg px-3 sm:px-4 py-2.5 text-left transition-all border w-full sm:w-auto ${
                  exerciseId === ex.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border hover:bg-accent text-foreground"
                }`}
              >
                <span className="text-sm font-bold uppercase tracking-wide block">{ex.name}</span>
                <span
                  className={`text-xs block mt-0.5 ${
                    exerciseId === ex.id ? "text-primary-foreground/75" : "text-muted-foreground"
                  }`}
                >
                  {ex.subtitle}
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4 px-4 pt-6 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <CardTitle className="text-lg">{exercise.name}</CardTitle>
              <CardDescription className="text-sm">{exercise.subtitle}</CardDescription>
            </div>
            {hasInput && avgRm != null && (
              <div className="sm:text-right shrink-0">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Średnia 1RM</p>
                <p className="text-3xl sm:text-4xl font-black text-primary leading-none mt-1">{formatKg(avgRm)}</p>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-5 px-4 pb-6 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Ciężar (kg)
              </label>
              <Input
                type="number"
                min="0"
                step="0.5"
                placeholder="0"
                value={weight}
                onChange={e => setData({ ...data, weight: e.target.value })}
                className="h-11 text-base"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Powtórzenia
              </label>
              <Input
                type="number"
                min="1"
                max="36"
                step="1"
                placeholder="0"
                value={reps}
                onChange={e => setData({ ...data, reps: e.target.value })}
                className="h-11 text-base"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">RPE</label>
              <select
                value={rpe}
                onChange={e => setData({ ...data, rpe: e.target.value })}
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {[6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10].map(v => (
                  <option key={v} value={String(v)}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {hasInput && eff != null && (
            <div className="flex flex-wrap items-center gap-2.5 text-sm text-muted-foreground">
              <Badge variant="secondary" className="font-mono text-sm px-2.5 py-1">
                Skuteczne powt.: {eff}
              </Badge>
              <span className="text-sm">
                {reps} @ RPE {rpe} → jak przy ~{eff} powt. do upadku
              </span>
            </div>
          )}

          {hasInput ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-border">
              {allFormulas.map(f => (
                <div key={f.id} className="rounded-lg bg-muted/50 border border-border px-4 py-4 text-center">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{f.name}</p>
                  <p className="text-2xl font-black mt-2 text-primary">{formatKg(f.value)}</p>
                  <p className="text-[11px] font-mono text-muted-foreground mt-1.5">{f.hint}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-base text-muted-foreground pt-2 border-t border-border">
              Wpisz ciężar i powtórzenia, aby policzyć 1RM.
            </p>
          )}
        </CardContent>
      </Card>

      {summary.length > 1 && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3 px-4 pt-6 sm:px-6">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-primary" />
              <CardTitle className="text-lg">Inne ćwiczenia</CardTitle>
            </div>
            <CardDescription className="text-sm">Średnia ze wszystkich wzorów — kliknij, aby przełączyć</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-6 sm:px-6">
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3">
              {summary
                .filter(row => row.id !== exerciseId)
                .map(row => (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => setExerciseId(row.id)}
                    className="rounded-lg bg-muted px-4 py-3 text-left hover:bg-accent transition-colors w-full sm:w-auto"
                  >
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{row.name}</p>
                    <p className="text-lg font-black mt-1">{formatKg(row.avg)}</p>
                  </button>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
