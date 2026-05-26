import { buildMealFromForm } from "./dietUtils"
import { toInputDate } from "./workoutUtils"

export const DIET_PLAN_QUICK_PROMPTS = ["Rozpisz mi dietę na ten tydzień na masę"]

const DIET_PLAN_INTENT =
  /rozpisz\s+(mi\s+)?(diet[ęe]|jadłospis|plan\s+(żywieniow|diet)|posiłk)|plan\s+(diet|żywieniow)|jadłospis\s+(na\s+)?(tydzień|masę|redukcj)|diet[aę]\s+na\s+(masę|redukcj|mini\s*cut|tydzień)|dodaj\s+(mi\s+)?posiłk|zapisz\s+(mi\s+)?posiłk|wprowadź\s+(mi\s+)?posiłk/i

const PLAN_BLOCK_RE = /```diet-plan\s*([\s\S]*?)```/i
const TRUNCATED_SUFFIX = /\*\(Odpowiedź została skrócona[\s\S]*$/i
const MEAL_HEADER_RE =
  /^(Śniadanie|Drugie\s+[Śś]niadanie(?:\/Przekąska)?|Przekąska|Obiad|Kolacja)\s*\(\s*ok\.?\s*(\d+)\s*kcal(?:\s*\|\s*B:\s*([\d.,]+)\s*g)?(?:\s*\|\s*W:\s*([\d.,]+)\s*g)?(?:\s*\|\s*T:\s*([\d.,]+)\s*g)?\s*\)/i
const DAY_HEADER_RE = /^DZIEŃ\s+\d+/i
const DATE_IN_HEADER_RE = /(\d{1,2})\s+(stycznia|lutego|marca|kwietnia|maja|czerwca|lipca|sierpnia|września|października|listopada|grudnia)(?:\s+(\d{4}))?/i

const PL_MONTHS = {
  stycznia: 1,
  lutego: 2,
  marca: 3,
  kwietnia: 4,
  maja: 5,
  czerwca: 6,
  lipca: 7,
  sierpnia: 8,
  września: 9,
  października: 10,
  listopada: 11,
  grudnia: 12,
}

function parseMacro(value) {
  if (value == null || value === "") return undefined
  const n = Number(String(value).replace(",", "."))
  return Number.isFinite(n) ? Math.round(n) : undefined
}

function mealTypeFromLabel(label) {
  const l = label.toLowerCase()
  if (l.includes("drugie") && l.includes("śniadanie")) return "snack"
  if (l.startsWith("śniadanie")) return "breakfast"
  if (l.includes("przekąska")) return "snack"
  if (l.includes("obiad")) return "lunch"
  if (l.includes("kolacja")) return "dinner"
  return "other"
}

function parseDateFromDayHeader(header, fallbackYear = new Date().getFullYear()) {
  const match = header.match(DATE_IN_HEADER_RE)
  if (!match) return null
  const day = Number(match[1])
  const month = PL_MONTHS[match[2].toLowerCase()]
  const year = match[3] ? Number(match[3]) : fallbackYear
  if (!month || !day) return null
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

function mealNameFromDescription(description, mealLabel) {
  const trimmed = description.trim()
  if (!trimmed) return mealLabel
  const first = trimmed.split(/[.,(]/)[0].trim()
  if (first.length >= 3 && first.length <= 80) return first
  return `${mealLabel} — ${trimmed.slice(0, 60).trim()}${trimmed.length > 60 ? "…" : ""}`
}

export function isDietPlanIntent(text, messages = []) {
  const trimmed = text?.trim() ?? ""
  if (DIET_PLAN_INTENT.test(trimmed)) return true
  if (/^kontynuuj$/i.test(trimmed)) {
    const lastAssistant = [...messages].reverse().find(m => m.role === "assistant")
    if (!lastAssistant) return false
    return (
      TRUNCATED_SUFFIX.test(lastAssistant.text) ||
      DAY_HEADER_RE.test(lastAssistant.text) ||
      Boolean(lastAssistant.dietPlan) ||
      Boolean(getEffectiveDietPlan(lastAssistant))
    )
  }
  return false
}

export function extractDietPlanFromText(text) {
  if (!text) return null

  const clean = text
    .replace(PLAN_BLOCK_RE, "")
    .replace(TRUNCATED_SUFFIX, "")
    .trim()

  if (!DAY_HEADER_RE.test(clean)) return null

  const actions = []
  let currentDate = null
  let pendingMeal = null

  const flushMeal = () => {
    if (!pendingMeal || !currentDate) return
    actions.push({
      op: "add",
      meal: {
        date: currentDate,
        mealType: pendingMeal.mealType,
        name: pendingMeal.name,
        description: pendingMeal.description || undefined,
        calories: pendingMeal.calories,
        proteinG: pendingMeal.proteinG,
        carbsG: pendingMeal.carbsG,
        fatG: pendingMeal.fatG,
      },
    })
    pendingMeal = null
  }

  for (const rawLine of clean.split("\n")) {
    const line = rawLine.trim()
    if (!line || line.startsWith("---") || line.startsWith("*Cel:")) continue

    if (DAY_HEADER_RE.test(line)) {
      flushMeal()
      currentDate = parseDateFromDayHeader(line) ?? currentDate
      continue
    }

    const mealMatch = line.match(MEAL_HEADER_RE)
    if (mealMatch) {
      flushMeal()
      const [, label, calories, proteinG, carbsG, fatG] = mealMatch
      pendingMeal = {
        mealType: mealTypeFromLabel(label),
        name: label,
        description: "",
        calories: parseMacro(calories),
        proteinG: parseMacro(proteinG),
        carbsG: parseMacro(carbsG),
        fatG: parseMacro(fatG),
      }
      continue
    }

    if (pendingMeal && /^[\*\-•]/.test(line)) {
      const content = line.replace(/^[\*\-•]\s*/, "").trim()
      pendingMeal.description = pendingMeal.description
        ? `${pendingMeal.description}\n${content}`
        : content
      pendingMeal.name = mealNameFromDescription(pendingMeal.description, pendingMeal.name)
    }
  }

  flushMeal()

  if (!actions.length) return null
  return {
    summary: `Jadłospis (${actions.length} posiłków) — wyekstrahowano z odpowiedzi AI`,
    actions,
  }
}

export function getEffectiveDietPlan(message) {
  if (message?.dietPlan?.actions?.length) return message.dietPlan
  return extractDietPlanFromText(message?.text)
}

export function parseDietPlanFromReply(text) {
  const match = text?.match(PLAN_BLOCK_RE)
  let displayText = text ?? ""
  let plan = null

  if (match) {
    displayText = text.replace(PLAN_BLOCK_RE, "").trim()
    try {
      const parsed = JSON.parse(match[1].trim())
      const actions = Array.isArray(parsed?.actions) ? parsed.actions : null
      if (actions?.length) {
        plan = {
          summary: typeof parsed.summary === "string" ? parsed.summary : null,
          actions,
        }
      }
    } catch {
      // fallback poniżej
    }
  }

  if (!plan) {
    plan = extractDietPlanFromText(text)
    if (plan && match) {
      // zostaw displayText bez bloku JSON
    } else if (plan) {
      displayText = text.replace(TRUNCATED_SUFFIX, "").trim()
    }
  }

  return { displayText, plan }
}

function mealFromAiPayload(aiMeal, existing) {
  const dateStr = aiMeal.date || toInputDate()
  return buildMealFromForm({
    mealDate: dateStr.length > 10 ? dateStr.slice(0, 10) : dateStr,
    mealType: aiMeal.mealType ?? "other",
    name: aiMeal.name ?? "Posiłek",
    description: aiMeal.description ?? "",
    calories: aiMeal.calories != null ? String(aiMeal.calories) : "",
    proteinG: aiMeal.proteinG != null ? String(aiMeal.proteinG) : "",
    carbsG: aiMeal.carbsG != null ? String(aiMeal.carbsG) : "",
    fatG: aiMeal.fatG != null ? String(aiMeal.fatG) : "",
    note: aiMeal.note ?? "",
    existing,
  })
}

export async function applyDietPlan(plan, meals, handlers) {
  const { addMeal, updateMeal, deleteMeal } = handlers
  const result = { added: 0, updated: 0, deleted: 0, errors: [] }
  let current = [...meals]

  for (let i = 0; i < plan.actions.length; i++) {
    const action = plan.actions[i]
    const op = action?.op

    try {
      if (op === "delete") {
        const id = Number(action.mealId)
        if (!id) throw new Error("Brak ID posiłku do usunięcia")
        if (!(await deleteMeal(id))) throw new Error(`Nie udało się usunąć posiłku #${id}`)
        current = current.filter(m => m.id !== id)
        result.deleted++
        continue
      }

      if (op === "update") {
        const id = Number(action.mealId)
        const existing = current.find(m => m.id === id)
        if (!existing) throw new Error(`Nie znaleziono posiłku #${id}`)
        const meal = mealFromAiPayload(action.meal ?? {}, existing)
        if (!meal.name?.trim()) throw new Error(`Posiłek #${id}: brak nazwy`)
        if (!(await updateMeal(meal))) throw new Error(`Nie udało się zaktualizować posiłku #${id}`)
        current = current.map(m => (m.id === meal.id ? meal : m))
        result.updated++
        continue
      }

      if (op === "add") {
        const meal = mealFromAiPayload(action.meal ?? {}, null)
        meal.id = Date.now() + i
        if (!meal.name?.trim()) throw new Error("Nowy posiłek: brak nazwy")
        if (!(await addMeal(meal))) throw new Error("Nie udało się dodać posiłku")
        current = [meal, ...current]
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

export function formatDietApplyResult(result) {
  const parts = []
  if (result.added) parts.push(`dodano ${result.added}`)
  if (result.updated) parts.push(`zaktualizowano ${result.updated}`)
  if (result.deleted) parts.push(`usunięto ${result.deleted}`)
  if (!parts.length && !result.errors.length) return "Brak zmian do zastosowania."
  const ok = parts.length ? `Zastosowano plan: ${parts.join(", ")}.` : ""
  const err = result.errors.length ? ` Błędy: ${result.errors.join("; ")}` : ""
  return (ok + err).trim()
}
