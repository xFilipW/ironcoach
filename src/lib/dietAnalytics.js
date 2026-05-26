import { format, startOfDay, subDays } from "date-fns"
import { pl } from "date-fns/locale"
import {
  getGoalLabel,
  getMealTypeLabel,
  formatMealMacros,
  sumMealMacros,
  isMealEaten,
} from "./dietUtils"

function sortedByDate(meals) {
  return [...meals].sort((a, b) => new Date(b.date) - new Date(a.date))
}

function mealsForDate(meals, dateStr) {
  return meals.filter(m => m.date.startsWith(dateStr))
}

function dateKey(date) {
  return format(startOfDay(new Date(date)), "yyyy-MM-dd")
}

export function computeDietStats(meals, profile) {
  if (!meals?.length) {
    return { todayMeals: [], todayTotals: null, weekAvgCalories: null, count: 0 }
  }

  const sorted = sortedByDate(meals)
  const today = dateKey(new Date())
  const todayMeals = mealsForDate(sorted, today)
  const todayEatenMeals = todayMeals.filter(isMealEaten)
  const todayTotals = todayMeals.length ? sumMealMacros(todayMeals) : null
  const todayEatenTotals = todayEatenMeals.length ? sumMealMacros(todayEatenMeals) : null

  const dailyTotals = []
  for (let i = 0; i < 7; i++) {
    const d = format(subDays(new Date(), i), "yyyy-MM-dd")
    const dayMeals = mealsForDate(sorted, d)
    if (dayMeals.length) {
      const totals = sumMealMacros(dayMeals)
      if (totals.calories > 0) dailyTotals.push(totals.calories)
    }
  }

  const weekAvgCalories =
    dailyTotals.length > 0
      ? Math.round(dailyTotals.reduce((a, b) => a + b, 0) / dailyTotals.length)
      : null

  return {
    todayMeals,
    todayTotals,
    todayEatenTotals,
    todayEatenCount: todayEatenMeals.length,
    weekAvgCalories,
    count: sorted.length,
    profile,
  }
}

function formatMealBlock(meal, index) {
  const lines = [
    `Data: ${meal.dateLabel || "—"}`,
    `Typ: ${getMealTypeLabel(meal.mealType)}`,
    `Nazwa: ${meal.name}`,
  ]
  if (meal.description?.trim()) lines.push(`Opis: ${meal.description.trim()}`)
  lines.push(`Makro: ${formatMealMacros(meal)}`)
  if (meal.note?.trim()) lines.push(`Notatka: ${meal.note.trim()}`)
  return `[Posiłek #${index + 1}]\n${lines.join("\n")}`
}

function formatProfileBlock(profile) {
  if (!profile) return "Brak ustawionego celu diety."
  const lines = [`Cel: ${getGoalLabel(profile.goal)}`]
  if (profile.targetCalories != null) lines.push(`Docelowe kalorie: ${profile.targetCalories} kcal/dzień`)
  const macros = []
  if (profile.targetProteinG != null) macros.push(`B ${profile.targetProteinG}g`)
  if (profile.targetCarbsG != null) macros.push(`W ${profile.targetCarbsG}g`)
  if (profile.targetFatG != null) macros.push(`T ${profile.targetFatG}g`)
  if (macros.length) lines.push(`Docelowe makro: ${macros.join(", ")}`)
  if (profile.note?.trim()) lines.push(`Notatka: ${profile.note.trim()}`)
  return lines.join("\n")
}

export function formatDietContext(meals, profile) {
  const sections = ["\n\n=== DIETA (zakładka Dieta) ==="]

  sections.push("\n--- Profil i cel ---")
  sections.push(formatProfileBlock(profile))

  if (!meals?.length) {
    sections.push("\nBrak zapisanych posiłków.")
    return sections.join("\n")
  }

  const sorted = sortedByDate(meals)
  const stats = computeDietStats(meals, profile)
  const recent = sorted.slice(0, 30)

  sections.push(`\nLiczba wpisów: ${stats.count}`)
  if (stats.todayTotals) {
    sections.push(
      `Dzisiaj (${format(new Date(), "d MMM yyyy", { locale: pl })}): ${stats.todayTotals.calories} kcal, B ${stats.todayTotals.proteinG}g, W ${stats.todayTotals.carbsG}g, T ${stats.todayTotals.fatG}g`
    )
  }
  if (stats.weekAvgCalories != null) {
    sections.push(`Średnia kaloryczność (7 dni): ${stats.weekAvgCalories} kcal/dzień`)
  }

  sections.push("\n--- Ostatnie posiłki (od najnowszego) ---")
  recent.forEach((m, i) => sections.push(`\n${formatMealBlock(m, i)}`))

  return sections.join("\n")
}
