import { useState } from "react"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card"
import { Input } from "./ui/input"
import { DatePicker } from "./ui/date-picker"
import { Plus, X } from "lucide-react"
import { EXERCISE_PRESETS } from "../lib/exercises"
import { buildRecordFromForm, recordToFormState, RPE_OPTIONS } from "../lib/prUtils"
import { toInputDate } from "../lib/workoutUtils"

export default function AddPrForm({ initialRecord, onCancel, onSave }) {
  const isEdit = Boolean(initialRecord)
  const initial = recordToFormState(initialRecord)

  const [presetId, setPresetId] = useState(initial?.presetId ?? "bench")
  const [customName, setCustomName] = useState(initial?.customName ?? "")
  const [weightKg, setWeightKg] = useState(initial?.weightKg ?? "")
  const [reps, setReps] = useState(initial?.reps ?? "")
  const [rpe, setRpe] = useState(initial?.rpe ?? "")
  const [recordDate, setRecordDate] = useState(initial?.recordDate ?? toInputDate())
  const [note, setNote] = useState(initial?.note ?? "")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  const isCustom = presetId === "custom"

  const handleSave = async () => {
    const record = buildRecordFromForm({
      presetId,
      customName,
      weightKg,
      reps,
      rpe,
      recordDate,
      note,
      existing: initialRecord,
    })

    if (!record.exerciseName?.trim()) {
      setError("Podaj nazwę ćwiczenia.")
      return
    }
    if (!Number.isFinite(record.weightKg) || record.weightKg <= 0) {
      setError("Podaj poprawny ciężar (kg).")
      return
    }

    setSaving(true)
    setError("")
    const ok = await onSave(record)
    setSaving(false)
    if (ok) onCancel()
    else setError("Nie udało się zapisać rekordu.")
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg uppercase tracking-wide">
              {isEdit ? "Edytuj rekord" : "Nowy rekord"}
            </CardTitle>
            <CardDescription>
              Zapisz swój najlepszy wynik — AI Coach porówna go z treningami
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9" onClick={onCancel} aria-label="Zamknij">
            <X size={18} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Ćwiczenie</label>
          <div className="flex flex-wrap gap-2">
            {EXERCISE_PRESETS.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPresetId(p.id)}
                className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                  presetId === p.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                {p.id === "custom" ? "Inne" : p.name.split(" (")[0]}
              </button>
            ))}
          </div>
        </div>

        {isCustom && (
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Nazwa ćwiczenia</label>
            <Input
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              placeholder="np. Hip thrust"
            />
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Ciężar (kg)</label>
            <Input
              type="number"
              min="0"
              step="0.5"
              value={weightKg}
              onChange={e => setWeightKg(e.target.value)}
              placeholder="120"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Powtórzenia</label>
            <Input
              type="number"
              min="1"
              value={reps}
              onChange={e => setReps(e.target.value)}
              placeholder="1"
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">RPE</label>
            <select
              value={rpe}
              onChange={e => setRpe(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">—</option>
              {RPE_OPTIONS.map(v => (
                <option key={v} value={String(v)}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Data rekordu</label>
          <DatePicker value={recordDate} onChange={setRecordDate} />
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Notatka (opcjonalnie)</label>
          <Input
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="np. z pasem, zatrzymanie na 2 s"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-2 pt-1">
          <Button onClick={handleSave} disabled={saving} className="gap-1.5">
            <Plus size={16} />
            {isEdit ? "Zapisz zmiany" : "Dodaj rekord"}
          </Button>
          <Button variant="outline" onClick={onCancel} disabled={saving}>
            Anuluj
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
