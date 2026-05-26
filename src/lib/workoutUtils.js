import { startOfDay, startOfWeek, endOfWeek, format, isSameMonth, isSameYear } from "date-fns"
import { pl } from "date-fns/locale"
import { WORKOUT_TYPES, EXERCISE_PRESETS } from "./exercises"

export const WORKOUT_STATUSES = [
  { id: "planned", label: "Nadchodzący" },
  { id: "completed", label: "Ukończony" },
]

export function emptyExercise() {
  return {
    id: crypto.randomUUID(),
    presetId: "deadlift",
    name: "Martwy ciąg",
    customName: "",
    weight: "",
    reps: "",
    sets: "1",
    rpe: "8",
  }
}

export function getWorkoutStatus(workout) {
  if (workout?.status === "planned" || workout?.status === "completed") return workout.status
  return workout?.done ? "completed" : "planned"
}

export function isWorkoutCompleted(workout) {
  return getWorkoutStatus(workout) === "completed"
}

export function formatInputDate(date) {
  return format(date, "yyyy-MM-dd")
}

export function parseInputDateString(value) {
  if (!value) return undefined
  const d = new Date(`${value}T12:00:00`)
  return Number.isNaN(d.getTime()) ? undefined : d
}

export function toInputDate(value) {
  if (!value) return formatInputDate(new Date())
  const d = value.includes("T") ? new Date(value) : new Date(`${value}T12:00:00`)
  if (Number.isNaN(d.getTime())) return formatInputDate(new Date())
  return formatInputDate(d)
}

export function getWorkoutDateDisabledMatcher(status) {
  const today = startOfDay(new Date())
  if (status === "planned") return { before: today }
  if (status === "completed") return { after: today }
  return undefined
}

export function clampWorkoutDate(dateStr, status) {
  if (!dateStr) return toInputDate()
  const today = startOfDay(new Date())
  const d = startOfDay(new Date(`${dateStr}T12:00:00`))
  if (Number.isNaN(d.getTime())) return toInputDate()
  if (status === "planned" && d < today) return toInputDate(today)
  if (status === "completed" && d > today) return toInputDate(today)
  return dateStr
}

