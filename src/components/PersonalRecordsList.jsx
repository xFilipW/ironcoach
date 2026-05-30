import { useState, lazy, Suspense } from "react"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import { Badge } from "./ui/badge"
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
import { Trophy, Plus, Pencil, Trash2, StickyNote } from "lucide-react"
import { formatRecordSummary } from "../lib/prUtils"

const AddPrForm = lazy(() => import("./AddPrForm"))

function RecordCard({ record, onEdit, onDeleteRequest }) {
  return (
    <Card>
      <CardContent className="px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
          <div className="flex items-start gap-4 min-w-0 flex-1">
            <div className="w-12 h-12 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0">
              <Trophy size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold text-base">{record.exerciseName}</p>
                <Badge variant="secondary" className="text-xs">
                  PR
                </Badge>
                {record.note?.trim() && (
                  <Badge variant="outline" className="text-xs gap-1">
                    <StickyNote size={10} />
                    Notatka
                  </Badge>
                )}
              </div>
              <p className="text-lg font-black text-primary mt-0.5">{formatRecordSummary(record)}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{record.dateLabel}</p>
              {record.note?.trim() && (
                <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap rounded-md bg-muted/40 px-3 py-2">
                  {record.note.trim()}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0 self-end sm:self-start">
            <button
              type="button"
              onClick={() => onEdit(record)}
              className="text-muted-foreground hover:text-primary transition-colors p-1.5 rounded-md hover:bg-accent"
              aria-label="Edytuj rekord"
            >
              <Pencil size={16} />
            </button>
            <button
              type="button"
              onClick={() => onDeleteRequest(record)}
              className="text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded-md hover:bg-accent"
              aria-label="Usuń rekord"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function PersonalRecordsList({
  records,
  onAddRecord,
  onUpdateRecord,
  onDeleteRecord,
}) {
  const [showForm, setShowForm] = useState(false)
  const [editRecord, setEditRecord] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const sorted = [...records].sort((a, b) => {
    const nameCmp = a.exerciseName.localeCompare(b.exerciseName, "pl")
    if (nameCmp !== 0) return nameCmp
    return new Date(b.date) - new Date(a.date)
  })

  const handleSave = async record => {
    if (editRecord) return onUpdateRecord(record)
    return onAddRecord(record)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await onDeleteRecord(deleteTarget.id)
    setDeleteTarget(null)
  }

  const openAdd = () => {
    setEditRecord(null)
    setShowForm(true)
  }

  const openEdit = record => {
    setEditRecord(record)
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditRecord(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-md bg-primary flex items-center justify-center shrink-0">
            <Trophy size={24} className="text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-wide">Rekordy</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Twoje rekordy osobiste — AI Coach wykryje nowe PR przy analizie treningu
            </p>
          </div>
        </div>
        {!showForm && (
          <Button onClick={openAdd} className="gap-1.5 shrink-0">
            <Plus size={16} />
            Dodaj rekord
          </Button>
        )}
      </div>

      {showForm && (
        <Suspense fallback={<TabLoader label="Ładowanie formularza…" />}>
          <AddPrForm initialRecord={editRecord} onCancel={closeForm} onSave={handleSave} />
        </Suspense>
      )}

      {sorted.length === 0 && !showForm ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Trophy size={40} className="mx-auto text-muted-foreground/40 mb-4" />
            <p className="font-semibold text-muted-foreground">Brak zapisanych rekordów</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              Dodaj swoje najlepsze wyniki — po ukończonym treningu AI Coach zaproponuje aktualizację, jeśli pobijesz PR.
            </p>
            <Button onClick={openAdd} className="mt-4 gap-1.5">
              <Plus size={16} />
              Dodaj pierwszy rekord
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sorted.map(r => (
            <RecordCard
              key={r.id}
              record={r}
              onEdit={openEdit}
              onDeleteRequest={setDeleteTarget}
            />
          ))}
        </div>
      )}

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usunąć rekord?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `Rekord ${deleteTarget.exerciseName} (${formatRecordSummary(deleteTarget)}) zostanie trwale usunięty.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Usuń</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
