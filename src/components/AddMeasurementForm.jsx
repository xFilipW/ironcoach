import { useState } from "react"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card"
import { Input } from "./ui/input"
import { DatePicker } from "./ui/date-picker"
import { Bot, X } from "lucide-react"
import { buildMeasurementsAnalysisPrompt } from "../lib/coachPrompts"
import {
  buildMeasurementFromForm,
  measurementToFormState,
  MEASUREMENT_FIELDS,
} from "../lib/measurementUtils"
import { toInputDate } from "../lib/workoutUtils"

export default function AddMeasurementForm({ initialMeasurement, suggestedHeightCm, onCancel, onSave }) {
  const isEdit = Boolean(initialMeasurement)
  const initial = measurementToFormState(initialMeasurement)

  const [measurementDate, setMeasurementDate] = useState(initial?.measurementDate ?? toInputDate())
  const [weightKg, setWeightKg] = useState(initial?.weightKg ?? "")
  const [heightCm, setHeightCm] = useState(
    initial?.heightCm ?? (suggestedHeightCm != null ? String(suggestedHeightCm) : "")
  )
  const [bodyFatPct, setBodyFatPct] = useState(initial?.bodyFatPct ?? "")
  const [waistCm, setWaistCm] = useState(initial?.waistCm ?? "")
  const [chestCm, setChestCm] = useState(initial?.chestCm ?? "")
  const [hipsCm, setHipsCm] = useState(initial?.hipsCm ?? "")
  const [armCm, setArmCm] = useState(initial?.armCm ?? "")
  const [thighCm, setThighCm] = useState(initial?.thighCm ?? "")
  const [note, setNote] = useState(initial?.note ?? "")
  const [error, setError] = useState("")

  const optionalValues = { bodyFatPct, waistCm, chestCm, hipsCm, armCm, thighCm }
  const setters = { bodyFatPct: setBodyFatPct, waistCm: setWaistCm, chestCm: setChestCm, hipsCm: setHipsCm, armCm: setArmCm, thighCm: setThighCm }

  const buildAndValidate = () => {
    const measurement = buildMeasurementFromForm({
      measurementDate,
      weightKg,
      heightCm,
      note,
      existing: initialMeasurement,
      ...optionalValues,
    })
    if (measurement.weightKg == null || measurement.weightKg <= 0) {
      setError("Podaj poprawną wagę ciała (kg).")
      return null
    }
    setError("")
    return measurement
  }

  const handleSave = (withAi = false) => {
    const measurement = buildAndValidate()
    if (!measurement) return
    onSave(measurement, withAi ? buildMeasurementsAnalysisPrompt(measurement) : null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider">
            {isEdit ? "Edytuj pomiar" : "Nowy pomiar"}
          </h2>
          <p className="text-muted-foreground text-base mt-0.5">
            Waga i obwody — AI Coach wykorzysta je przy planowaniu treningu i diety
          </p>
        </div>
        <Button variant="ghost" size="icon" className="shrink-0 h-11 w-11" onClick={onCancel} aria-label="Anuluj">
          <X size={20} />
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg uppercase tracking-wide">Podstawowe</CardTitle>
          <CardDescription>Data i waga ciała są wymagane; wzrost opcjonalny (do BMI)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Data pomiaru</label>
            <DatePicker value={measurementDate} onChange={setMeasurementDate} status="completed" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Waga ciała (kg)</label>
              <Input
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0"
                placeholder="np. 82.5"
                value={weightKg}
                onChange={e => setWeightKg(e.target.value)}
                className="h-11 text-base"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Wzrost (cm)</label>
              <Input
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0"
                placeholder="np. 180"
                value={heightCm}
                onChange={e => setHeightCm(e.target.value)}
                className="h-11 text-base"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg uppercase tracking-wide">Skład i obwody</CardTitle>
          <CardDescription>Opcjonalne — im więcej danych, tym lepsza analiza AI</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {MEASUREMENT_FIELDS.map(({ key, label, unit, step }) => (
            <div key={key}>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                {label} ({unit})
              </label>
              <Input
                type="number"
                inputMode="decimal"
                step={step}
                min="0"
                placeholder="—"
                value={optionalValues[key]}
                onChange={e => setters[key](e.target.value)}
                className="h-11 text-base"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg uppercase tracking-wide">Notatka</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="np. po świętach, rano na czczo, zmiana diety..."
            rows={3}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-wrap gap-3">
        <Button className="h-11 px-6 text-base" onClick={() => handleSave(false)}>
          Zapisz
        </Button>
        <Button variant="secondary" className="h-11 px-6 text-base gap-2" onClick={() => handleSave(true)}>
          <Bot size={18} />
          Zapisz i analizuj w AI
        </Button>
        <Button variant="ghost" className="h-11 px-6 text-base" onClick={onCancel}>
          Anuluj
        </Button>
      </div>
    </div>
  )
}
