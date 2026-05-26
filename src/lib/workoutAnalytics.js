import { startOfWeek, endOfWeek, subWeeks, format, isWithinInterval } from "date-fns"
import { pl } from "date-fns/locale"
import { getWorkoutDate, isWorkoutCompleted, getWorkoutTypeId } from "./workoutUtils"
import { WORKOUT_TYPES } from "./exercises"
import { average1RM } from "./oneRm"

export const CHART_COLORS = ["#fafafa", "#a3a3a3", "#737373", "#525252", "#d4d4d4", "#e5e5e5"]

export function getExerciseName(ex) {
  return ex.displayName || ex.customName?.trim() || ex.name || ""
}

export function calcExerciseVolume(ex) {
  const weight = Number(ex.weight)
  const reps = Number(ex.reps)
  const sets = Number(ex.sets) || 1
  if (!weight || !reps) return 0
  return weight * reps * sets
}

export function calcWorkoutVolume(workout) {
  return (workout.exerciseEntries ?? []).reduce((sum, ex) => sum + calcExerciseVolume(ex), 0)
}

export function getCompletedWorkouts(workouts) {
  return workouts.filter(isWorkoutCompleted)
}

export function computeSummaryStats(workouts) {
  const completed = getCompletedWorkouts(workouts)
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })

  const thisWeek = completed.filter(w => {
    const d = getWorkoutDate(w)
    return d && d >= weekStart
  })

  const feelings = completed.map(w => w.feeling).filter(f => f != null && !Number.isNaN(f))
  const avgFeeling = feelings.length
    ? Math.round((feelings.reduce((a, b) => a + b, 0) / feelings.length) * 10) / 10
    : null

  const totalVolume = completed.reduce((sum, w) => sum + calcWorkoutVolume(w), 0)
  const planned = workouts.filter(w => !isWorkoutCompleted(w)).length

  return {
    totalCompleted: completed.length,
    totalPlanned: planned,
    thisWeekCount: thisWeek.length,
    avgFeeling,
    totalVolume: Math.round(totalVolume),
    exerciseCount: completed.reduce((sum, w) => sum + (w.exerciseEntries?.length ?? 0), 0),
  }
}

function buildWeeklyBuckets(weekCount, aggregate) {
  const now = new Date()
  const buckets = []

  for (let i = weekCount - 1; i >= 0; i--) {
    const start = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 })
    const end = endOfWeek(start, { weekStartsOn: 1 })
    end.setHours(23, 59, 59, 999)

    buckets.push({
      key: format(start, "yyyy-MM-dd"),
      label: format(start, "d MMM", { locale: pl }),
      ...aggregate(start, end),
    })
  }

  return buckets
}

function countWorkoutsInInterval(workouts, start, end) {
  return workouts.filter(w => {
    const d = getWorkoutDate(w)
    return d && isWithinInterval(d, { start, end })
  }).length
}

export function computeWeeklyFrequency(workouts, weekCount = 8) {
  const completed = getCompletedWorkouts(workouts)
  return buildWeeklyBuckets(weekCount, (start, end) => ({
    count: countWorkoutsInInterval(completed, start, end),
  }))
}

