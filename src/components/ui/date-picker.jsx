import { useEffect, useMemo, useState } from "react"
import { format } from "date-fns"
import { pl } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "../../lib/utils"
import { formatInputDate, getWorkoutDateDisabledMatcher, parseInputDateString } from "../../lib/workoutUtils"
import { Button } from "./button"
import { Calendar } from "./calendar"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"

export function DatePicker({ value, onChange, status, placeholder = "Wybierz datę", className }) {
  const [open, setOpen] = useState(false)
  const selected = parseInputDateString(value)
  const [month, setMonth] = useState(() => selected ?? new Date())

  const disabled = useMemo(() => getWorkoutDateDisabledMatcher(status), [status])

  useEffect(() => {
    if (open && selected) setMonth(selected)
  }, [open, value])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-11 text-base normal-case tracking-normal",
            !selected && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          {selected ? format(selected, "d MMMM yyyy", { locale: pl }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-card text-card-foreground border-border" align="start">
        <Calendar
          mode="single"
          month={month}
          onMonthChange={setMonth}
          selected={selected}
          disabled={disabled}
          onSelect={date => {
            if (date) {
              onChange(formatInputDate(date))
              setOpen(false)
            }
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
