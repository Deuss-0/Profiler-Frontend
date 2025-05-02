"use client"

import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import Image from "next/image"
import { useToast } from "@/components/ui/use-toast"
import { Check, Users } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface ChallengeDetailsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAcceptChallenge: () => void
}

// Mock data for available team members
const availableMembers = [
  { id: 1, nickname: "techmaster", name: "John Doe", avatar: "/placeholder.svg" },
  { id: 2, nickname: "codewizard", name: "Jane Smith", avatar: "/placeholder.svg" },
  { id: 3, nickname: "debugger", name: "Mike Johnson", avatar: "/placeholder.svg" },
  { id: 4, nickname: "devninja", name: "Sarah Wilson", avatar: "/placeholder.svg" },
  { id: 5, nickname: "bytecoder", name: "Chris Brown", avatar: "/placeholder.svg" },
  { id: 6, nickname: "algoguru", name: "Emma Davis", avatar: "/placeholder.svg" },
]

export function _ChallengeDetailsDialog({ open, onOpenChange, onAcceptChallenge }: ChallengeDetailsProps) {
  const { toast } = useToast()
  const endDate = new Date("2024-03-31T23:59:59")
  const [timeLeft, setTimeLeft] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [_assignedTeam, setAssignedTeam] = useState<typeof availableMembers>([])

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      const difference = endDate.getTime() - now.getTime()

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        })
      } else {
        clearInterval(timer)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [endDate])

  const assignRandomTeam = () => {
    // Randomly select 2-4 team members
    const teamSize = Math.floor(Math.random() * 3) + 2 // Random number between 2 and 4
    const shuffled = [...availableMembers].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, teamSize)
  }

  const handleAcceptChallenge = () => {
    const team = assignRandomTeam()
    setAssignedTeam(team)

    if (onAcceptChallenge) {
      onAcceptChallenge()
      onOpenChange(false)

      // Show success toast with team information
      toast({
        description: (
          <div className="flex flex-col gap-3">
            <p>You've successfully joined the Clean Code Challenge!</p>
            <div className="space-y-2">
              <p className="text-sm font-medium">Your assigned team:</p>
              <div className="flex -space-x-2">
                {team.map((member) => (
                  <Avatar key={member.id} className="border-2 border-emerald-800 h-8 w-8">
                    <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.nickname} />
                    <AvatarFallback>{member.nickname.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                ))}
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-emerald-700 border-2 border-emerald-800">
                  <span className="text-xs">+You</span>
                </div>
              </div>
            </div>
          </div>
        ),
        className: "bg-emerald-800 border-0 text-white",
        icon: <Check className="h-5 w-5" />,
      })
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/80" onClick={() => onOpenChange(false)}></div>
      <div className="relative bg-slate-900 border border-slate-800 rounded-lg w-full max-w-[700px] p-6 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl text-white flex items-center gap-3">
              Clean Code Innovation Challenge
              <span className="inline-flex items-center gap-1 bg-pink-500/20 text-pink-400 px-2 py-1 rounded-full text-sm">
                <Users className="h-4 w-4" />
                Group Challenge
              </span>
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Join a randomly assigned team and push your coding skills to the next level
            </p>
          </div>
          <button onClick={() => onOpenChange(false)} className="text-slate-400 hover:text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Challenge Image */}
        <div className="relative w-full h-[200px] rounded-lg overflow-hidden my-4">
          <Image
            src="/placeholder.svg?height=200&width=700&text=Challenge+Preview"
            alt="Challenge preview"
            fill
            className="object-cover"
          />
        </div>

        {/* Challenge Details */}
        <div className="space-y-4">
          <div>
            <h4 className="text-lg font-semibold mb-2">Challenge Description</h4>
            <p className="text-slate-400">
              Work together with your assigned team to demonstrate expertise in writing clean, maintainable code. You'll
              collaborate on refactoring existing code, implementing design patterns, and creating efficient solutions
              while following clean code principles.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-2">Team Structure</h4>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <ul className="list-disc list-inside text-slate-400 space-y-1">
                <li>You'll be randomly assigned to a team of 3-5 members</li>
                <li>Team members will be revealed after joining the challenge</li>
                <li>Collaborate using our built-in team communication tools</li>
              </ul>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-2">Objectives</h4>
            <ul className="list-disc list-inside text-slate-400 space-y-1">
              <li>Implement SOLID principles in provided code examples as a team</li>
              <li>Collaborate on refactoring legacy code to improve maintainability</li>
              <li>Write comprehensive unit tests together</li>
              <li>Document your team's code following best practices</li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-2">Rewards</h4>
            <ul className="list-disc list-inside text-slate-400 space-y-1">
              <li>5000 XP upon successful completion</li>
              <li>Clean Code Champion badge for all team members</li>
              <li>Recognition in the company newsletter</li>
              <li>Special team achievement badge</li>
            </ul>
          </div>

          {/* Countdown Timer */}
          <div className="bg-slate-800/50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-slate-400 mb-3">Time Remaining</h4>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{timeLeft.days}</div>
                <div className="text-xs text-slate-400">Days</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{timeLeft.hours}</div>
                <div className="text-xs text-slate-400">Hours</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{timeLeft.minutes}</div>
                <div className="text-xs text-slate-400">Minutes</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{timeLeft.seconds}</div>
                <div className="text-xs text-slate-400">Seconds</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between mt-6">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="bg-slate-800 hover:bg-slate-700 text-white"
          >
            Cancel
          </Button>
          <Button onClick={handleAcceptChallenge} className="bg-indigo-500 hover:bg-indigo-600 text-white">
            Join Challenge & Get Assigned Team
          </Button>
        </div>
      </div>
    </div>
  )
}
