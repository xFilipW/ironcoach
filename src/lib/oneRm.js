export const FORMULAS = [
  { id: "epley", name: "Epley", hint: "w × (1 + r/30)" },
  { id: "brzycki", name: "Brzycki", hint: "w × 36 / (37 − r)" },
  { id: "lander", name: "Lander", hint: "100w / (101,3 − 2,67r)" },
  { id: "lombardi", name: "Lombardi", hint: "w × r^0,1" },
]

export function effectiveReps(reps, rpe) {
  const n = Number(reps)
  const r = Number(rpe)
  if (!n || n < 1) return null
  if (!r || r < 6 || r > 10) return n
  return n + Math.max(0, 10 - r)
}

export function calc1RM(formulaId, weight, reps, rpe) {
  const w = Number(weight)
  const eff = effectiveReps(reps, rpe)
  if (!w || w <= 0 || !eff || eff < 1) return null

  let result
  switch (formulaId) {
    case "epley":
      result = w * (1 + eff / 30)
      break
    case "brzycki":
      if (eff >= 37) return null
      result = w * (36 / (37 - eff))
      break
    case "lander": {
      const denom = 101.3 - 2.67123 * eff
      if (denom <= 0) return null
      result = (100 * w) / denom
      break
    }
    case "lombardi":
      result = w * Math.pow(eff, 0.1)
      break
    default:
      return null
  }

  return Math.round(result * 10) / 10
}

export function calcAllFormulas(weight, reps, rpe) {
  return FORMULAS.map(f => ({
    ...f,
    value: calc1RM(f.id, weight, reps, rpe),
  }))
}

export function average1RM(weight, reps, rpe) {
  const values = calcAllFormulas(weight, reps, rpe)
    .map(f => f.value)
    .filter(v => v != null)
  if (!values.length) return null
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length
  return Math.round(avg * 10) / 10
}
