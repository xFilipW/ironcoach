import { useState, useEffect } from "react"
import {
  fetchPersonalRecords,
  createPersonalRecord,
  updatePersonalRecordApi,
  deletePersonalRecordApi,
} from "../lib/prApi"

export function usePersonalRecords() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const fromDb = await fetchPersonalRecords()
        if (!cancelled) {
          setRecords(fromDb)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Nie udało się wczytać rekordów")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const addRecord = async record => {
    try {
      await createPersonalRecord(record)
      setRecords(prev => [record, ...prev])
      setError(null)
      return true
    } catch (err) {
      setError(err.message || "Nie udało się zapisać rekordu")
      return false
    }
  }

  const updateRecord = async record => {
    try {
      await updatePersonalRecordApi(record)
      setRecords(prev => prev.map(r => (r.id === record.id ? record : r)))
      setError(null)
      return true
    } catch (err) {
      setError(err.message || "Nie udało się zaktualizować rekordu")
      return false
    }
  }

  const deleteRecord = async id => {
    try {
      await deletePersonalRecordApi(id)
      setRecords(prev => prev.filter(r => r.id !== id))
      setError(null)
      return true
    } catch (err) {
      setError(err.message || "Nie udało się usunąć rekordu")
      return false
    }
  }

  return { records, loading, error, addRecord, updateRecord, deleteRecord }
}
