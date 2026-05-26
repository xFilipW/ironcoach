import { useState, useEffect } from "react"
import { loadWorkouts, STORAGE_KEY } from "../lib/workoutUtils"
import {
  fetchWorkouts,
  createWorkout,
  updateWorkoutApi,
  deleteWorkoutApi,
} from "../lib/workoutApi"

export function useWorkouts() {
  const [workouts, setWorkouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        let fromDb = await fetchWorkouts()
        const fromLocal = loadWorkouts()

        if (fromDb.length === 0 && fromLocal.length > 0) {
          for (const workout of fromLocal) {
            await createWorkout(workout)
          }
          localStorage.removeItem(STORAGE_KEY)
          fromDb = await fetchWorkouts()
        }

        if (!cancelled) {
          setWorkouts(fromDb)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Nie udało się wczytać treningów")
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

  const addWorkout = async workout => {
    try {
      await createWorkout(workout)
      setWorkouts(prev => [workout, ...prev])
      setError(null)
      return true
    } catch (err) {
      setError(err.message || "Nie udało się zapisać treningu")
      return false
    }
  }

  const updateWorkout = async workout => {
    try {
      await updateWorkoutApi(workout)
      setWorkouts(prev => prev.map(w => (w.id === workout.id ? workout : w)))
      setError(null)
      return true
    } catch (err) {
      setError(err.message || "Nie udało się zaktualizować treningu")
      return false
    }
  }

  const deleteWorkout = async id => {
    try {
      await deleteWorkoutApi(id)
      setWorkouts(prev => prev.filter(w => w.id !== id))
      setError(null)
      return true
    } catch (err) {
      setError(err.message || "Nie udało się usunąć treningu")
      return false
    }
  }

  return { workouts, loading, error, addWorkout, updateWorkout, deleteWorkout }
}
