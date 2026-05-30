import { EXERCISE_PRESETS } from "./exercises"
import { formatDateLabel, toInputDate } from "./workoutUtils"

export const RPE_OPTIONS = [6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10]

function parseRpe(value) {
  if (value == null || value === "") return null
  const n = Number(String(value).replace(",", "."))
  if (!Number.isFinite(n) || n < 6 || n > 10) return null
  return n
}

export function matchPresetId(name) {
  if (!name) return "custom"
  const lower = name.toLowerCase()
  const preset = EXERCISE_PRESETS.find(
    p => p.id !== "custom" && (lower.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(lower))
  )
  return preset?.id ?? "custom"
}

export function exerciseNamesMatch(a, b) {
  if (!a?.trim() || !b?.trim()) return false
  const presetA = matchPresetId(a)
  const presetB = matchPresetId(b)
  if (presetA !== "custom" && presetA === presetB) return true
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}

export function findRecordByExerciseName(records, exerciseName) {
  if (!exerciseName?.trim()) return null
  return records.find(r => exerciseNamesMatch(r.exerciseName, exerciseName)) ?? null
}

export function getExerciseDisplayName(presetId, customName, name) {
  if (presetId === "custom") return customName?.trim() || name?.trim() || ""
  const preset = EXERCISE_PRESETS.find(p => p.id === presetId)
  return preset?.name ?? name?.trim() ?? customName?.trim() ?? ""
}

export function recordToFormState(record) {
  if (!record) return null
  const presetId = record.presetId ?? matchPresetId(record.exerciseName)
  const preset = EXERCISE_PRESETS.find(p => p.id === presetId)
  return {
    presetId,
    customName: preset?.id === "custom" ? record.exerciseName ?? "" : "",
    weightKg: record.weightKg != null ? String(record.weightKg) : "",
    reps: record.reps != null ? String(record.reps) : "",
    rpe: record.rpe != null ? String(record.rpe) : "",
    recordDate: toInputDate(record.date),
    note: record.note ?? "",
  }
}

export function buildRecordFromForm({ presetId, customName, weightKg, reps, rpe, recordDate, note, existing }) {
  const exerciseName = getExerciseDisplayName(presetId, customName, "")
  const weight = Number(String(weightKg).replace(",", "."))
  const repCount = reps !== "" && reps != null ? Number(String(reps).replace(",", ".")) : null

  const dateIso = recordDate
    ? new Date(`${recordDate}T12:00:00`).toISOString()
    : existing?.date ?? new Date().toISOString()

  return {
    id: existing?.id ?? Date.now(),
    presetId,
    exerciseName,
    weightKg: weight,
    reps: repCount,
    rpe: parseRpe(rpe),
    date: dateIso,
    dateLabel: formatDateLabel(recordDate || dateIso),
    note: note?.trim() || null,
  }
}

export function formatRecordSummary(record) {
  const reps = record.reps != null ? ` × ${record.reps}` : ""
  const rpe = record.rpe != null ? ` @ RPE ${record.rpe}` : ""
  return `${record.weightKg} kg${reps}${rpe}`
}

export function formatPersonalRecordsContext(records) {
  if (!records?.length) {
    return "\n\n=== REKORDY OSOBISTE (PR) (zakładka Rekordy) ===\nBrak zapisanych rekordów."
  }

  const lines = records
    .slice()
    .sort((a, b) => a.exerciseName.localeCompare(b.exerciseName, "pl"))
    .map(
      r =>
        `ID: ${r.id} | ${r.exerciseName}: ${formatRecordSummary(r)} | data: ${r.dateLabel || r.date}${r.note?.trim() ? ` | notatka: ${r.note.trim()}` : ""}`
    )

  return `\n\n=== REKORDY OSOBISTE (PR) (zakładka Rekordy) ===
Każdy rekord ma pole ID — używaj go w recordId przy update.
${lines.join("\n")}`
}

function parseNumber(value, fallback = null) {
  if (value == null || value === "") return fallback
  const n = Number(String(value).replace(",", "."))
  return Number.isFinite(n) ? n : fallback
}

export function getWorkoutExercisePerformances(workout) {
  const entries = workout?.exerciseEntries ?? []
  return entries
    .map(ex => {
      const exerciseName = (ex.displayName || ex.customName?.trim() || ex.name || "").trim()
      const weightKg = parseNumber(ex.weight)
      const reps = parseNumber(ex.reps, 1)
      return {
        exerciseName,
        presetId: matchPresetId(exerciseName),
        weightKg,
        reps,
        rpe: parseRpe(ex.rpe),
      }
    })
    .filter(ex => ex.exerciseName && ex.weightKg != null && ex.weightKg > 0)
}

export function isNewPersonalRecord(performance, existingRecord) {
  if (!existingRecord) return true
  const newWeight = performance.weightKg
  const oldWeight = parseNumber(existingRecord.weightKg)
  const newReps = performance.reps ?? 1
  const oldReps = existingRecord.reps ?? 1
  if (oldWeight == null || newWeight == null) return false
  return newReps <= oldReps && newWeight > oldWeight
}

export function detectWorkoutPersonalRecords(workout, records = []) {
  return getWorkoutExercisePerformances(workout)
    .map(performance => {
      const existing = findRecordByExerciseName(records, performance.exerciseName)
      if (!isNewPersonalRecord(performance, existing)) return null
      return { performance, existing }
    })
    .filter(Boolean)
}

export function buildPrUpdatePlanFromWorkout(workout, records = []) {
  const detected = detectWorkoutPersonalRecords(workout, records)
  if (!detected.length) return null

  const workoutDate = toInputDate(workout.date)

  return {
    summary: detected
      .map(({ performance }) => `${performance.exerciseName}: ${performance.weightKg} kg`)
      .join(", "),
    actions: detected.map(({ performance, existing }) => ({
      op: existing ? "update" : "add",
      ...(existing ? { recordId: existing.id } : {}),
      record: {
        exerciseName: existing?.exerciseName ?? performance.exerciseName,
        presetId: performance.presetId,
        weightKg: performance.weightKg,
        reps: performance.reps,
        rpe: performance.rpe,
        date: workoutDate,
      },
    })),
  }
}

export function formatWorkoutPrComparisonForPrompt(workout, records = []) {
  const detected = detectWorkoutPersonalRecords(workout, records)
  if (!detected.length) {
    return "\n\n**Porównanie z zapisanymi PR (obliczone przez aplikację):** brak nowych rekordów względem zakładki Rekordy."
  }

  const lines = detected.map(({ performance, existing }) => {
    const before = existing ? formatRecordSummary(existing) : "brak zapisanego PR"
    const after = formatRecordSummary({
      weightKg: performance.weightKg,
      reps: performance.reps,
      rpe: performance.rpe,
    })
    const idHint = existing ? ` (ID rekordu: ${existing.id})` : " (nowy rekord)"
    return `- ${performance.exerciseName}: było ${before} → teraz ${after}${idHint} → **NOWY PR**`
  })

  return `\n\n**Porównanie z zapisanymi PR (obliczone przez aplikację — uwzględnij WSZYSTKIE poniższe w analizie i gratulacjach):**
${lines.join("\n")}`
}
