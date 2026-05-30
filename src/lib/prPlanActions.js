import { EXERCISE_PRESETS } from "./exercises"
import { buildRecordFromForm, matchPresetId, findRecordByExerciseName } from "./prUtils"

const PLAN_BLOCK_RE = /```pr-update\s*([\s\S]*?)```/i

export function parsePrUpdateFromReply(text) {
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

function buildRecordFromAiPayload(aiRecord, existing) {
  const presetId = aiRecord.presetId ?? matchPresetId(aiRecord.exerciseName)
  const preset = EXERCISE_PRESETS.find(p => p.id === presetId)
  const customName = preset?.id === "custom" ? String(aiRecord.exerciseName ?? "").trim() : ""

  return buildRecordFromForm({
    presetId,
    customName,
    weightKg: aiRecord.weightKg,
    reps: aiRecord.reps,
    rpe: aiRecord.rpe,
    recordDate: aiRecord.date,
    note: aiRecord.note ?? "",
    existing,
  })
}

function resolveExistingRecord(current, action) {
  const id = Number(action.recordId)
  if (Number.isFinite(id) && id > 0) {
    const byId = current.find(r => r.id === id)
    if (byId) return byId
  }

  return findRecordByExerciseName(current, action.record?.exerciseName)
}

export async function applyPrUpdate(plan, records, handlers) {
  const { addRecord, updateRecord } = handlers
  const result = { added: 0, updated: 0, errors: [] }
  let current = [...records]

  for (let i = 0; i < plan.actions.length; i++) {
    const action = plan.actions[i]
    const recordPayload = action?.record ?? {}

    try {
      if (!recordPayload.exerciseName?.trim()) {
        throw new Error("Brak nazwy ćwiczenia w akcji PR")
      }

      const existing = resolveExistingRecord(current, action)

      if (existing) {
        const record = buildRecordFromAiPayload(recordPayload, existing)
        if (!(await updateRecord(record))) {
          throw new Error(`Nie udało się zaktualizować rekordu: ${record.exerciseName}`)
        }
        current = current.map(r => (r.id === record.id ? record : r))
        result.updated++
        continue
      }

      const record = buildRecordFromAiPayload(recordPayload, null)
      record.id = Date.now() + i
      if (!(await addRecord(record))) {
        throw new Error(`Nie udało się dodać rekordu: ${record.exerciseName}`)
      }
      current = [record, ...current]
      result.added++
    } catch (err) {
      result.errors.push(err?.message || "Nieznany błąd")
    }
  }

  return result
}

export function formatPrApplyResult(result) {
  const parts = []
  if (result.added) parts.push(`dodano ${result.added}`)
  if (result.updated) parts.push(`zaktualizowano ${result.updated}`)
  if (!parts.length && !result.errors.length) return "Brak zmian do zastosowania."
  const ok = parts.length ? `Zaktualizowano rekordy: ${parts.join(", ")}.` : ""
  const err = result.errors.length ? ` Błędy: ${result.errors.join("; ")}` : ""
  return (ok + err).trim()
}
