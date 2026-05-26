import { useState, lazy, Suspense } from "react"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog"
import TabLoader from "./TabLoader"
import DietWeekGroups from "./diet/DietWeekGroups"
import { UtensilsCrossed, Plus, Bot, Settings2 } from "lucide-react"
import {
  getGoalLabel,
} from "../lib/dietUtils"
import { computeDietStats } from "../lib/dietAnalytics"

const AddMealForm = lazy(() => import("./AddMealForm"))
const DietProfileForm = lazy(() => import("./DietProfileForm"))

export default function DietList({
  meals,
  profile,
  onAddMeal,
  onUpdateMeal,
  onDeleteMeal,
  onSaveProfile,
  onAnalyzeMeal,
  onAnalyzeAll,
  onAnalyzeWeek,
  onPlanWeek,
}) {
  const [showAdd, setShowAdd] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [expandedMeal, setExpandedMeal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const editingMeal = meals.find(m => m.id === editingId)
  const stats = computeDietStats(meals, profile)

  const closeForm = () => {
    setShowAdd(false)
    setEditingId(null)
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    onDeleteMeal(deleteTarget.id)
    if (expandedMeal === deleteTarget.id) setExpandedMeal(null)
    setDeleteTarget(null)
  }

  const handleToggleEaten = meal => {
    onUpdateMeal({ ...meal, eaten: !meal.eaten })
  }

  if (showAdd || editingId) {
    return (
      <Suspense fallback={<TabLoader label="Ładowanie formularza…" />}>
        <AddMealForm
          initialMeal={editingMeal}
          onCancel={closeForm}
          onSave={(meal, prompt) => {
            if (editingId) onUpdateMeal(meal, prompt)
            else onAddMeal(meal, prompt)
            closeForm()
          }}
        />
      </Suspense>
    )
  }

  return (
    <div className="space-y-7">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-md bg-primary flex items-center justify-center shrink-0">
            <UtensilsCrossed size={24} className="text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-wider">Dieta</h1>
            <p className="text-muted-foreground text-base mt-0.5">Cel, posiłki i makro</p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0 flex-wrap">
          {onPlanWeek && (
            <Button variant="secondary" className="gap-2 h-11 px-4 text-base" onClick={onPlanWeek}>
              <Bot size={18} />
              Plan na tydzień
            </Button>
          )}
          {meals.length > 0 && onAnalyzeAll && (
            <Button variant="secondary" className="gap-2 h-11 px-4 text-base" onClick={onAnalyzeAll}>
              <Bot size={18} />
              Analizuj w AI
            </Button>
          )}
          <Button variant="outline" className="gap-2 h-11 px-4 text-base" onClick={() => setShowAdd(true)}>
            <Plus size={18} />
            Dodaj posiłek
          </Button>
        </div>
      </div>

      {showProfile ? (
        <Suspense fallback={<TabLoader label="Ładowanie profilu…" />}>
          <DietProfileForm
            profile={profile}
            onSave={onSaveProfile}
            onCancel={() => setShowProfile(false)}
          />
        </Suspense>
      ) : (
        <Card>
          <CardContent className="px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Twój cel</p>
                <p className="text-xl font-black mt-1">{getGoalLabel(profile.goal)}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-sm text-muted-foreground">
                  {profile.targetCalories != null && <span>{profile.targetCalories} kcal/dzień</span>}
                  {profile.targetProteinG != null && <span>B {profile.targetProteinG}g</span>}
                  {profile.targetCarbsG != null && <span>W {profile.targetCarbsG}g</span>}
                  {profile.targetFatG != null && <span>T {profile.targetFatG}g</span>}
                  {!profile.targetCalories && !profile.targetProteinG && (
                    <span>Brak docelowych kalorii — AI dobierze je na podstawie wagi</span>
                  )}
                </div>
                {profile.note?.trim() && (
                  <p className="text-sm text-muted-foreground mt-2">{profile.note.trim()}</p>
                )}
              </div>
              <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={() => setShowProfile(true)}>
                <Settings2 size={14} />
                Edytuj cel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {stats.todayTotals && (
        <div className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="px-5 py-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                Dziś — {stats.todayEatenTotals ? "zjedzone" : "plan"}
              </p>
              <p className="text-2xl font-black mt-1">
                {stats.todayEatenTotals
                  ? Math.round(stats.todayEatenTotals.calories)
                  : stats.todayTotals.calories}
              </p>
              {stats.todayEatenTotals && (
                <p className="text-xs text-muted-foreground mt-1">
                  Plan: {stats.todayTotals.calories} kcal · {stats.todayEatenCount}/{stats.todayMeals.length} posiłków
                </p>
              )}
              {profile.targetCalories != null && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Cel: {profile.targetCalories} kcal
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="px-5 py-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Białko</p>
              <p className="text-2xl font-black mt-1">
                {Math.round((stats.todayEatenTotals ?? stats.todayTotals).proteinG)}g
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="px-5 py-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Węgle</p>
              <p className="text-2xl font-black mt-1">
                {Math.round((stats.todayEatenTotals ?? stats.todayTotals).carbsG)}g
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="px-5 py-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Tłuszcze</p>
              <p className="text-2xl font-black mt-1">
                {Math.round((stats.todayEatenTotals ?? stats.todayTotals).fatG)}g
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {stats.weekAvgCalories != null && (
        <p className="text-sm text-muted-foreground">
          Średnia kaloryczność (7 dni): <strong>{stats.weekAvgCalories} kcal/dzień</strong>
        </p>
      )}

      {meals.length === 0 ? (
        <p className="text-muted-foreground text-base mt-5">
          Brak posiłków. Ustaw cel diety i dodaj posiłki z makro — albo poproś AI Coach: „Rozpisz mi dietę na ten
          tydzień na masę" — dobierze kalorie na podstawie Twojej wagi i ułoży jadłospis.
        </p>
      ) : (
        <DietWeekGroups
          meals={meals}
          expandedMeal={expandedMeal}
          setExpandedMeal={setExpandedMeal}
          setEditingId={setEditingId}
          setDeleteTarget={setDeleteTarget}
          onToggleEaten={handleToggleEaten}
          onAnalyzeMeal={onAnalyzeMeal}
          onAnalyzeWeek={onAnalyzeWeek}
        />
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usunąć posiłek?</AlertDialogTitle>
            <AlertDialogDescription>
              Posiłek „{deleteTarget?.name}" z {deleteTarget?.dateLabel} zostanie trwale usunięty.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
