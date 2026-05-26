import { useMemo } from "react"
import { Button } from "./ui/button"
import { BarChart3, CalendarDays, Dumbbell, Heart, Layers, Bot, Scale, TrendingDown, TrendingUp, UtensilsCrossed, Target, Flame } from "lucide-react"
import {
  computeSummaryStats,
  computeWeeklyFrequency,
  computeWorkoutTypeDistribution,
  computeFeelingTrend,
  computeVolumeTrend,
  computeTopExercises,
  computeSbdProgress,
  formatVolume,
} from "../lib/workoutAnalytics"
import { computeMeasurementStats, computeWeightTrend } from "../lib/measurementAnalytics"
import { computeDietStats, computeDailyCaloriesTrend } from "../lib/dietAnalytics"
import { getGoalLabel } from "../lib/dietUtils"
import { StatCard, EmptyAnalytics, ChartCard } from "./analytics/AnalyticsCards"
import WeeklyFrequencyChart from "./analytics/charts/WeeklyFrequencyChart"
import WorkoutTypePieChart from "./analytics/charts/WorkoutTypePieChart"
import VolumeTrendChart from "./analytics/charts/VolumeTrendChart"
import FeelingTrendChart from "./analytics/charts/FeelingTrendChart"
import TopExercisesList from "./analytics/charts/TopExercisesList"
import SbdProgressChart from "./analytics/charts/SbdProgressChart"
import WeightTrendChart from "./analytics/charts/WeightTrendChart"
import DailyCaloriesChart from "./analytics/charts/DailyCaloriesChart"

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center shrink-0">
        <Icon size={18} className="text-foreground" />
      </div>
      <div>
        <h2 className="text-lg font-black uppercase tracking-wide">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  )
}

function formatDelta(delta) {
  if (delta == null) return "—"
  const sign = delta > 0 ? "+" : ""
  return `${sign}${delta} kg`
}

