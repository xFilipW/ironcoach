import { useState } from "react"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card"
import { Input } from "./ui/input"
import { DatePicker } from "./ui/date-picker"
import { Bot, X } from "lucide-react"
import { buildMealAnalysisPrompt } from "../lib/coachPrompts"
import { buildMealFromForm, mealToFormState, MEAL_TYPES } from "../lib/dietUtils"
import { toInputDate } from "../lib/workoutUtils"
import { OptionToggleGroup } from "./workout/OptionToggleGroup"

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

  const aiSaveLabel = isEdit ? "Zapisz i wyślij do AI" : "Zapisz i analizuj"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider">
            {isEdit ? "Edytuj posiłek" : "Nowy posiłek"}
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
          <CardTitle className="text-lg">Data posiłku</CardTitle>
          <CardDescription className="text-sm">Kiedy jadłeś lub planujesz zjeść ten posiłek</CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-6 sm:px-6">
          <DatePicker value={mealDate} onChange={setMealDate} status="completed" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 px-4 pt-6 sm:px-6">
          <CardTitle className="text-lg">Typ posiłku</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-6 sm:px-6">
          <OptionToggleGroup options={MEAL_TYPES} value={mealType} onChange={setMealType} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 px-4 pt-6 sm:px-6">
          <CardTitle className="text-lg">Nazwa i składniki</CardTitle>
          <CardDescription className="text-sm">Nazwa jest wymagana — opis pomoże AI lepiej ocenić posiłek</CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-6 sm:px-6 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nazwa posiłku</label>
            <Input
              placeholder="np. Owsianka z bananem"
              value={name}
              onChange={e => setName(e.target.value)}
              className="h-11 text-base"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Opis / składniki</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="np. 80g płatków owsianych, 200ml mleka, 1 banan, 30g masła orzechowego..."
              rows={4}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y min-h-[6rem]"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 px-4 pt-6 sm:px-6">
          <CardTitle className="text-lg">Makroskładniki</CardTitle>
          <CardDescription className="text-sm">Opcjonalne — im więcej danych, tym lepsza analiza AI</CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-6 sm:px-6 grid gap-4 grid-cols-1 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Kalorie (kcal)</label>
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
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Białko (g)</label>
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
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Węglowodany (g)</label>
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
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tłuszcze (g)</label>
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
        <CardHeader className="pb-3 px-4 pt-6 sm:px-6">
          <CardTitle className="text-lg">Notatka</CardTitle>
          <CardDescription className="text-sm">Opcjonalnie — np. posiłek przedtreningowy, posiłek po treningu</CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-6 sm:px-6">
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Np. posiłek przedtreningowy, posiłek po treningu…"
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