export function computeWorkoutTypeDistribution(workouts) {
  const completed = getCompletedWorkouts(workouts)
  const counts = new Map()

  for (const w of completed) {
    const typeId = getWorkoutTypeId(w)
    const label = WORKOUT_TYPES.find(t => t.id === typeId)?.label ?? w.name ?? "Inne"
    counts.set(label, (counts.get(label) ?? 0) + 1)
  }

  return Array.from(counts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

export function computeFeelingTrend(workouts, limit = 12) {
  return getCompletedWorkouts(workouts)
    .filter(w => w.feeling != null && !Number.isNaN(w.feeling))
    .map(w => {
      const d = getWorkoutDate(w)
      return {
        date: d,
        feeling: w.feeling,
        label: d ? format(d, "d MMM", { locale: pl }) : "—",
        name: w.name,
      }
    })
    .filter(w => w.date)
    .sort((a, b) => a.date - b.date)
    .slice(-limit)
}

export function computeVolumeTrend(workouts, weekCount = 8) {
  const completed = getCompletedWorkouts(workouts)
  return buildWeeklyBuckets(weekCount, (start, end) => {
    const volume = completed
      .filter(w => {
        const d = getWorkoutDate(w)
        return d && isWithinInterval(d, { start, end })
      })
      .reduce((sum, w) => sum + calcWorkoutVolume(w), 0)
    return { volume: Math.round(volume) }
  })
}

export function computeTopExercises(workouts, limit = 6) {
  const completed = getCompletedWorkouts(workouts)
  const map = new Map()

  for (const w of completed) {
    for (const ex of w.exerciseEntries ?? []) {
      const name = getExerciseName(ex)
      if (!name) continue
      const entry = map.get(name) ?? { name, count: 0, best1RM: null }
      entry.count += 1
      const rm = average1RM(ex.weight, ex.reps, ex.rpe)
      if (rm != null && (entry.best1RM == null || rm > entry.best1RM)) {
        entry.best1RM = rm
      }
      map.set(name, entry)
    }
  }

  return Array.from(map.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

const SBD_MATCHERS = [
  { id: "squat", keywords: ["przysiad", "squat"] },
  { id: "bench", keywords: ["wyciskanie", "bench"] },
  { id: "deadlift", keywords: ["martwy", "deadlift"] },
]

function matchSbdLift(name) {
  const lower = name.toLowerCase()
  for (const lift of SBD_MATCHERS) {
    if (lift.keywords.some(kw => lower.includes(kw))) return lift.id
  }
  return null
}

export function computeSbdProgress(workouts) {
  const completed = getCompletedWorkouts(workouts)
  const series = { squat: [], bench: [], deadlift: [] }
  const labels = { squat: "Przysiad", bench: "Wyciskanie", deadlift: "Martwy ciąg" }

  for (const w of completed) {
    const d = getWorkoutDate(w)
    if (!d) continue
    const dateLabel = format(d, "d MMM", { locale: pl })

    for (const ex of w.exerciseEntries ?? []) {
      const name = getExerciseName(ex)
      const liftId = matchSbdLift(name)
      if (!liftId) continue
      const rm = average1RM(ex.weight, ex.reps, ex.rpe)
      if (rm == null) continue
      series[liftId].push({ date: d, label: dateLabel, rm, name })
    }
  }

  for (const key of Object.keys(series)) {
    series[key].sort((a, b) => a.date - b.date)
  }

  return Object.entries(series)
    .filter(([, points]) => points.length > 0)
    .map(([id, points]) => ({ id, label: labels[id], points }))
}

export function formatVolume(kg) {
  if (!kg) return "0 kg"
  if (kg >= 1000) return `${(kg / 1000).toLocaleString("pl-PL", { maximumFractionDigits: 1 })} t`
  return `${kg.toLocaleString("pl-PL")} kg`
}

export function formatDashboardContext(workouts) {
  const stats = computeSummaryStats(workouts)

  if (stats.totalCompleted === 0) {
    return "\n\n=== DASHBOARD (podsumowanie treningów) ===\nBrak ukończonych treningów – dashboard jest pusty."
  }

  const lines = ["\n\n=== DASHBOARD (podsumowanie treningów) ==="]

  lines.push("\n--- Kluczowe wskaźniki ---")
  lines.push(`Ukończone treningi: ${stats.totalCompleted}`)
  lines.push(`Zaplanowane treningi: ${stats.totalPlanned}`)
  lines.push(`Treningi w bieżącym tygodniu: ${stats.thisWeekCount}`)
  lines.push(
    `Średnie samopoczucie: ${stats.avgFeeling != null ? `${stats.avgFeeling}/10` : "brak danych"}`
  )
  lines.push(`Łączna objętość (kg × powt. × serie): ${formatVolume(stats.totalVolume)}`)
  lines.push(`Łączna liczba ćwiczeń: ${stats.exerciseCount}`)

  const weeklyFreq = computeWeeklyFrequency(workouts)
  lines.push("\n--- Częstotliwość tygodniowa (ostatnie 8 tygodni) ---")
  weeklyFreq.forEach(w => lines.push(`Tydzień od ${w.label}: ${w.count} treningów`))

  const typeDist = computeWorkoutTypeDistribution(workouts)
  if (typeDist.length) {
    lines.push("\n--- Rozkład typów treningów ---")
    typeDist.forEach(t => lines.push(`${t.name}: ${t.value}×`))
  }

  const volumeTrend = computeVolumeTrend(workouts)
  lines.push("\n--- Objętość tygodniowa ---")
  volumeTrend.forEach(w => lines.push(`Tydzień od ${w.label}: ${formatVolume(w.volume)}`))

  const feelingTrend = computeFeelingTrend(workouts)
  if (feelingTrend.length) {
    lines.push("\n--- Samopoczucie po treningach ---")
    feelingTrend.forEach(f => lines.push(`${f.label} (${f.name}): ${f.feeling}/10`))
  }

  const topExercises = computeTopExercises(workouts)
  if (topExercises.length) {
    lines.push("\n--- Najczęstsze ćwiczenia ---")
    topExercises.forEach((ex, i) => {
      const rm = ex.best1RM != null ? `, szac. 1RM: ~${ex.best1RM} kg` : ""
      lines.push(`${i + 1}. ${ex.name}: ${ex.count} sesji${rm}`)
    })
  }

  const sbdProgress = computeSbdProgress(workouts)
  if (sbdProgress.length) {
    lines.push("\n--- Postęp SBD (szacunkowe 1RM) ---")
    sbdProgress.forEach(s => {
      const history = s.points.map(p => `${p.label}: ~${p.rm} kg`).join("; ")
      lines.push(`${s.label}: ${history}`)
    })
  }

  return lines.join("\n")
}
