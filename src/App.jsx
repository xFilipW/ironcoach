import { useState, useRef, lazy, Suspense } from "react"
import WorkoutList from "./components/WorkoutList"
import MeasurementsList from "./components/MeasurementsList"
import DietList from "./components/DietList"
import AppSidebar from "./components/AppSidebar"
import TabLoader from "./components/TabLoader"
import { useWorkouts } from "./hooks/useWorkouts"
import { useMeasurements } from "./hooks/useMeasurements"
import { useDiet } from "./hooks/useDiet"
import {
  buildAnalysisPrompt,
  buildWeekAnalysisPrompt,
  buildDashboardAnalysisPrompt,
  buildMeasurementsAnalysisPrompt,
  buildAllMeasurementsAnalysisPrompt,
  buildMealAnalysisPrompt,
  buildAllDietAnalysisPrompt,
  buildWeekDietAnalysisPrompt,
  buildWeekDietPlanPrompt,
} from "./lib/coachPrompts"
import { getGoalLabel } from "./lib/dietUtils"
import { Zap, Bot, Menu, X } from "lucide-react"

const WorkoutAnalytics = lazy(() => import("./components/WorkoutAnalytics"))
const OneRmCalculator = lazy(() => import("./components/OneRmCalculator"))
const CoachChat = lazy(() => import("./components/CoachChat"))

