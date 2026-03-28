import * as React from "react"
import { format, parse, isValid } from "date-fns"
import { vi } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { useOnClickOutside } from "@/hooks/useOnClickOutside"

interface DatePickerProps {
  value?: string // yyyy-MM-dd format
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Chọn ngày",
  disabled,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  useOnClickOutside({ ref: containerRef, handler: () => setOpen(false) })

  const date = React.useMemo(() => {
    if (!value) return undefined
    const parsed = parse(value, "yyyy-MM-dd", new Date())
    return isValid(parsed) ? parsed : undefined
  }, [value])

  const handleSelect = (selected: Date | undefined) => {
    if (selected) {
      onChange?.(format(selected, "yyyy-MM-dd"))
    }
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full justify-start text-left font-normal",
          !date && "text-muted-foreground",
          className
        )}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {date ? format(date, "dd/MM/yyyy", { locale: vi }) : placeholder}
      </Button>
      {open && (
        <div className="absolute left-0 top-full z-[99] mt-1 rounded-lg border bg-popover shadow-md">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleSelect}
            defaultMonth={date}
            locale={vi}
          />
        </div>
      )}
    </div>
  )
}
