export function formatWorkoutCount(count) {
  if (count === 1) return "1 trening"
  if (count >= 2 && count <= 4) return `${count} treningi`
  return `${count} treningów`
}
