import { useState, useEffect } from "react"
import { loadMeals, loadDietProfileLocal, STORAGE_KEY, PROFILE_STORAGE_KEY, DEFAULT_DIET_PROFILE } from "../lib/dietUtils"
import {
  fetchMeals,
  createMeal,
  updateMealApi,
  deleteMealApi,
  fetchDietProfile,
  saveDietProfileApi,
} from "../lib/dietApi"

export function useDiet() {
  const [meals, setMeals] = useState([])
  const [profile, setProfile] = useState({ ...DEFAULT_DIET_PROFILE })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        let fromDb = await fetchMeals()
        const fromLocal = loadMeals()

        if (fromDb.length === 0 && fromLocal.length > 0) {
          for (const meal of fromLocal) {
            await createMeal(meal)
          }
          localStorage.removeItem(STORAGE_KEY)
          fromDb = await fetchMeals()
        }

        let profileData = await fetchDietProfile()
        const localProfile = loadDietProfileLocal()
        if (
          profileData.goal === DEFAULT_DIET_PROFILE.goal &&
          !profileData.targetCalories &&
          !profileData.note &&
          (localProfile.goal !== DEFAULT_DIET_PROFILE.goal || localProfile.targetCalories || localProfile.note)
        ) {
          profileData = await saveDietProfileApi(localProfile)
          localStorage.removeItem(PROFILE_STORAGE_KEY)
        }

        if (!cancelled) {
          setMeals(fromDb)
          setProfile(profileData)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Nie udało się wczytać danych diety")
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

  const addMeal = async meal => {
    try {
      await createMeal(meal)
      setMeals(prev =>
        [...prev, meal].sort((a, b) => new Date(b.date) - new Date(a.date))
      )
      setError(null)
      return true
    } catch (err) {
      setError(err.message || "Nie udało się zapisać posiłku")
      return false
    }
  }

  const updateMeal = async meal => {
    try {
      await updateMealApi(meal)
      setMeals(prev =>
        prev
          .map(m => (m.id === meal.id ? meal : m))
          .sort((a, b) => new Date(b.date) - new Date(a.date))
      )
      setError(null)
      return true
    } catch (err) {
      setError(err.message || "Nie udało się zaktualizować posiłku")
      return false
    }
  }

  const deleteMeal = async id => {
    try {
      await deleteMealApi(id)
      setMeals(prev => prev.filter(m => m.id !== id))
      setError(null)
      return true
    } catch (err) {
      setError(err.message || "Nie udało się usunąć posiłku")
      return false
    }
  }

  const saveProfile = async newProfile => {
    try {
      const saved = await saveDietProfileApi(newProfile)
      setProfile(saved)
      setError(null)
      return true
    } catch (err) {
      setError(err.message || "Nie udało się zapisać profilu diety")
      return false
    }
  }

  return { meals, profile, loading, error, addMeal, updateMeal, deleteMeal, saveProfile }
}
