import Database from "better-sqlite3"
import { mkdirSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const DB_PATH = join(__dirname, "..", "data", "ironcoach.db")

mkdirSync(dirname(DB_PATH), { recursive: true })

const db = new Database(DB_PATH)
db.pragma("journal_mode = WAL")

db.exec(`
  CREATE TABLE IF NOT EXISTS workouts (
    id INTEGER PRIMARY KEY,
    data TEXT NOT NULL,
    date TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_workouts_date ON workouts(date DESC);

  CREATE TABLE IF NOT EXISTS measurements (
    id INTEGER PRIMARY KEY,
    data TEXT NOT NULL,
    date TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_measurements_date ON measurements(date DESC);

  CREATE TABLE IF NOT EXISTS meals (
    id INTEGER PRIMARY KEY,
    data TEXT NOT NULL,
    date TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_meals_date ON meals(date DESC);

  CREATE TABLE IF NOT EXISTS diet_profile (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    data TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`)

function rowToWorkout(row) {
  return JSON.parse(row.data)
}

export function getAllWorkouts() {
  const rows = db
    .prepare("SELECT data FROM workouts ORDER BY date DESC, id DESC")
    .all()
  return rows.map(rowToWorkout)
}

export function insertWorkout(workout) {
  const data = JSON.stringify(workout)
  db.prepare("INSERT INTO workouts (id, data, date) VALUES (?, ?, ?)").run(
    workout.id,
    data,
    workout.date
  )
  return workout
}

export function updateWorkout(workout) {
  const data = JSON.stringify(workout)
  const result = db
    .prepare("UPDATE workouts SET data = ?, date = ? WHERE id = ?")
    .run(data, workout.date, workout.id)
  if (result.changes === 0) return null
  return workout
}

export function deleteWorkout(id) {
  const result = db.prepare("DELETE FROM workouts WHERE id = ?").run(id)
  return result.changes > 0
}

function rowToMeasurement(row) {
  return JSON.parse(row.data)
}

export function getAllMeasurements() {
  const rows = db
    .prepare("SELECT data FROM measurements ORDER BY date DESC, id DESC")
    .all()
  return rows.map(rowToMeasurement)
}

export function insertMeasurement(measurement) {
  const data = JSON.stringify(measurement)
  db.prepare("INSERT INTO measurements (id, data, date) VALUES (?, ?, ?)").run(
    measurement.id,
    data,
    measurement.date
  )
  return measurement
}

export function updateMeasurement(measurement) {
  const data = JSON.stringify(measurement)
  const result = db
    .prepare("UPDATE measurements SET data = ?, date = ? WHERE id = ?")
    .run(data, measurement.date, measurement.id)
  if (result.changes === 0) return null
  return measurement
}

export function deleteMeasurement(id) {
  const result = db.prepare("DELETE FROM measurements WHERE id = ?").run(id)
  return result.changes > 0
}

function rowToMeal(row) {
  return JSON.parse(row.data)
}

export function getAllMeals() {
  const rows = db
    .prepare("SELECT data FROM meals ORDER BY date DESC, id DESC")
    .all()
  return rows.map(rowToMeal)
}

export function insertMeal(meal) {
  const data = JSON.stringify(meal)
  db.prepare("INSERT INTO meals (id, data, date) VALUES (?, ?, ?)").run(
    meal.id,
    data,
    meal.date
  )
  return meal
}

export function updateMeal(meal) {
  const data = JSON.stringify(meal)
  const result = db
    .prepare("UPDATE meals SET data = ?, date = ? WHERE id = ?")
    .run(data, meal.date, meal.id)
  if (result.changes === 0) return null
  return meal
}

export function deleteMeal(id) {
  const result = db.prepare("DELETE FROM meals WHERE id = ?").run(id)
  return result.changes > 0
}

const DEFAULT_DIET_PROFILE = {
  goal: "maintenance",
  targetCalories: null,
  targetProteinG: null,
  targetCarbsG: null,
  targetFatG: null,
  note: "",
}

export function getDietProfile() {
  const row = db.prepare("SELECT data FROM diet_profile WHERE id = 1").get()
  if (!row) return { ...DEFAULT_DIET_PROFILE }
  return { ...DEFAULT_DIET_PROFILE, ...JSON.parse(row.data) }
}

export function saveDietProfile(profile) {
  const data = JSON.stringify(profile)
  const existing = db.prepare("SELECT id FROM diet_profile WHERE id = 1").get()
  if (existing) {
    db.prepare("UPDATE diet_profile SET data = ?, updated_at = datetime('now') WHERE id = 1").run(data)
  } else {
    db.prepare("INSERT INTO diet_profile (id, data) VALUES (1, ?)").run(data)
  }
  return profile
}
