import { useEffect, useState } from "react"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card"
import { DatePicker } from "./ui/date-picker"
import { Bot, Plus, X } from "lucide-react"
import { EXERCISE_PRESETS, WORKOUT_TYPES } from "../lib/exercises"
import { buildAnalysisPrompt } from "../lib/coachPrompts"
import {
  buildWorkoutFromForm,
  workoutToFormState,
  WORKOUT_STATUSES,
  clampWorkoutDate,
  toInputDate,
  emptyExercise,
} from "../lib/workoutUtils"
import { OptionToggleGroup } from "./workout/OptionToggleGroup"
import FeelingPicker from "./workout/FeelingPicker"
import ExerciseFormRow from "./workout/ExerciseFormRow"

export default function AddWorkoutForm({ initialWorkout, onCancel, onSave }) {
  const isEdit = Boolean(initialWorkout)
  const initial = workoutToFormState(initialWorkout)

  const [status, setStatus] = useState(initial?.status ?? "planned")
  const [workoutDate, setWorkoutDate] = useState(initial?.workoutDate ?? toInputDate())
  const [workoutType, setWorkoutType] = useState(initial?.workoutType ?? "push")
  const [feeling, setFeeling] = useState(initial?.feeling ?? 7)
  const [note, setNote] = useState(initial?.note ?? "")
  const [exercises, setExercises] = useState(initial?.exercises ?? [emptyExercise()])
  const [error, setError] = useState("")
  const isCompleted = status === "completed"

  useEffect(() => {
    setWorkoutDate(prev => clampWorkoutDate(prev, status))
  }, [status])

  const updateExercise = (id, patch) => {
    setExercises(prev =>
      prev.map(ex => {
        if (ex.id !== id) return ex
        const next = { ...ex, ...patch }
        if (patch.presetId != null) {
          const preset = EXERCISE_PRESETS.find(p => p.id === patch.presetId)
          next.name = preset?.id === "custom" ? "" : preset?.name ?? ""
          if (preset?.id !== "custom") next.customName = ""
        }
        return next
      })
    )
  }

  const addExercise = () => setExercises(prev => [...prev, emptyExercise()])

  const removeExercise = id => {
    setExercises(prev => (prev.length <= 1 ? prev : prev.filter(ex => ex.id !== id)))
  }

  const buildAndValidate = () => {
    const workout = buildWorkoutFromForm({
      workoutType,
      status,
      feeling,
      note,
      exercises,
      workoutDate,
      existing: initialWorkout,
    })
    if (!workout.exercises.length) {
      setError("Dodaj co najmniej jedno ćwiczenie z nazwą oraz ciężarem lub powtórzeniami.")
      return null
    }
    setError("")
    return workout
  }

  const handleSave = (withAi = false) => {
    const workout = buildAndValidate()
    if (!workout) return
    onSave(workout, withAi ? buildAnalysisPrompt(workout) : null)
  }

  const aiSaveLabel = isEdit
    ? "Zapisz i wyślij do AI"
    : isCompleted
      ? "Zapisz i analizuj"
      : "Zapisz i oceń plan"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider">
            {isEdit ? "Edytuj trening" : "Nowy trening"}
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
        <CardHeader className="pb-3 px-6 pt-6">
          <CardTitle className="text-lg">Status treningu</CardTitle>
          <CardDescription className="text-sm">
            Nadchodzący — planujesz zrobić · Ukończony — już wykonany
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <OptionToggleGroup options={WORKOUT_STATUSES} value={status} onChange={setStatus} layout="grid" />
          <div className="mt-4 space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {isCompleted ? "Data ukończenia treningu" : "Data planowanego treningu"}
            </label>
            <DatePicker
              value={workoutDate}
              onChange={setWorkoutDate}
              status={status}
              placeholder={isCompleted ? "Wybierz datę ukończenia" : "Wybierz datę planu"}
            />
          </div>
        </CardContent>
      </Card>

      {isCompleted && (
        <Card>
          <CardHeader className="pb-3 px-6 pt-6">
            <CardTitle className="text-lg">Samopoczucie po treningu</CardTitle>
            <CardDescription className="text-sm">Jak się czułeś po zakończeniu? (1 = bardzo źle, 10 = świetnie)</CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <FeelingPicker value={feeling} onChange={setFeeling} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3 px-6 pt-6">
          <CardTitle className="text-lg">Notatka</CardTitle>
          <CardDescription className="text-sm">
            Opcjonalnie — np. co bolało, jak się czułeś, co poprawić następnym razem
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Np. lekki ból w lewym kolanie przy przysiadzie, ostatnia seria na granicy…"
            rows={4}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y min-h-[6rem]"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 px-6 pt-6">
          <CardTitle className="text-lg">Rodzaj treningu</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <OptionToggleGroup options={WORKOUT_TYPES} value={workoutType} onChange={setWorkoutType} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 px-6 pt-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg">Ćwiczenia</CardTitle>
              <CardDescription className="text-sm">Dodawaj kolejne przyciskiem +</CardDescription>
            </div>
            <Button type="button" variant="outline" className="gap-2 h-10" onClick={addExercise}>
              <Plus size={18} />
              Ćwiczenie
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6 space-y-4">
          {exercises.map((ex, index) => (
            <ExerciseFormRow
              key={ex.id}
              exercise={ex}
              index={index}
              canRemove={exercises.length > 1}
              onUpdate={updateExercise}
              onRemove={removeExercise}
            />
          ))}
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
