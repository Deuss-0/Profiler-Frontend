"use client"

import { Clock, CalendarDays } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useState, useEffect } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"

export function ClockWidget() {
  const [time, setTime] = useState(new Date())
  const [mounted, setMounted] = useState(false)
  const [date, setDate] = useState<Date | undefined>(new Date())

  useEffect(() => {
    // Mark component as mounted to enable client-side rendering
    setMounted(true)
    
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric", year: "numeric" })
  }

  return (
    <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-cyan-900/50 flex items-center justify-center text-cyan-400">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Current Time</p>
              {mounted ? (
                <p className="text-2xl font-mono font-bold text-white">{formatTime(time)}</p>
              ) : (
                <p className="text-2xl font-mono font-bold text-white opacity-0">00:00:00 am</p>
              )}
            </div>
          </div>
          
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-900 rounded-md p-1" aria-label="View calendar">
                <CalendarDays className="h-4 w-4" />
                {mounted ? (
                  <span className="text-sm">{formatDate(time)}</span>
                ) : (
                  <span className="text-sm opacity-0">Loading date...</span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-slate-900 border-slate-700" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
                className="rounded-md border-slate-800"
                classNames={{
                  day_today: "bg-cyan-900/50 text-cyan-50",
                  day_selected: "bg-cyan-600 text-slate-50 hover:bg-cyan-500 hover:text-slate-50 focus:bg-cyan-600 focus:text-slate-50",
                  day: "text-slate-400 hover:bg-slate-800 hover:text-slate-200",
                  head_cell: "text-slate-500",
                  caption: "text-slate-200",
                  nav_button: "border-slate-700 text-slate-400 hover:bg-slate-800",
                  table: "border-slate-800"
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
      </CardContent>
    </Card>
  )
} 