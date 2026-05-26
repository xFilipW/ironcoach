const MEALS_BASE = "/api/meals"
const PROFILE_BASE = "/api/diet-profile"

async function parseResponse(res) {
  if (res.status === 204) return null
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || "Błąd połączenia z bazą danych")
  }
  return data
}

export async function fetchMeals() {
  const res = await fetch(MEALS_BASE)
  return parseResponse(res)
}

export async function createMeal(meal) {
  const res = await fetch(MEALS_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(meal),
  })
  return parseResponse(res)
}

export async function updateMealApi(meal) {
  const res = await fetch(`${MEALS_BASE}/${meal.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(meal),
  })
  return parseResponse(res)
}

export async function deleteMealApi(id) {
  const res = await fetch(`${MEALS_BASE}/${id}`, { method: "DELETE" })
  return parseResponse(res)
}

export async function fetchDietProfile() {
  const res = await fetch(PROFILE_BASE)
  return parseResponse(res)
}

export async function saveDietProfileApi(profile) {
  const res = await fetch(PROFILE_BASE, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  })
  return parseResponse(res)
}
