import { formatDateLabel, toInputDate } from "./workoutUtils"

export const STORAGE_KEY = "ironcoach-measurements"

export const MEASUREMENT_FIELDS = [
  { key: "bodyFatPct", label: "Tkanka tłuszczowa", unit: "%", step: "0.1" },
  { key: "waistCm", label: "Talia", unit: "cm", step: "0.1" },
  { key: "chestCm", label: "Klatka piersiowa", unit: "cm", step: "0.1" },
  { key: "hipsCm", label: "Biodra", unit: "cm", step: "0.1" },
  { key: "armCm", label: "Ramię", unit: "cm", step: "0.1" },
  { key: "thighCm", label: "Udo", unit: "cm", step: "0.1" },
]

export function loadMeasurements() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function measurementToFormState(m) {
  if (!m) return null
  return {
    measurementDate: toInputDate(m.date),
    weightKg: m.weightKg != null ? String(m.weightKg) : "",
    heightCm: m.heightCm != null ? String(m.heightCm) : "",
    bodyFatPct: m.bodyFatPct != null ? String(m.bodyFatPct) : "",
    waistCm: m.waistCm != null ? String(m.waistCm) : "",
    chestCm: m.chestCm != null ? String(m.chestCm) : "",
    hipsCm: m.hipsCm != null ? String(m.hipsCm) : "",
    armCm: m.armCm != null ? String(m.armCm) : "",
    thighCm: m.thighCm != null ? String(m.thighCm) : "",
    note: m.note ?? "",
  }
}

function parseOptionalNumber(value) {
  const trimmed = String(value ?? "").trim()
  if (!trimmed) return undefined
  const n = Number(trimmed.replace(",", "."))
  return Number.isFinite(n) ? n : null
}

export function computeBmi(weightKg, heightCm) {
  if (weightKg == null || heightCm == null || heightCm <= 0) return null
  const heightM = heightCm / 100
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10
}

export function buildMeasurementFromForm({ measurementDate, weightKg, heightCm, note, existing, ...optional }) {
  const weight = parseOptionalNumber(weightKg)
  const height = parseOptionalNumber(heightCm)
  const id = existing?.id ?? Date.now()
  const date = `${measurementDate}T12:00:00.000Z`

  const measurement = {
    id,
    date,
    dateLabel: formatDateLabel(measurementDate),
    weightKg: weight,
    note: note?.trim() || undefined,
  }

  if (height != null) measurement.heightCm = height

  for (const { key } of MEASUREMENT_FIELDS) {
    const parsed = parseOptionalNumber(optional[key])
    if (parsed != null) measurement[key] = parsed
  }

  return measurement
}

export function formatMeasurementSummary(m) {
  const parts = [`${m.weightKg} kg`]
  if (m.heightCm != null) parts.push(`${m.heightCm} cm`)
  const bmi = computeBmi(m.weightKg, m.heightCm)
  if (bmi != null) parts.push(`BMI ${bmi}`)
  if (m.bodyFatPct != null) parts.push(`${m.bodyFatPct}% BF`)
  const circumferences = MEASUREMENT_FIELDS.filter(f => f.key !== "bodyFatPct" && m[f.key] != null)
  if (circumferences.length) {
    parts.push(circumferences.map(f => `${f.label.toLowerCase()} ${m[f.key]} cm`).join(", "))
  }
  return parts.join(" · ")
}
