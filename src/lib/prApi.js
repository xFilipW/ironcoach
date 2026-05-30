const BASE = "/api/personal-records"

async function parseResponse(res) {
  if (res.status === 204) return null
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || "Błąd połączenia z bazą danych")
  }
  return data
}

export async function fetchPersonalRecords() {
  const res = await fetch(BASE)
  return parseResponse(res)
}

export async function createPersonalRecord(record) {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record),
  })
  return parseResponse(res)
}

export async function updatePersonalRecordApi(record) {
  const res = await fetch(`${BASE}/${record.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record),
  })
  return parseResponse(res)
}

export async function deletePersonalRecordApi(id) {
  const res = await fetch(`${BASE}/${id}`, { method: "DELETE" })
  return parseResponse(res)
}
