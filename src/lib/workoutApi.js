const BASE = "/api/workouts"

async function parseResponse(res) {
  if (res.status === 204) return null
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || "Błąd połączenia z bazą danych")
  }
  return data
}

export async function fetchWorkouts() {
  const res = await fetch(BASE)
  return parseResponse(res)
}

export async function createWorkout(workout) {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(workout),
  })
  return parseResponse(res)
}

export async function updateWorkoutApi(workout) {
  const res = await fetch(`${BASE}/${workout.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(workout),
  })
  return parseResponse(res)
}

export async function deleteWorkoutApi(id) {
  const res = await fetch(`${BASE}/${id}`, { method: "DELETE" })
  return parseResponse(res)
}