export function formatDateLabel(dateInput) {
  const d = dateInput?.includes("T")
    ? new Date(dateInput)
    : new Date(`${dateInput}T12:00:00`)
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleDateString("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export function formatExerciseLine(ex) {
  const name = ex.customName?.trim() || ex.name
  if (!name) return null
  const sets = ex.sets ? `${ex.sets}×` : ""
  const w = ex.weight ? `${ex.weight} kg` : "—"
  const r = ex.reps || "—"
  const rpe = ex.rpe ? `@ RPE ${ex.rpe} (ost. seria)` : ""
  return `${name}: ${sets}${w} × ${r} ${rpe}`.trim()
}

export function getWorkoutTypeId(workout) {
  if (workout.workoutTypeId) return workout.workoutTypeId
  const found = WORKOUT_TYPES.find(t => t.label === workout.type || t.label === workout.name)
  return found?.id ?? "other"
}

export function workoutToFormState(workout) {
  if (!workout) return null

  const exercises =
    workout.exerciseEntries?.length > 0
      ? workout.exerciseEntries.map(ex => {
          const displayName = ex.displayName || ex.customName?.trim() || ex.name || ""
          const preset = EXERCISE_PRESETS.find(
            p => p.id !== "custom" && (p.name === displayName || displayName.includes(p.name))
          )
          if (preset) {
            return {
              id: crypto.randomUUID(),
              presetId: preset.id,
              name: preset.name,
              customName: "",
              weight: ex.weight != null ? String(ex.weight) : "",
              reps: ex.reps != null ? String(ex.reps) : "",
              sets: ex.sets != null ? String(ex.sets) : "1",
              rpe: ex.rpe != null ? String(ex.rpe) : "8",
            }
          }
          return {
            id: crypto.randomUUID(),
            presetId: "custom",
            name: "",
            customName: displayName,
            weight: ex.weight != null ? String(ex.weight) : "",
            reps: ex.reps != null ? String(ex.reps) : "",
            sets: ex.sets != null ? String(ex.sets) : "1",
            rpe: ex.rpe != null ? String(ex.rpe) : "8",
          }
        })
      : [emptyExercise()]

  return {
    workoutType: getWorkoutTypeId(workout),
    status: getWorkoutStatus(workout),
    workoutDate: toInputDate(workout.date),
    feeling: workout.feeling ?? 7,
    note: workout.note ?? "",
    exercises,
  }
}

export function buildWorkoutFromForm({ workoutType, status, feeling, note, exercises, workoutDate, existing }) {
  const typeLabel = WORKOUT_TYPES.find(t => t.id === workoutType)?.label ?? workoutType
  const validExercises = exercises
    .map(ex => ({
      ...ex,
      displayName: ex.customName?.trim() || ex.name,
      sets: ex.sets ? String(Math.max(1, parseInt(ex.sets, 10) || 1)) : "1",
    }))
    .filter(ex => ex.displayName && (ex.weight || ex.reps))

  const lines = validExercises.map(ex => formatExerciseLine(ex)).filter(Boolean)

  const dateIso = workoutDate
    ? new Date(`${workoutDate}T12:00:00`).toISOString()
    : existing?.date ?? new Date().toISOString()
  const dateStr = formatDateLabel(workoutDate || dateIso)

  const isCompleted = status === "completed"
  const trimmedNote = note?.trim() || null

  return {
    id: existing?.id ?? Date.now(),
    name: typeLabel,
    type: typeLabel,
    workoutTypeId: workoutType,
    status,
    feeling: isCompleted ? Number(feeling) : null,
    note: trimmedNote,
    done: isCompleted,
    date: dateIso,
    dateLabel: dateStr,
    duration: `${validExercises.length} ćw.`,
    exercises: lines,
    exerciseEntries: validExercises,
  }
}

export function getWorkoutDate(workout) {
  if (!workout?.date) return null
  const d = new Date(workout.date)
  return Number.isNaN(d.getTime()) ? null : d
}

export function formatWeekRange(weekStart, weekEnd) {
  const sameMonth = isSameMonth(weekStart, weekEnd)
  const sameYear = isSameYear(weekStart, weekEnd)
  if (sameMonth && sameYear) {
    return `${format(weekStart, "d", { locale: pl })}–${format(weekEnd, "d MMMM yyyy", { locale: pl })}`
  }
  if (sameYear) {
    return `${format(weekStart, "d MMM", { locale: pl })} – ${format(weekEnd, "d MMM yyyy", { locale: pl })}`
  }
  return `${format(weekStart, "d MMM yyyy", { locale: pl })} – ${format(weekEnd, "d MMM yyyy", { locale: pl })}`
}

export function groupWorkoutsByWeek(workouts, { newestFirst = true } = {}) {
  const map = new Map()

  for (const w of workouts) {
    const d = getWorkoutDate(w)
    if (!d) continue
    const weekStart = startOfWeek(d, { weekStartsOn: 1 })
    const key = formatInputDate(weekStart)
    if (!map.has(key)) {
      map.set(key, {
        key,
        weekStart,
        weekEnd: endOfWeek(d, { weekStartsOn: 1 }),
        workouts: [],
      })
    }
    map.get(key).workouts.push(w)
  }

  const weeks = Array.from(map.values()).map(week => ({
    ...week,
    label: formatWeekRange(week.weekStart, week.weekEnd),
  }))

  weeks.sort((a, b) => (newestFirst ? b.weekStart - a.weekStart : a.weekStart - b.weekStart))

  for (const week of weeks) {
    week.workouts.sort((a, b) => {
      const da = getWorkoutDate(a)?.getTime() ?? 0
      const db = getWorkoutDate(b)?.getTime() ?? 0
      return newestFirst ? db - da : da - db
    })
  }

  return weeks
}

export function getCurrentWeekKey() {
  return formatInputDate(startOfWeek(new Date(), { weekStartsOn: 1 }))
}

export const STORAGE_KEY = "ironcoach-workouts"

export function loadWorkouts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}
