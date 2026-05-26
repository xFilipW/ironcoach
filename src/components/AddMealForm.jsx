import { useState } from "react"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card"
import { Input } from "./ui/input"
import { DatePicker } from "./ui/date-picker"
import { Bot, X } from "lucide-react"
import { buildMealAnalysisPrompt } from "../lib/coachPrompts"
import { buildMealFromForm, mealToFormState, MEAL_TYPES } from "../lib/dietUtils"
import { toInputDate } from "../lib/workoutUtils"

export default function AddMealForm({ initialMeal, onCancel, onSave }) {
  const isEdit = Boolean(initialMeal)
  const initial = mealToFormState(initialMeal)

  const [mealDate, setMealDate] = useState(initial?.mealDate ?? toInputDate())
  const [mealType, setMealType] = useState(initial?.mealType ?? "breakfast")
  const [name, setName] = useState(initial?.name ?? "")
  const [description, setDescription] = useState(initial?.description ?? "")
  const [calories, setCalories] = useState(initial?.calories ?? "")
  const [proteinG, setProteinG] = useState(initial?.proteinG ?? "")
  const [carbsG, setCarbsG] = useState(initial?.carbsG ?? "")
  const [fatG, setFatG] = useState(initial?.fatG ?? "")
  const [note, setNote] = useState(initial?.note ?? "")
  const [error, setError] = useState("")

  const buildAndValidate = () => {
    if (!name.trim()) {
      setError("Podaj nazwę posiłku.")
      return null
    }
    const meal = buildMealFromForm({
      mealDate,
      mealType,
      name,
      description,
      calories,
      proteinG,
      carbsG,
      fatG,
      note,
      existing: initialMeal,
    })
    setError("")
    return meal
  }

  const handleSave = (withAi = false) => {
    const meal = buildAndValidate()
    if (!meal) return
    onSave(meal, withAi ? buildMealAnalysisPrompt(meal) : null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider">
            {isEdit ? "Edytuj posiłek" : "Nowy posiłek"}
          </h2>
          <p className="text-muted-foreground text-base mt-0.5">
            Nazwa, opis i makro — AI Coach przeanalizuje Twój jadłospis
          </p>
        </div>
        <Button variant="ghost" size="icon" className="shrink-0 h-11 w-11" onClick={onCancel} aria-label="Anuluj">
          <X size={20} />
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg uppercase tracking-wide">Podstawowe</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Data</label>
            <DatePicker value={mealDate} onChange={setMealDate} status="completed" />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Typ posiłku</label>
            <div className="flex flex-wrap gap-2">
              {MEAL_TYPES.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setMealType(t.id)}
                  className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                    mealType === t.id
                      ? "bg-primary text-primary-foreground"
                      : "border border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Nazwa posiłku</label>
            <Input
              placeholder="np. Owsianka z bananem"
              value={name}
              onChange={e => setName(e.target.value)}
              className="h-11 text-base"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Opis / składniki</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="np. 80g płatków owsianych, 200ml mleka, 1 banan, 30g masła orzechowego..."
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg uppercase tracking-wide">Makroskładniki</CardTitle>
          <CardDescription>Opcjonalne — im więcej danych, tym lepsza analiza AI</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Kalorie (kcal)</label>
            <Input
              type="number"
              inputMode="numeric"
              min="0"
              placeholder="np. 650"
              value={calories}
              onChange={e => setCalories(e.target.value)}
              className="h-11 text-base"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Białko (g)</label>
            <Input
              type="number"
              inputMode="decimal"
              min="0"
              placeholder="np. 35"
              value={proteinG}
              onChange={e => setProteinG(e.target.value)}
              className="h-11 text-base"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Węglowodany (g)</label>
            <Input
              type="number"
              inputMode="decimal"
              min="0"
              placeholder="np. 80"
              value={carbsG}
              onChange={e => setCarbsG(e.target.value)}
              className="h-11 text-base"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Tłuszcze (g)</label>
            <Input
              type="number"
              inputMode="decimal"
              min="0"
              placeholder="np. 18"
              value={fatG}
              onChange={e => setFatG(e.target.value)}
              className="h-11 text-base"
            />
          </div>
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
            placeholder="np. posiłek przedtreningowy, posiłek posił treningu..."
            rows={2}
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
