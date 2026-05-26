import { useMemo } from "react"
import { Button } from "./ui/button"
import { BarChart3, CalendarDays, Dumbbell, Heart, Layers, Bot } from "lucide-react"
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
import { StatCard, EmptyAnalytics } from "./analytics/AnalyticsCards"
import WeeklyFrequencyChart from "./analytics/charts/WeeklyFrequencyChart"
import WorkoutTypePieChart from "./analytics/charts/WorkoutTypePieChart"
import VolumeTrendChart from "./analytics/charts/VolumeTrendChart"
import FeelingTrendChart from "./analytics/charts/FeelingTrendChart"
import TopExercisesList from "./analytics/charts/TopExercisesList"
import SbdProgressChart from "./analytics/charts/SbdProgressChart"

export default function WorkoutAnalytics({ workouts, onAnalyzeDashboard }) {
  const stats = useMemo(() => computeSummaryStats(workouts), [workouts])
  const weeklyFreq = useMemo(() => computeWeeklyFrequency(workouts), [workouts])
  const typeDist = useMemo(() => computeWorkoutTypeDistribution(workouts), [workouts])
  const feelingTrend = useMemo(() => computeFeelingTrend(workouts), [workouts])
  const volumeTrend = useMemo(() => computeVolumeTrend(workouts), [workouts])
  const topExercises = useMemo(() => computeTopExercises(workouts), [workouts])
  const sbdProgress = useMemo(() => computeSbdProgress(workouts), [workouts])

  const hasData = stats.totalCompleted > 0

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
              <p className="text-muted-foreground text-sm mt-0.5">Analiza Twoich treningów i postępów</p>
            </div>
          </div>
          {hasData && onAnalyzeDashboard && (
            <Button className="gap-2 shrink-0" onClick={onAnalyzeDashboard}>
              <Bot size={18} />
              Oceń w AI
            </Button>
          )}
        </div>
      </div>

      {!hasData ? (
        <EmptyAnalytics />
      ) : (
        <>
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
        </>
      )}
    </div>
  )
}
