import { startOfWeek, endOfWeek, startOfDay, isToday } from "date-fns"
import {
  formatDateLabel,
  toInputDate,
  formatInputDate,
  parseInputDateString,
  formatWeekRange,
  getCurrentWeekKey,
  sortWeeksByRelevance,
} from "./workoutUtils"

export { getCurrentWeekKey }

const MEAL_TYPE_ORDER = ["breakfast", "snack", "lunch", "dinner", "other"]

export const STORAGE_KEY = "ironcoach-meals"
export const PROFILE_STORAGE_KEY = "ironcoach-diet-profile"

export const DIET_GOALS = [
  { id: "mass", label: "Masa" },
  { id: "reduction", label: "Redukcja" },
  { id: "mini_cut", label: "Mini cut" },
  { id: "maintenance", label: "Utrzymanie" },
  { id: "recomp", label: "Rekompo" },
]

export const MEAL_TYPES = [
  { id: "breakfast", label: "Śniadanie" },
  { id: "lunch", label: "Obiad" },
  { id: "dinner", label: "Kolacja" },
  { id: "snack", label: "Przekąska" },
  { id: "other", label: "Inne" },
]

export const DEFAULT_DIET_PROFILE = {
  goal: "maintenance",
  targetCalories: null,
  targetProteinG: null,
  targetCarbsG: null,
  targetFatG: null,
  note: "",
}

export function getGoalLabel(goalId) {
  return DIET_GOALS.find(g => g.id === goalId)?.label ?? goalId
}

export function getMealTypeLabel(mealTypeId) {
  return MEAL_TYPES.find(t => t.id === mealTypeId)?.label ?? mealTypeId
}

export function loadMeals() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function loadDietProfileLocal() {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY)
    return raw ? { ...DEFAULT_DIET_PROFILE, ...JSON.parse(raw) } : { ...DEFAULT_DIET_PROFILE }
  } catch {
    return { ...DEFAULT_DIET_PROFILE }
  }
}

export function mealToFormState(meal) {
  if (!meal) return null
  return {
    mealDate: toInputDate(meal.date),
    mealType: meal.mealType ?? "other",
    name: meal.name ?? "",
    description: meal.description ?? "",
    calories: meal.calories != null ? String(meal.calories) : "",
    proteinG: meal.proteinG != null ? String(meal.proteinG) : "",
    carbsG: meal.carbsG != null ? String(meal.carbsG) : "",
    fatG: meal.fatG != null ? String(meal.fatG) : "",
    note: meal.note ?? "",
  }
}

export function profileToFormState(profile) {
  const p = { ...DEFAULT_DIET_PROFILE, ...profile }
  return {
    goal: p.goal,
    targetCalories: p.targetCalories != null ? String(p.targetCalories) : "",
    targetProteinG: p.targetProteinG != null ? String(p.targetProteinG) : "",
    targetCarbsG: p.targetCarbsG != null ? String(p.targetCarbsG) : "",
    targetFatG: p.targetFatG != null ? String(p.targetFatG) : "",
    note: p.note ?? "",
  }
}

function parseOptionalNumber(value) {
  const trimmed = String(value ?? "").trim()
  if (!trimmed) return undefined
  const n = Number(trimmed.replace(",", "."))
  return Number.isFinite(n) ? n : null
}

export function buildMealFromForm({ mealDate, mealType, name, description, calories, proteinG, carbsG, fatG, note, existing }) {
  const id = existing?.id ?? Date.now()
  const date = `${mealDate}T12:00:00.000Z`

  const meal = {
    id,
    date,
    dateLabel: formatDateLabel(mealDate),
    mealType: mealType || "other",
    name: name.trim(),
    description: description?.trim() || undefined,
    note: note?.trim() || undefined,
    eaten: existing?.eaten ?? false,
  }

  const cal = parseOptionalNumber(calories)
  const protein = parseOptionalNumber(proteinG)
  const carbs = parseOptionalNumber(carbsG)
  const fat = parseOptionalNumber(fatG)

  if (cal != null) meal.calories = cal
  if (protein != null) meal.proteinG = protein
  if (carbs != null) meal.carbsG = carbs
  if (fat != null) meal.fatG = fat

  return meal
}