export default function App() {
  const [tab, setTab] = useState("workout")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [coachOpen, setCoachOpen] = useState(false)
  const { workouts, loading: workoutsLoading, error: workoutsError, addWorkout, updateWorkout, deleteWorkout } =
    useWorkouts()
  const {
    measurements,
    loading: measurementsLoading,
    error: measurementsError,
    addMeasurement,
    updateMeasurement,
    deleteMeasurement,
  } = useMeasurements()
  const {
    meals,
    profile: dietProfile,
    loading: dietLoading,
    error: dietError,
    addMeal,
    updateMeal,
    deleteMeal,
    saveProfile,
  } = useDiet()
  const coachRef = useRef(null)

  const sendToCoach = prompt => {
    if (!prompt) return
    setCoachOpen(true)
    setTimeout(() => coachRef.current?.sendText(prompt), 100)
  }

  const handleAddWorkout = async (workout, analysisPrompt) => {
    if (await addWorkout(workout)) sendToCoach(analysisPrompt)
  }

  const handleUpdateWorkout = async (workout, analysisPrompt) => {
    if (await updateWorkout(workout)) sendToCoach(analysisPrompt)
  }

  const handleAddMeasurement = async (measurement, analysisPrompt) => {
    if (await addMeasurement(measurement)) sendToCoach(analysisPrompt)
  }

  const handleUpdateMeasurement = async (measurement, analysisPrompt) => {
    if (await updateMeasurement(measurement)) sendToCoach(analysisPrompt)
  }

  const handleAddMeal = async (meal, analysisPrompt) => {
    if (await addMeal(meal)) sendToCoach(analysisPrompt)
  }

  const handleUpdateMeal = async (meal, analysisPrompt) => {
    if (await updateMeal(meal)) sendToCoach(analysisPrompt)
  }

  const content = {
    workout: (
      <WorkoutList
        workouts={workouts}
        onAddWorkout={handleAddWorkout}
        onUpdateWorkout={handleUpdateWorkout}
        onDeleteWorkout={deleteWorkout}
        onAnalyzeWorkout={workout => sendToCoach(buildAnalysisPrompt(workout))}
        onAnalyzeWeek={(weekWorkouts, weekLabel) =>
          sendToCoach(buildWeekAnalysisPrompt(weekWorkouts, weekLabel))
        }
      />
    ),
    analytics: (
      <Suspense fallback={<TabLoader label="Ładowanie dashboardu…" />}>
        <WorkoutAnalytics
          workouts={workouts}
          measurements={measurements}
          meals={meals}
          dietProfile={dietProfile}
          onAnalyzeDashboard={() => sendToCoach(buildDashboardAnalysisPrompt())}
        />
      </Suspense>
    ),
    diet: (
      <DietList
        meals={meals}
        profile={dietProfile}
        onAddMeal={handleAddMeal}
        onUpdateMeal={handleUpdateMeal}
        onDeleteMeal={deleteMeal}
        onSaveProfile={saveProfile}
        onAnalyzeMeal={meal => sendToCoach(buildMealAnalysisPrompt(meal))}
        onAnalyzeAll={() => sendToCoach(buildAllDietAnalysisPrompt())}
        onAnalyzeWeek={(weekMeals, weekLabel) =>
          sendToCoach(buildWeekDietAnalysisPrompt(weekMeals, weekLabel))
        }
        onPlanWeek={() => sendToCoach(buildWeekDietPlanPrompt(getGoalLabel(dietProfile.goal).toLowerCase()))}
      />
    ),
    measurements: (
      <MeasurementsList
        measurements={measurements}
        onAddMeasurement={handleAddMeasurement}
        onUpdateMeasurement={handleUpdateMeasurement}
        onDeleteMeasurement={deleteMeasurement}
        onAnalyzeMeasurement={m => sendToCoach(buildMeasurementsAnalysisPrompt(m))}
        onAnalyzeAll={() => sendToCoach(buildAllMeasurementsAnalysisPrompt())}
      />
    ),
    calculator: (
      <Suspense fallback={<TabLoader label="Ładowanie kalkulatora…" />}>
        <OneRmCalculator />
      </Suspense>
    ),
  }

  const isLoading =
    (workoutsLoading && (tab === "workout" || tab === "analytics")) ||
    (measurementsLoading && (tab === "measurements" || tab === "analytics")) ||
    (dietLoading && (tab === "diet" || tab === "analytics"))

  return (
    <div className="h-screen overflow-hidden bg-background flex items-stretch dark">
      <AppSidebar activeTab={tab} setActiveTab={setTab} open={sidebarOpen} setOpen={setSidebarOpen} />
      <main className="flex-1 min-w-0 min-h-0 overflow-auto">
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border sticky top-0 bg-background z-20">
          <button type="button" onClick={() => setSidebarOpen(true)} className="text-muted-foreground hover:text-foreground">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <Zap size={16} />
            <span className="font-black tracking-widest uppercase text-sm">IronCoach</span>
          </div>
          <button
            type="button"
            onClick={() => setCoachOpen(true)}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Otwórz AI Coach"
          >
            <Bot size={20} />
          </button>
        </header>
        <div className={`p-6 mx-auto ${tab === "analytics" ? "max-w-6xl" : "max-w-5xl"}`}>
          {workoutsError && (tab === "workout" || tab === "analytics") && (
            <p className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {workoutsError}
            </p>
          )}
          {measurementsError && tab === "measurements" && (
            <p className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {measurementsError}
            </p>
          )}
          {dietError && tab === "diet" && (
            <p className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {dietError}
            </p>
          )}
          {isLoading ? (
            <p className="text-muted-foreground">
              {tab === "analytics"
                ? "Wczytywanie dashboardu…"
                : tab === "diet"
                  ? "Wczytywanie diety…"
                  : tab === "measurements"
                    ? "Wczytywanie pomiarów…"
                    : "Wczytywanie treningów…"}
            </p>
          ) : (
            content[tab]
          )}
        </div>
      </main>
      {coachOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setCoachOpen(false)} />
      )}
      <aside
        className={`fixed lg:static inset-y-0 right-0 z-40 flex flex-col h-full min-h-0 overflow-hidden w-80 xl:w-96 bg-card border-l border-border shrink-0 transition-transform duration-200 ${coachOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}`}
      >
        <button
          type="button"
          className="absolute top-4 right-4 lg:hidden text-muted-foreground hover:text-foreground"
          onClick={() => setCoachOpen(false)}
          aria-label="Zamknij AI Coach"
        >
          <X size={18} />
        </button>
        <Suspense fallback={<TabLoader label="Ładowanie AI Coach…" />}>
          <CoachChat
            ref={coachRef}
            workouts={workouts}
            measurements={measurements}
            meals={meals}
            dietProfile={dietProfile}
            addWorkout={addWorkout}
            updateWorkout={updateWorkout}
            deleteWorkout={deleteWorkout}
            addMeal={addMeal}
            updateMeal={updateMeal}
            deleteMeal={deleteMeal}
            onPlanApplied={(result, type) => {
              if (result.added || result.updated || result.deleted) {
                setTab(type === "diet" ? "diet" : "workout")
              }
            }}
          />
        </Suspense>
      </aside>
    </div>
  )
}
