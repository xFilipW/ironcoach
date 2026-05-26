export function formatWorkoutCount(count) {
  if (count === 1) return "1 trening"
  if (count >= 2 && count <= 4) return `${count} treningi`
  return `${count} treningów`
}

export function formatMealCount(count) {
  if (count === 1) return "1 posiłek"
  if (count >= 2 && count <= 4) return `${count} posiłki`
  return `${count} posiłków`
}
