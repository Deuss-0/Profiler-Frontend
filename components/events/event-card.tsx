import Image from "next/image"
import { Crown, CalendarDays, Clock, MapPin, Check, X, _Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

type TeamMember = {
  id: number
  nickname: string
  name: string
  avatar: string
}

type Event = {
  id: number
  title: string
  description: string
  date: string
  time: string
  location: string
  image: string
  teamMembers?: TeamMember[]
}

type EventCardProps = {
  event: Event
  showRegisterButton?: boolean
  showLeaveButton?: boolean
  onRegister?: () => void
  onLeave?: () => void
  onComplete?: () => void
  isRegistered?: boolean
}

export function _EventCard({
  event,
  showRegisterButton = false,
  showLeaveButton = false,
  onRegister,
  onLeave,
  onComplete,
  isRegistered = false,
}: EventCardProps) {
  const isEventStarted = (eventDate: string, eventTime: string) => {
    const [month, day, _year] = eventDate.split(" ")[0].split(",")[0].split("/").map(Number)
    const [hours, minutes] = eventTime.split(":").map(Number)
    const [ampm] = eventTime.split(" ")[1]

    const eventDateTime = new Date(2024, month - 1, day)
    eventDateTime.setHours(ampm === "PM" ? hours + 12 : hours, minutes)

    return new Date() >= eventDateTime
  }

  return (
    <div className="flex flex-col bg-slate-900 rounded-xl overflow-hidden">
      <div className="relative w-full aspect-video">
        <Image src={event.image || "/placeholder.svg"} alt={event.title} fill className="object-cover" priority />
      </div>
      <div className="flex flex-col flex-1 p-4">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold">{event.title}</h3>
          <div className="flex items-center gap-2 bg-cyan-400/10 rounded-full px-3 py-1">
            <Crown className="h-4 w-4 text-cyan-400" />
            <span className="text-sm text-cyan-400">1000 XP</span>
          </div>
        </div>
        <p className="text-slate-400 text-sm mb-4 flex-1">{event.description}</p>
        <div className="space-y-4">
          <div className="flex flex-col gap-2 text-sm text-slate-400">
            <div className="flex items-center gap-1">
              <CalendarDays className="h-4 w-4" />
              {event.date}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {event.time}
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {event.location}
            </div>
          </div>

          {/* Show team members if they exist */}
          {event.teamMembers && event.teamMembers.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-slate-400">Team Members</h4>
              <div className="flex -space-x-2">
                {event.teamMembers.map((member, _index) => (
                  <Avatar key={member.id} className="border-2 border-slate-900 h-8 w-8">
                    <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.nickname} />
                    <AvatarFallback>{member.nickname.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                ))}
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-800 border-2 border-slate-900">
                  <span className="text-xs text-slate-400">+You</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {event.teamMembers.map((member) => (
                  <span key={member.id} className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded-full">
                    {member.nickname}
                  </span>
                ))}
              </div>
            </div>
          )}

          {showRegisterButton && (
            <Button
              onClick={onRegister}
              variant={isRegistered ? "secondary" : "default"}
              className="w-full"
              disabled={isRegistered}
            >
              {isRegistered ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Registered
                </>
              ) : (
                "Register Now"
              )}
            </Button>
          )}
          {showLeaveButton &&
            (isEventStarted(event.date, event.time) ? (
              <Button onClick={onComplete} variant="default" className="w-full">
                <Check className="h-4 w-4 mr-2" />
                Check in
              </Button>
            ) : (
              <Button onClick={onLeave} variant="destructive" className="w-full">
                <X className="h-4 w-4 mr-2" />
                Leave Event
              </Button>
            ))}
        </div>
      </div>
    </div>
  )
} 