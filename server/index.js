import express from "express"
import cors from "cors"
import {
  deleteWorkout,
  getAllWorkouts,
  insertWorkout,
  updateWorkout,
  deleteMeasurement,
  getAllMeasurements,
  insertMeasurement,
  updateMeasurement,
  deleteMeal,
  getAllMeals,
  insertMeal,
  updateMeal,
  getDietProfile,
  saveDietProfile,
} from "./db.js"

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json({ limit: "1mb" }))

app.get("/api/workouts", (_req, res) => {
  res.json(getAllWorkouts())
})

app.post("/api/workouts", (req, res) => {
  const workout = req.body
  if (!workout?.id || !workout?.date) {
    return res.status(400).json({ error: "Nieprawidłowy trening" })
  }
  try {
    insertWorkout(workout)
    res.status(201).json(workout)
  } catch (err) {
    if (err.code === "SQLITE_CONSTRAINT_PRIMARYKEY") {
      return res.status(409).json({ error: "Trening o tym ID już istnieje" })
    }
    console.error(err)
    res.status(500).json({ error: "Nie udało się zapisać treningu" })
  }
})

app.put("/api/workouts/:id", (req, res) => {
  const id = Number(req.params.id)
  const workout = { ...req.body, id }
  if (!workout?.date) {
    return res.status(400).json({ error: "Nieprawidłowy trening" })
  }
  const updated = updateWorkout(workout)
  if (!updated) {
    return res.status(404).json({ error: "Nie znaleziono treningu" })
  }
  res.json(updated)
})

app.delete("/api/workouts/:id", (req, res) => {
  const id = Number(req.params.id)
  if (!deleteWorkout(id)) {
    return res.status(404).json({ error: "Nie znaleziono treningu" })
  }
  res.status(204).end()
})

app.get("/api/measurements", (_req, res) => {
  res.json(getAllMeasurements())
})

app.post("/api/measurements", (req, res) => {
  const measurement = req.body
  if (!measurement?.id || !measurement?.date || measurement?.weightKg == null) {
    return res.status(400).json({ error: "Nieprawidłowy pomiar" })
  }
  try {
    insertMeasurement(measurement)
    res.status(201).json(measurement)
  } catch (err) {
    if (err.code === "SQLITE_CONSTRAINT_PRIMARYKEY") {
      return res.status(409).json({ error: "Pomiar o tym ID już istnieje" })
    }
    console.error(err)
    res.status(500).json({ error: "Nie udało się zapisać pomiaru" })
  }
})

app.put("/api/measurements/:id", (req, res) => {
  const id = Number(req.params.id)
  const measurement = { ...req.body, id }
  if (!measurement?.date || measurement?.weightKg == null) {
    return res.status(400).json({ error: "Nieprawidłowy pomiar" })
  }
  const updated = updateMeasurement(measurement)
  if (!updated) {
    return res.status(404).json({ error: "Nie znaleziono pomiaru" })
  }
  res.json(updated)
})

app.delete("/api/measurements/:id", (req, res) => {
  const id = Number(req.params.id)
  if (!deleteMeasurement(id)) {
    return res.status(404).json({ error: "Nie znaleziono pomiaru" })
  }
  res.status(204).end()
})

app.get("/api/meals", (_req, res) => {
  res.json(getAllMeals())
})

app.post("/api/meals", (req, res) => {
  const meal = req.body
  if (!meal?.id || !meal?.date || !meal?.name?.trim()) {
    return res.status(400).json({ error: "Nieprawidłowy posiłek" })
  }
  try {
    insertMeal(meal)
    res.status(201).json(meal)
  } catch (err) {
    if (err.code === "SQLITE_CONSTRAINT_PRIMARYKEY") {
      return res.status(409).json({ error: "Posiłek o tym ID już istnieje" })
    }
    console.error(err)
    res.status(500).json({ error: "Nie udało się zapisać posiłku" })
  }
})

app.put("/api/meals/:id", (req, res) => {
  const id = Number(req.params.id)
  const meal = { ...req.body, id }
  if (!meal?.date || !meal?.name?.trim()) {
    return res.status(400).json({ error: "Nieprawidłowy posiłek" })
  }
  const updated = updateMeal(meal)
  if (!updated) {
    return res.status(404).json({ error: "Nie znaleziono posiłku" })
  }
  res.json(updated)
})

app.delete("/api/meals/:id", (req, res) => {
  const id = Number(req.params.id)
  if (!deleteMeal(id)) {
    return res.status(404).json({ error: "Nie znaleziono posiłku" })
  }
  res.status(204).end()
})

app.get("/api/diet-profile", (_req, res) => {
  res.json(getDietProfile())
})

app.put("/api/diet-profile", (req, res) => {
  const profile = req.body
  if (!profile?.goal) {
    return res.status(400).json({ error: "Nieprawidłowy profil diety" })
  }
  try {
    const saved = saveDietProfile(profile)
    res.json(saved)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Nie udało się zapisać profilu diety" })
  }
})

const server = app.listen(PORT, () => {
  console.log(`IronCoach API: http://localhost:${PORT}`)
})

server.on("error", err => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} jest zajęty — prawdopodobnie działa stary serwer API. Zatrzymaj go (Ctrl+C w terminalu z npm run dev) i uruchom ponownie.`
    )
    process.exit(1)
  }
  throw err
})
