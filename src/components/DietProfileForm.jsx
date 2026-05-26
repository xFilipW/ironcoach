import { useState } from "react"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card"
import { Input } from "./ui/input"
import { Bot, X, Save } from "lucide-react"
import {
  DIET_GOALS,
  MEAL_TYPES,
  buildProfileFromForm,
  profileToFormState,
} from "../lib/dietUtils"

export default function DietProfileForm({ profile, onSave, onCancel }) {
  const initial = profileToFormState(profile)
  const [goal, setGoal] = useState(initial.goal)
  const [targetCalories, setTargetCalories] = useState(initial.targetCalories)
  const [targetProteinG, setTargetProteinG] = useState(initial.targetProteinG)
  const [targetCarbsG, setTargetCarbsG] = useState(initial.targetCarbsG)
  const [targetFatG, setTargetFatG] = useState(initial.targetFatG)
  const [note, setNote] = useState(initial.note)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const newProfile = buildProfileFromForm({
      goal,
      targetCalories,
      targetProteinG,
      targetCarbsG,
      targetFatG,
      note,
    })
    await onSave(newProfile)
    setSaving(false)
    onCancel()
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg uppercase tracking-wide">Cel i makro</CardTitle>
            <CardDescription>Ustaw cel diety i docelowe kalorie — AI wykorzysta to przy planowaniu jadłospisu</CardDescription>
          </div>
          <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9" onClick={onCancel} aria-label="Zamknij">
            <X size={18} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Cel diety</label>
          <div className="flex flex-wrap gap-2">
            {DIET_GOALS.map(g => (
              <button
                key={g.id}
                type="button"
                onClick={() => setGoal(g.id)}
                className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                  goal === g.id
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Docelowe kalorie (kcal/dzień)</label>
            <Input
              type="number"
              inputMode="numeric"
              min="0"
              placeholder="np. 2800"
              value={targetCalories}
              onChange={e => setTargetCalories(e.target.value)}
              className="h-11 text-base"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Białko (g/dzień)</label>
            <Input
              type="number"
              inputMode="decimal"
              min="0"
              placeholder="np. 180"
              value={targetProteinG}
              onChange={e => setTargetProteinG(e.target.value)}
              className="h-11 text-base"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Węglowodany (g/dzień)</label>
            <Input
              type="number"
              inputMode="decimal"
              min="0"
              placeholder="np. 350"
              value={targetCarbsG}
              onChange={e => setTargetCarbsG(e.target.value)}
              className="h-11 text-base"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Tłuszcze (g/dzień)</label>
            <Input
              type="number"
              inputMode="decimal"
              min="0"
              placeholder="np. 80"
              value={targetFatG}
              onChange={e => setTargetFatG(e.target.value)}
              className="h-11 text-base"
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Notatka</label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="np. alergie, preferencje, ile posiłków dziennie..."
            rows={2}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <Button className="h-11 px-6 text-base gap-2" onClick={handleSave} disabled={saving}>
          <Save size={18} />
          {saving ? "Zapisywanie…" : "Zapisz cel"}
        </Button>
      </CardContent>
    </Card>
  )
}
