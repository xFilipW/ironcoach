import { useState, useEffect } from "react"
import { loadMeasurements, STORAGE_KEY } from "../lib/measurementUtils"
import {
  fetchMeasurements,
  createMeasurement,
  updateMeasurementApi,
  deleteMeasurementApi,
} from "../lib/measurementApi"

export function useMeasurements() {
  const [measurements, setMeasurements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        let fromDb = await fetchMeasurements()
        const fromLocal = loadMeasurements()

        if (fromDb.length === 0 && fromLocal.length > 0) {
          for (const measurement of fromLocal) {
            await createMeasurement(measurement)
          }
          localStorage.removeItem(STORAGE_KEY)
          fromDb = await fetchMeasurements()
        }

        if (!cancelled) {
          setMeasurements(fromDb)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Nie udało się wczytać pomiarów")
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

  const addMeasurement = async measurement => {
    try {
      await createMeasurement(measurement)
      setMeasurements(prev =>
        [...prev, measurement].sort((a, b) => new Date(b.date) - new Date(a.date))
      )
      setError(null)
      return true
    } catch (err) {
      setError(err.message || "Nie udało się zapisać pomiaru")
      return false
    }
  }

  const updateMeasurement = async measurement => {
    try {
      await updateMeasurementApi(measurement)
      setMeasurements(prev =>
        prev
          .map(m => (m.id === measurement.id ? measurement : m))
          .sort((a, b) => new Date(b.date) - new Date(a.date))
      )
      setError(null)
      return true
    } catch (err) {
      setError(err.message || "Nie udało się zaktualizować pomiaru")
      return false
    }
  }

  const deleteMeasurement = async id => {
    try {
      await deleteMeasurementApi(id)
      setMeasurements(prev => prev.filter(m => m.id !== id))
      setError(null)
      return true
    } catch (err) {
      setError(err.message || "Nie udało się usunąć pomiaru")
      return false
    }
  }

  return { measurements, loading, error, addMeasurement, updateMeasurement, deleteMeasurement }
}
