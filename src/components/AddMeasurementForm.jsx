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

  const aiSaveLabel = isEdit ? "Zapisz i wyślij do AI" : "Zapisz i analizuj"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider">
            {isEdit ? "Edytuj pomiar" : "Nowy pomiar"}
          </h2>
          <p className="text-muted-foreground text-base mt-0.5">
            {isEdit ? "Zmień dane i zapisz lub wyślij do AI" : "Uzupełnij dane — zapisz sam albo z analizą AI"}
          </p>
        </div>
        <Button variant="ghost" size="icon" className="shrink-0 h-11 w-11" onClick={onCancel} aria-label="Anuluj">
          <X size={20} />
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3 px-4 pt-6 sm:px-6">
          <CardTitle className="text-lg">Data pomiaru</CardTitle>
          <CardDescription className="text-sm">Kiedy wykonałeś pomiar wagi i obwodów</CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-6 sm:px-6">
          <DatePicker value={measurementDate} onChange={setMeasurementDate} status="completed" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 px-4 pt-6 sm:px-6">
          <CardTitle className="text-lg">Waga i wzrost</CardTitle>
          <CardDescription className="text-sm">Waga jest wymagana; wzrost opcjonalny — do obliczenia BMI</CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-6 sm:px-6 grid gap-4 grid-cols-1 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Waga ciała (kg)</label>
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
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Wzrost (cm)</label>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 px-4 pt-6 sm:px-6">
          <CardTitle className="text-lg">Skład i obwody</CardTitle>
          <CardDescription className="text-sm">Opcjonalne — im więcej danych, tym lepsza analiza AI</CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-6 sm:px-6 grid gap-4 grid-cols-1 sm:grid-cols-2">
          {MEASUREMENT_FIELDS.map(({ key, label, unit, step }) => (
            <div key={key} className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
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
        <CardHeader className="pb-3 px-4 pt-6 sm:px-6">
          <CardTitle className="text-lg">Notatka</CardTitle>
          <CardDescription className="text-sm">Opcjonalnie — np. po świętach, rano na czczo, zmiana diety</CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-6 sm:px-6">
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Np. po świętach, rano na czczo, zmiana diety…"
            rows={4}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y min-h-[6rem]"
          />
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive font-medium">{error}</p>}

      <div className="flex flex-col sm:flex-row gap-3 pb-4">
        <Button variant="outline" className="h-12 text-base flex-1" onClick={onCancel}>
          Anuluj
        </Button>
        <Button className="h-12 text-base flex-1" onClick={() => handleSave(false)}>
          Zapisz
        </Button>
        <Button variant="secondary" className="h-12 text-base flex-1 gap-2" onClick={() => handleSave(true)}>
          <Bot size={20} />
          {aiSaveLabel}
        </Button>
      </div>
    </div>
  )
}
