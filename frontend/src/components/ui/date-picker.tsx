"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  date?: Date
  onDateChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function DatePicker({ 
  date, 
  onDateChange, 
  placeholder = "Pick a date",
  className,
  disabled = false
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onDateChange}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

interface DateTimePickerProps {
  value?: string // ISO string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  showTime?: boolean
}

export function DateTimePicker({ 
  value, 
  onChange, 
  placeholder = "Pick a date and time",
  className,
  disabled = false,
  showTime = true
}: DateTimePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(
    value ? new Date(value) : undefined
  )
  const [timeValue, setTimeValue] = React.useState<string>(() => {
    if (value) {
      const d = new Date(value)
      return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
    }
    return "00:00"
  })

  const handleDateSelect = (newDate: Date | undefined) => {
    if (!newDate) {
      setDate(undefined)
      onChange?.("")
      return
    }

    const [hours, minutes] = timeValue.split(":").map(Number)
    newDate.setHours(hours, minutes, 0, 0)
    setDate(newDate)
    onChange?.(newDate.toISOString())
  }

  const handleTimeChange = (time: string) => {
    setTimeValue(time)
    if (date) {
      const [hours, minutes] = time.split(":").map(Number)
      const newDate = new Date(date)
      newDate.setHours(hours, minutes, 0, 0)
      setDate(newDate)
      onChange?.(newDate.toISOString())
    }
  }

  return (
    <div className="space-y-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground",
              className
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? (
              showTime ? 
                format(date, "PPP 'at' HH:mm") : 
                format(date, "PPP")
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            initialFocus
          />
          {showTime && (
            <div className="p-3 border-t border-border">
              <div className="flex items-center space-x-2">
                <label htmlFor="time" className="text-sm font-medium">
                  Time:
                </label>
                <input
                  id="time"
                  type="time"
                  value={timeValue}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={disabled}
                />
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
} 