import { differenceInDays } from "date-fns"
import { MEASUREMENT_FIELDS, computeBmi } from "./measurementUtils"

function sortedByDate(measurements) {
  return [...measurements].sort((a, b) => new Date(b.date) - new Date(a.date))
}

function getLatestHeight(sorted) {
  return sorted.find(m => m.heightCm != null)?.heightCm ?? null
}

function findBaseline(sorted, daysAgo) {
  if (sorted.length < 2) return null
  const latest = new Date(sorted[0].date)
  const target = sorted.find(m => differenceInDays(latest, new Date(m.date)) >= daysAgo)
  return target ?? sorted[sorted.length - 1]
}

export function computeMeasurementStats(measurements) {
  if (!measurements?.length) {
    return { latest: null, oldest: null, weightDelta: null, weightDelta7d: null, weightDelta30d: null, count: 0 }
  }

  const sorted = sortedByDate(measurements)
  const latest = sorted[0]
  const oldest = sorted[sorted.length - 1]
  const baseline7 = findBaseline(sorted, 7)
  const baseline30 = findBaseline(sorted, 30)

  const delta = (from, to) =>
    from?.weightKg != null && to?.weightKg != null
      ? Math.round((to.weightKg - from.weightKg) * 10) / 10
      : null

  const heightCm = latest.heightCm ?? getLatestHeight(sorted)
  const bmi = computeBmi(latest.weightKg, heightCm)

  return {
    latest,
    oldest,
    count: sorted.length,
    heightCm,
    bmi,
    weightDelta: sorted.length >= 2 ? delta(oldest, latest) : null,
    weightDelta7d: baseline7 && baseline7.id !== latest.id ? delta(baseline7, latest) : null,
    weightDelta30d: baseline30 && baseline30.id !== latest.id ? delta(baseline30, latest) : null,
  }
}

function formatDelta(delta) {
  if (delta == null) return "—"
  const sign = delta > 0 ? "+" : ""
  return `${sign}${delta} kg`
}

function formatMeasurementBlock(m, index) {
  const lines = [`Data: ${m.dateLabel || "—"}`, `Waga: ${m.weightKg} kg`]
  if (m.heightCm != null) lines.push(`Wzrost: ${m.heightCm} cm`)
  const bmi = computeBmi(m.weightKg, m.heightCm)
  if (bmi != null) lines.push(`BMI: ${bmi}`)
  for (const { key, label, unit } of MEASUREMENT_FIELDS) {
    if (m[key] != null) lines.push(`${label}: ${m[key]} ${unit}`)
  }
  if (m.note?.trim()) lines.push(`Notatka: ${m.note.trim()}`)
  return `[Pomiar #${index + 1}]\n${lines.join("\n")}`
}

export function formatMeasurementsContext(measurements) {
  if (!measurements?.length) {
    return "\n\n=== POMIARY CIAŁA (zakładka Pomiary) ===\nBrak zapisanych pomiarów."
  }

  const sorted = sortedByDate(measurements)
  const stats = computeMeasurementStats(measurements)
  const recent = sorted.slice(0, 20)

  const sections = [
    "\n\n=== POMIARY CIAŁA (zakładka Pomiary) ===",
    `Liczba wpisów: ${stats.count}`,
    `Ostatni pomiar: ${stats.latest.weightKg} kg (${stats.latest.dateLabel})`,
  ]

  if (stats.heightCm != null) sections.push(`Wzrost: ${stats.heightCm} cm`)
  if (stats.bmi != null) sections.push(`BMI (ostatni pomiar): ${stats.bmi}`)

  if (stats.weightDelta7d != null) sections.push(`Zmiana wagi (7 dni): ${formatDelta(stats.weightDelta7d)}`)
  if (stats.weightDelta30d != null) sections.push(`Zmiana wagi (30 dni): ${formatDelta(stats.weightDelta30d)}`)
  if (stats.weightDelta != null && stats.count >= 2) {
    sections.push(`Zmiana wagi (od pierwszego wpisu): ${formatDelta(stats.weightDelta)}`)
  }

  sections.push("\n--- Ostatnie pomiary (od najnowszego) ---")
  recent.forEach((m, i) => sections.push(`\n${formatMeasurementBlock(m, i)}`))

  if (sorted.length > 20) {
    sections.push(`\n(... i ${sorted.length - 20} starszych wpisów)`)
  }

  return sections.join("\n")
}

export function computeWeightTrend(measurements, limit = 14) {
  if (!measurements?.length) return []

  const sorted = [...measurements].sort((a, b) => new Date(a.date) - new Date(b.date))
  const recent = sorted.slice(-limit)

  return recent.map(m => ({
    label: m.dateLabel?.split(",")[0]?.trim() ?? m.dateLabel ?? "—",
    weightKg: m.weightKg,
    dateLabel: m.dateLabel,
  }))
}