export function isMealEaten(meal) {
  return meal?.eaten === true
}

export function buildProfileFromForm(form) {
  const profile = {
    goal: form.goal || "maintenance",
    note: form.note?.trim() || "",
  }

  const cal = parseOptionalNumber(form.targetCalories)
  const protein = parseOptionalNumber(form.targetProteinG)
  const carbs = parseOptionalNumber(form.targetCarbsG)
  const fat = parseOptionalNumber(form.targetFatG)

  profile.targetCalories = cal ?? null
  profile.targetProteinG = protein ?? null
  profile.targetCarbsG = carbs ?? null
  profile.targetFatG = fat ?? null

  return profile
}

export function formatMealMacros(meal) {
  const parts = []
  if (meal.calories != null) parts.push(`${meal.calories} kcal`)
  if (meal.proteinG != null) parts.push(`B ${meal.proteinG}g`)
  if (meal.carbsG != null) parts.push(`W ${meal.carbsG}g`)
  if (meal.fatG != null) parts.push(`T ${meal.fatG}g`)
  return parts.length ? parts.join(" · ") : "Brak makro"
}

export function sumMealMacros(meals) {
  return meals.reduce(
    (acc, m) => ({
      calories: acc.calories + (m.calories ?? 0),
      proteinG: acc.proteinG + (m.proteinG ?? 0),
      carbsG: acc.carbsG + (m.carbsG ?? 0),
      fatG: acc.fatG + (m.fatG ?? 0),
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
  )
}

export function getMealDate(meal) {
  if (!meal?.date) return undefined
  return parseInputDateString(meal.date.slice(0, 10))
}

function sortMealsByType(meals) {
  return [...meals].sort((a, b) => {
    const typeA = MEAL_TYPE_ORDER.indexOf(a.mealType ?? "other")
    const typeB = MEAL_TYPE_ORDER.indexOf(b.mealType ?? "other")
    if (typeA !== typeB) return typeA - typeB
    return (a.id ?? 0) - (b.id ?? 0)
  })
}

export function groupMealsByWeek(meals) {
  const weekMap = new Map()

  for (const meal of meals) {
    const d = getMealDate(meal)
    if (!d) continue

    const weekStart = startOfWeek(d, { weekStartsOn: 1 })
    const weekKey = formatInputDate(weekStart)

    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, {
        key: weekKey,
        weekStart,
        weekEnd: endOfWeek(d, { weekStartsOn: 1 }),
        days: new Map(),
      })
    }

    const dayKey = formatInputDate(startOfDay(d))
    const week = weekMap.get(weekKey)
    if (!week.days.has(dayKey)) {
      week.days.set(dayKey, {
        key: dayKey,
        date: startOfDay(d),
        dateLabel: meal.dateLabel || formatDateLabel(dayKey),
        meals: [],
      })
    }
    week.days.get(dayKey).meals.push(meal)
  }

  const weeks = Array.from(weekMap.values()).map(week => {
    const days = Array.from(week.days.values()).map(day => {
      const eatenMeals = day.meals.filter(isMealEaten)
      return {
        ...day,
        meals: sortMealsByType(day.meals),
        totals: sumMealMacros(day.meals),
        eatenCount: eatenMeals.length,
        eatenTotals: sumMealMacros(eatenMeals),
        isToday: isToday(day.date),
      }
    })

    days.sort((a, b) => a.date - b.date)

    const allMeals = days.flatMap(d => d.meals)
    return {
      key: week.key,
      weekStart: week.weekStart,
      weekEnd: week.weekEnd,
      label: formatWeekRange(week.weekStart, week.weekEnd),
      days,
      mealCount: allMeals.length,
      totals: sumMealMacros(allMeals),
    }
  })

  return sortWeeksByRelevance(weeks)
}

export function formatDayTotals(totals) {
  if (!totals || totals.calories === 0) return null
  const parts = [`${Math.round(totals.calories)} kcal`]
  if (totals.proteinG > 0) parts.push(`B ${Math.round(totals.proteinG)}g`)
  if (totals.carbsG > 0) parts.push(`W ${Math.round(totals.carbsG)}g`)
  if (totals.fatG > 0) parts.push(`T ${Math.round(totals.fatG)}g`)
  return parts.join(" · ")
}
