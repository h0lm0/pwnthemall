"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Clock } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/context/LanguageContext"

interface DateTimePickerProps {
  date?: Date
  onDateChange: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function DateTimePicker({
  date,
  onDateChange,
  placeholder = "Pick a date and time",
  disabled = false,
  className,
}: DateTimePickerProps) {
  const { t, isLoaded } = useLanguage();
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date)
  const [timeValue, setTimeValue] = React.useState<string>(
    date ? format(date, "HH:mm") : ""
  )
  const [isOpen, setIsOpen] = React.useState(false)

  React.useEffect(() => {
    if (date) {
      setSelectedDate(date)
      setTimeValue(format(date, "HH:mm"))
    }
  }, [date])

  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) {
      // If we have a time value, apply it to the new date
      if (timeValue) {
        const [hours, minutes] = timeValue.split(":").map(Number)
        newDate.setHours(hours, minutes)
      }
      setSelectedDate(newDate)
      onDateChange(newDate)
    } else {
      setSelectedDate(undefined)
      onDateChange(undefined)
    }
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value
    setTimeValue(newTime)
    
    if (selectedDate && newTime) {
      const [hours, minutes] = newTime.split(":").map(Number)
      const newDateTime = new Date(selectedDate)
      newDateTime.setHours(hours, minutes)
      onDateChange(newDateTime)
    }
  }

  const handleClear = () => {
    setSelectedDate(undefined)
    setTimeValue("")
    onDateChange(undefined)
    setIsOpen(false)
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !selectedDate && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate ? (
              format(selectedDate, "PPP 'at' HH:mm")
            ) : (
              <span>{t(placeholder) || placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="border-b border-border p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="time" className="text-sm font-medium">
                {isLoaded ? t("time") : "Time"}
              </Label>
              <Input
                id="time"
                type="time"
                value={timeValue}
                onChange={handleTimeChange}
                className="w-36"
              />
            </div>
          </div>
          <div className="p-3">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              initialFocus
              className="rounded-md border-0"
            />
          </div>
          <div className="border-t border-border p-3 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="flex-1"
            >
              {isLoaded ? t("clear") : "Clear"}
            </Button>
            <Button
              size="sm"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              {isLoaded ? t("done") : "Done"}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
