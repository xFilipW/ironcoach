import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { pl } from "date-fns/locale"
import { cn } from "../../lib/utils"
import { buttonVariants } from "./button"

function Calendar({ className, classNames, showOutsideDays = true, ...props }) {
  return (
    <DayPicker
      locale={pl}
      showOutsideDays={showOutsideDays}
      className={cn("rdp-root p-3 bg-card text-foreground", className)}
      classNames={{
        months: "relative flex w-full flex-col gap-2",
        month: "flex w-full flex-col gap-2",
        month_caption: "flex h-7 w-full items-center justify-center",
        caption_label: "text-sm font-semibold capitalize text-foreground",
        nav: "absolute inset-x-0 top-1 z-10 flex h-7 items-center justify-between px-0.5",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 p-0 border-border text-foreground hover:bg-accent aria-disabled:opacity-40"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 p-0 border-border text-foreground hover:bg-accent aria-disabled:opacity-40"
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "text-muted-foreground w-9 font-medium text-[0.75rem]",
        week: "flex w-full mt-1",
        day: "h-9 w-9 p-0 text-center text-sm",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal rounded-md text-foreground",
          "hover:bg-accent hover:text-accent-foreground",
          "focus-visible:ring-2 focus-visible:ring-ring"
        ),
        selected:
          "[&_button]:bg-primary [&_button]:text-primary-foreground [&_button]:hover:bg-primary [&_button]:hover:text-primary-foreground",
        today: "[&_button]:bg-accent [&_button]:text-accent-foreground",
        outside: "[&_button]:text-muted-foreground [&_button]:opacity-40",
        disabled: "[&_button]:text-muted-foreground [&_button]:opacity-30",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          const Icon = orientation === "left" ? ChevronLeft : ChevronRight
          return <Icon className="h-3.5 w-3.5 text-foreground" />
        },
      }}
      {...props}
    />
  )
}

export { Calendar }
