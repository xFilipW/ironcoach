import { Badge } from "../ui/badge"
import { Input } from "../ui/input"
import { Trash2 } from "lucide-react"
import { EXERCISE_PRESETS } from "../../lib/exercises"

const RPE_OPTIONS = [6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10]

export default function ExerciseFormRow({ exercise, index, canRemove, onUpdate, onRemove }) {
  return (
    <div className="rounded-lg border border-border p-4 space-y-3 bg-muted/20">
      <div className="flex items-center justify-between gap-2">
        <Badge variant="secondary" className="text-xs">
          #{index + 1}
        </Badge>
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(exercise.id)}
            className="text-muted-foreground hover:text-destructive p-1"
            aria-label="Usuń ćwiczenie"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ćwiczenie</label>
        <select
          value={exercise.presetId}
          onChange={e => onUpdate(exercise.id, { presetId: e.target.value })}
          className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-base"
        >
          {EXERCISE_PRESETS.map(p => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        {exercise.presetId === "custom" && (
          <Input
            placeholder="Nazwa ćwiczenia"
            value={exercise.customName}
            onChange={e => onUpdate(exercise.id, { customName: e.target.value })}
            className="h-11 text-base"
          />
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">kg</label>
          <Input
            type="number"
            min="0"
            step="0.5"
            placeholder="0"
            value={exercise.weight}
            onChange={e => onUpdate(exercise.id, { weight: e.target.value })}
            className="h-11 text-base"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Serie</label>
          <Input
            type="number"
            min="1"
            placeholder="1"
            value={exercise.sets}
            onChange={e => onUpdate(exercise.id, { sets: e.target.value })}
            className="h-11 text-base"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Powt.</label>
          <Input
            type="number"
            min="1"
            placeholder="0"
            value={exercise.reps}
            onChange={e => onUpdate(exercise.id, { reps: e.target.value })}
            className="h-11 text-base"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">RPE (ost. seria)</label>
          <select
            value={exercise.rpe}
            onChange={e => onUpdate(exercise.id, { rpe: e.target.value })}
            className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-base"
          >
            {RPE_OPTIONS.map(v => (
              <option key={v} value={String(v)}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