export default function WorkoutAnalytics({
  workouts,
  measurements = [],
  meals = [],
  dietProfile,
  onAnalyzeDashboard,
}) {
  const stats = useMemo(() => computeSummaryStats(workouts), [workouts])
  const weeklyFreq = useMemo(() => computeWeeklyFrequency(workouts), [workouts])
  const typeDist = useMemo(() => computeWorkoutTypeDistribution(workouts), [workouts])
  const feelingTrend = useMemo(() => computeFeelingTrend(workouts), [workouts])
  const volumeTrend = useMemo(() => computeVolumeTrend(workouts), [workouts])
  const topExercises = useMemo(() => computeTopExercises(workouts), [workouts])
  const sbdProgress = useMemo(() => computeSbdProgress(workouts), [workouts])

  const measurementStats = useMemo(() => computeMeasurementStats(measurements), [measurements])
  const weightTrend = useMemo(() => computeWeightTrend(measurements), [measurements])

  const dietStats = useMemo(() => computeDietStats(meals, dietProfile), [meals, dietProfile])
  const caloriesTrend = useMemo(() => computeDailyCaloriesTrend(meals), [meals])

  const hasWorkoutData = stats.totalCompleted > 0
  const hasMeasurementData = measurements.length > 0
  const hasDietData = meals.length > 0
  const hasAnyData = hasWorkoutData || hasMeasurementData || hasDietData

  return (
    <div className="space-y-7 max-w-6xl">
      <div>
        <div className="flex items-start justify-between gap-4 mb-1">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-md bg-primary flex items-center justify-center shrink-0">
              <BarChart3 size={24} className="text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-wider">Dashboard</h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                Treningi, pomiary ciała i dieta w jednym miejscu
              </p>
            </div>
          </div>
          {hasAnyData && onAnalyzeDashboard && (
            <Button className="gap-2 shrink-0" onClick={onAnalyzeDashboard}>
              <Bot size={18} />
              Oceń w AI
            </Button>
          )}
        </div>
      </div>

      {!hasAnyData ? (
        <EmptyAnalytics />
      ) : (
        <div className="space-y-10">
          {hasWorkoutData && (
            <section className="space-y-4">
              <SectionHeader icon={Dumbbell} title="Treningi" subtitle="Częstotliwość, objętość i postępy siłowe" />
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <StatCard
                  icon={Dumbbell}
                  label="Ukończone"
                  value={stats.totalCompleted}
                  hint={stats.totalPlanned > 0 ? `${stats.totalPlanned} zaplanowanych` : undefined}
                />
                <StatCard icon={CalendarDays} label="Ten tydzień" value={stats.thisWeekCount} hint="treningów" />
                <StatCard
                  icon={Heart}
                  label="Średnie samopoczucie"
                  value={stats.avgFeeling != null ? `${stats.avgFeeling}/10` : "—"}
                />
                <StatCard
                  icon={Layers}
                  label="Łączna objętość"
                  value={formatVolume(stats.totalVolume)}
                  hint={`${stats.exerciseCount} ćwiczeń łącznie`}
                />
              </div>
              <div className="grid lg:grid-cols-2 gap-4">
                <WeeklyFrequencyChart data={weeklyFreq} />
                <WorkoutTypePieChart data={typeDist} />
              </div>
              <div className="grid lg:grid-cols-2 gap-4">
                <VolumeTrendChart data={volumeTrend} />
                <FeelingTrendChart data={feelingTrend} />
              </div>
              <TopExercisesList exercises={topExercises} />
              {sbdProgress.length > 0 && <SbdProgressChart series={sbdProgress} />}
            </section>
          )}

          {hasMeasurementData && (
            <section className="space-y-4">
              <SectionHeader icon={Scale} title="Pomiary" subtitle="Waga, BMI i trend składu ciała" />
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <StatCard
                  icon={Scale}
                  label="Aktualna waga"
                  value={`${measurementStats.latest.weightKg} kg`}
                  hint={measurementStats.latest.dateLabel}
                />
                <StatCard
                  icon={TrendingDown}
                  label="Zmiana 7 dni"
                  value={formatDelta(measurementStats.weightDelta7d)}
                />
                <StatCard
                  icon={TrendingUp}
                  label="Zmiana 30 dni"
                  value={formatDelta(measurementStats.weightDelta30d)}
                />
                <StatCard
                  icon={Scale}
                  label="BMI"
                  value={measurementStats.bmi ?? "—"}
                  hint={measurementStats.heightCm != null ? `${measurementStats.heightCm} cm` : undefined}
                />
              </div>
              <WeightTrendChart data={weightTrend} />
            </section>
          )}

          {hasDietData && (
            <section className="space-y-4">
              <SectionHeader icon={UtensilsCrossed} title="Dieta" subtitle="Kalorie, makro i realizacja celu" />
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <StatCard
                  icon={Target}
                  label="Cel diety"
                  value={getGoalLabel(dietProfile?.goal)}
                  hint={
                    dietProfile?.targetCalories != null
                      ? `${dietProfile.targetCalories} kcal/dzień`
                      : undefined
                  }
                />
                <StatCard
                  icon={Flame}
                  label="Dziś — zjedzone"
                  value={
                    dietStats.todayEatenTotals
                      ? `${Math.round(dietStats.todayEatenTotals.calories)} kcal`
                      : dietStats.todayTotals
                        ? `${Math.round(dietStats.todayTotals.calories)} kcal`
                        : "—"
                  }
                  hint={
                    dietStats.todayTotals
                      ? dietStats.todayEatenTotals
                        ? `Plan: ${Math.round(dietStats.todayTotals.calories)} kcal`
                        : "plan na dziś"
                      : undefined
                  }
                />
                <StatCard
                  icon={UtensilsCrossed}
                  label="Dziś — posiłki"
                  value={
                    dietStats.todayMeals.length
                      ? `${dietStats.todayEatenCount}/${dietStats.todayMeals.length}`
                      : "—"
                  }
                  hint="zjedzone / plan"
                />
                <StatCard
                  icon={Flame}
                  label="Średnia 7 dni"
                  value={dietStats.weekAvgCalories != null ? `${dietStats.weekAvgCalories} kcal` : "—"}
                  hint="kaloryczność planu"
                />
              </div>
              <DailyCaloriesChart data={caloriesTrend} />
            </section>
          )}

          {!hasWorkoutData && (hasMeasurementData || hasDietData) && (
            <ChartCard title="Brak danych treningowych" description="Ukończ treningi, aby zobaczyć wykresy siłowe">
              <p className="text-sm text-muted-foreground py-4 text-center">
                Dodaj i ukończ treningi w zakładce Treningi — pojawią się wykresy objętości, SBD i częstotliwości.
              </p>
            </ChartCard>
          )}
        </div>
      )}
    </div>
  )
}
