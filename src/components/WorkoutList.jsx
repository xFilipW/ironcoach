import { useState, lazy, Suspense } from "react"
import { Button } from "./ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs"
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
import WorkoutWeekGroups from "./workout/WorkoutWeekGroups"
import { Dumbbell, Plus } from "lucide-react"
import { isWorkoutCompleted } from "../lib/workoutUtils"

const AddWorkoutForm = lazy(() => import("./AddWorkoutForm"))

function EmptyWorkouts({ message }) {
  return <p className="text-muted-foreground text-base mt-5">{message}</p>
}

function WorkoutTabPanel({ items, emptyMessage, expanded, setExpanded, setEditingId, setDeleteTarget, onAnalyze, onAnalyzeWeek, newestFirst }) {
  if (items.length === 0) return <EmptyWorkouts message={emptyMessage} />

  return (
    <WorkoutWeekGroups
      items={items}
      expanded={expanded}
      setExpanded={setExpanded}
      setEditingId={setEditingId}
      setDeleteTarget={setDeleteTarget}
      onAnalyze={onAnalyze}
      onAnalyzeWeek={onAnalyzeWeek}
      newestFirst={newestFirst}
    />
  )
}

export default function WorkoutList({ workouts, onAddWorkout, onUpdateWorkout, onDeleteWorkout, onAnalyzeWorkout, onAnalyzeWeek }) {
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const completed = workouts.filter(w => isWorkoutCompleted(w))
  const planned = workouts.filter(w => !isWorkoutCompleted(w))
  const editingWorkout = workouts.find(w => w.id === editingId)

  const closeForm = () => {
    setShowAdd(false)
    setEditingId(null)
  }

  const handleDelete = id => {
    onDeleteWorkout(id)
    if (expanded === id) setExpanded(null)
    if (editingId === id) setEditingId(null)
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    handleDelete(deleteTarget.id)
    setDeleteTarget(null)
  }

  if (showAdd || editingId) {
    return (
      <Suspense fallback={<TabLoader label="Ładowanie formularza…" />}>
        <AddWorkoutForm
          initialWorkout={editingWorkout}
          onCancel={closeForm}
          onSave={(workout, prompt) => {
            if (editingId) onUpdateWorkout(workout, prompt)
            else onAddWorkout(workout, prompt)
            closeForm()
          }}
        />
      </Suspense>
    )
  }

  const tabPanelProps = {
    expanded,
    setExpanded,
    setEditingId,
    setDeleteTarget,
    onAnalyze: onAnalyzeWorkout,
    onAnalyzeWeek,
  }

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 rounded-md bg-primary flex items-center justify-center shrink-0">
            <Dumbbell size={24} className="text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-wider">Treningi</h1>
            <p className="text-muted-foreground text-base mt-0.5">Twój dziennik treningowy</p>
          </div>
        </div>
        <Button variant="outline" className="gap-2 h-11 px-4 text-base w-full sm:w-auto" onClick={() => setShowAdd(true)}>
          <Plus size={18} />
          Dodaj trening
        </Button>
      </div>
      <Tabs defaultValue="planned">
        <TabsList className="h-12 p-1.5 w-full sm:w-auto grid grid-cols-2">
          <TabsTrigger value="planned" className="px-3 sm:px-5 py-2 text-sm sm:text-base">
            Nadchodzące
          </TabsTrigger>
          <TabsTrigger value="done" className="px-3 sm:px-5 py-2 text-sm sm:text-base">
            Ukończone
          </TabsTrigger>
        </TabsList>
        <TabsContent value="planned">
          <div className="space-y-6 mt-5">
            <WorkoutTabPanel items={planned} emptyMessage="Brak nadchodzących treningów." newestFirst={false} {...tabPanelProps} />
          </div>
        </TabsContent>
        <TabsContent value="done">
          <div className="space-y-6 mt-5">
            <WorkoutTabPanel items={completed} emptyMessage="Brak ukończonych treningów." newestFirst {...tabPanelProps} />
          </div>
        </TabsContent>
      </Tabs>
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usunąć trening?</AlertDialogTitle>
            <AlertDialogDescription>
              Trening „{deleteTarget?.name}” zostanie trwale usunięty z listy. Tej operacji nie można cofnąć.
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
