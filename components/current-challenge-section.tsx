"use client"

import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { Clock, AlertTriangle, Users } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface TeamMember {
  id: number
  nickname: string
  name: string
  avatar: string
}

interface CurrentChallengeProps {
  challengeName: string
  endDate: Date
  onLeaveChallenge: () => void
  teamMembers?: TeamMember[]
}

export function _CurrentChallengeSection({
  challengeName,
  endDate,
  onLeaveChallenge,
  teamMembers,
}: CurrentChallengeProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Initial calculation of time left
    const calculateTimeLeft = () => {
      const now = new Date()
      const difference = endDate.getTime() - now.getTime()

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        })
      }
    }
    
    // Calculate immediately
    calculateTimeLeft()
    
    // Then set up interval
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [endDate, mounted])

  const handleLeaveChallenge = () => {
    onLeaveChallenge()
    setShowLeaveDialog(false)
  }

  return (
    <>
      <div className="bg-slate-900 rounded-xl p-6 mb-12">
        <h2 className="text-xl font-semibold mb-6">My Current Challenge</h2>
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-medium">{challengeName}</h3>
                {teamMembers && (
                  <span className="inline-flex items-center gap-1 bg-pink-500/20 text-pink-400 px-2 py-1 rounded-full text-sm">
                    <Users className="h-4 w-4" />
                    Group Challenge
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Clock className="h-4 w-4" />
                <span>Time Remaining</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="bg-slate-800 hover:bg-slate-700 text-white">
                View Progress
              </Button>
              <Button variant="destructive" onClick={() => setShowLeaveDialog(true)}>
                Leave Challenge
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold mb-1">{timeLeft.days}</div>
              <div className="text-xs text-slate-400">Days</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold mb-1">{timeLeft.hours}</div>
              <div className="text-xs text-slate-400">Hours</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold mb-1">{timeLeft.minutes}</div>
              <div className="text-xs text-slate-400">Minutes</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold mb-1">{timeLeft.seconds}</div>
              <div className="text-xs text-slate-400">Seconds</div>
            </div>
          </div>

          {/* Team Members Section */}
          {teamMembers && teamMembers.length > 0 && (
            <div className="bg-slate-800/50 rounded-lg p-4 space-y-3">
              <h4 className="text-sm font-medium text-slate-400">Your Team</h4>
              <div className="flex -space-x-2">
                {teamMembers.map((member) => (
                  <Avatar key={member.id} className="border-2 border-slate-900 h-8 w-8">
                    <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.nickname} />
                    <AvatarFallback>{member.nickname.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                ))}
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-700 border-2 border-slate-900">
                  <span className="text-xs text-slate-300">+You</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {teamMembers.map((member) => (
                  <span key={member.id} className="text-xs text-slate-400 bg-slate-700/50 px-2 py-1 rounded-full">
                    {member.nickname}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {mounted && showLeaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/80" onClick={() => setShowLeaveDialog(false)}></div>
          <div className="relative bg-slate-900 border border-slate-800 rounded-lg w-full max-w-md p-6 shadow-lg">
            <div className="flex gap-4 items-center sm:items-start mb-4">
              <div className="hidden sm:flex h-12 w-12 rounded-full items-center justify-center bg-amber-500/10">
                <AlertTriangle className="h-6 w-6 text-amber-500" />
              </div>
              <div className="space-y-2 text-left">
                <h2 className="text-xl font-semibold text-white">Leave Challenge</h2>
                <p className="text-slate-400">
                  Are you sure you want to leave this challenge? All your progress will be lost
                  {teamMembers && teamMembers.length > 0 && " and your team will be notified"}.
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowLeaveDialog(false)}
                className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 hover:text-white"
              >
                Cancel
              </Button>
              <Button onClick={handleLeaveChallenge} className="bg-red-600 text-white hover:bg-red-700">
                Yes, leave challenge
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
