const BASE = "/api/measurements"

async function parseResponse(res) {
  if (res.status === 204) return null
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || "Błąd połączenia z bazą danych")
  }
  return data
}

export async function fetchMeasurements() {
  const res = await fetch(BASE)
  return parseResponse(res)
}

export async function createMeasurement(measurement) {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(measurement),
  })
  return parseResponse(res)
}

export async function updateMeasurementApi(measurement) {
  const res = await fetch(`${BASE}/${measurement.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(measurement),
  })
  return parseResponse(res)
}

export async function deleteMeasurementApi(id) {
  const res = await fetch(`${BASE}/${id}`, { method: "DELETE" })
  return parseResponse(res)
}
