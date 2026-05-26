import { WORKOUT_TYPES, EXERCISE_PRESETS } from "./exercises"
import { buildWorkoutFromForm } from "./workoutUtils"

export const WORKOUT_PLAN_QUICK_PROMPTS = ["Ułóż mi plan na kolejny tydzień"]

const WORKOUT_PLAN_INTENT =
  /ułóż\s+(mi\s+)?plan|plan\s+(na\s+)?(kolejny\s+)?tydzień|zaplanuj\s+(mi\s+)?(trening|tydzień)|harmonogram\s+trening|rozkład\s+trening|dodaj\s+(mi\s+)?trening|zmień\s+(mi\s+)?trening|edytuj\s+(mi\s+)?trening|przenieś\s+trening|usuń\s+(mi\s+)?trening|wprowadź\s+(zmiany\s+)?w\s+(dzienniku|planie)|zaktualizuj\s+(mi\s+)?plan/i

const PLAN_BLOCK_RE = /```workout-plan\s*([\s\S]*?)```/i

export function isWorkoutPlanIntent(text) {
  return WORKOUT_PLAN_INTENT.test(text?.trim() ?? "")
}

export function parseWorkoutPlanFromReply(text) {
  const match = text?.match(PLAN_BLOCK_RE)
  if (!match) return { displayText: text, plan: null }

  const displayText = text.replace(PLAN_BLOCK_RE, "").trim()
  try {
    const parsed = JSON.parse(match[1].trim())
    const actions = Array.isArray(parsed?.actions) ? parsed.actions : null
    if (!actions?.length) return { displayText, plan: null }
    return {
      displayText,
      plan: {
        summary: typeof parsed.summary === "string" ? parsed.summary : null,
        actions,
      },
    }
  } catch {
    return { displayText, plan: null }
  }
}

function matchPresetId(name) {
  if (!name) return "custom"
  const lower = name.toLowerCase()
  const preset = EXERCISE_PRESETS.find(
    p => p.id !== "custom" && (lower.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(lower))
  )
  return preset?.id ?? "custom"
}

function exerciseFromAi(ex) {
  const presetId = matchPresetId(ex.name)
  const preset = EXERCISE_PRESETS.find(p => p.id === presetId)
  return {
    id: crypto.randomUUID(),
    presetId,
    name: preset?.id === "custom" ? "" : preset?.name ?? "",
    customName: preset?.id === "custom" ? String(ex.name ?? "").trim() : "",
    weight: ex.weight != null && ex.weight !== "" ? String(ex.weight) : "",
    reps: ex.reps != null && ex.reps !== "" ? String(ex.reps) : "",
    sets: ex.sets != null ? String(ex.sets) : "1",
    rpe: ex.rpe != null ? String(ex.rpe) : "8",
  }
}

function resolveWorkoutTypeId(workout) {
  if (workout.workoutTypeId && WORKOUT_TYPES.some(t => t.id === workout.workoutTypeId)) {
    return workout.workoutTypeId
  }
  const label = workout.type || workout.name
  const found = WORKOUT_TYPES.find(t => t.label.toLowerCase() === String(label).toLowerCase())
  return found?.id ?? "other"
}

export function buildWorkoutFromAiPayload(aiWorkout, existing) {
  const exercises = (aiWorkout.exercises ?? []).map(exerciseFromAi).filter(ex => ex.customName || ex.name)
  return buildWorkoutFromForm({
    workoutType: resolveWorkoutTypeId(aiWorkout),
    status: aiWorkout.status === "completed" ? "completed" : "planned",
    feeling: aiWorkout.feeling ?? 7,
    note: aiWorkout.note ?? "",
    exercises,
    workoutDate: aiWorkout.date,
    existing,
  })
}

export async function applyWorkoutPlan(plan, workouts, handlers) {
  const { addWorkout, updateWorkout, deleteWorkout } = handlers
  const result = { added: 0, updated: 0, deleted: 0, errors: [] }
  let current = [...workouts]

  for (let i = 0; i < plan.actions.length; i++) {
    const action = plan.actions[i]
    const op = action?.op

    try {
      if (op === "delete") {
        const id = Number(action.workoutId)
        if (!id) throw new Error("Brak ID treningu do usunięcia")
        if (!(await deleteWorkout(id))) throw new Error(`Nie udało się usunąć treningu #${id}`)
        current = current.filter(w => w.id !== id)
        result.deleted++
        continue
      }

      if (op === "update") {
        const id = Number(action.workoutId)
        const existing = current.find(w => w.id === id)
        if (!existing) throw new Error(`Nie znaleziono treningu #${id}`)
        const workout = buildWorkoutFromAiPayload(action.workout ?? {}, existing)
        if (!workout.exercises?.length) throw new Error(`Trening #${id}: brak ćwiczeń`)
        if (!(await updateWorkout(workout))) throw new Error(`Nie udało się zaktualizować treningu #${id}`)
        current = current.map(w => (w.id === workout.id ? workout : w))
        result.updated++
        continue
      }

      if (op === "add") {
        const workout = buildWorkoutFromAiPayload(action.workout ?? {}, null)
        workout.id = Date.now() + i
        if (!workout.exercises?.length) throw new Error("Nowy trening: brak ćwiczeń")
        if (!(await addWorkout(workout))) throw new Error("Nie udało się dodać treningu")
        current = [workout, ...current]
        result.added++
        continue
      }

      throw new Error(`Nieznana operacja: ${op}`)
    } catch (err) {
      result.errors.push(err?.message || "Nieznany błąd")
    }
  }

  return result
}

export function formatApplyResult(result) {
  const parts = []
  if (result.added) parts.push(`dodano ${result.added}`)
  if (result.updated) parts.push(`zaktualizowano ${result.updated}`)
  if (result.deleted) parts.push(`usunięto ${result.deleted}`)
  if (!parts.length && !result.errors.length) return "Brak zmian do zastosowania."
  const ok = parts.length ? `Zastosowano plan: ${parts.join(", ")}.` : ""
  const err = result.errors.length ? ` Błędy: ${result.errors.join("; ")}` : ""
  return (ok + err).trim()
}
