import { Code, Heart, _Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EventCard } from "./event-card"

type TeamStats = {
  technology: { month: string; value: number }[]
  wellBeing: { month: string; value: number }[]
  connections: { month: string; value: number }[]
  innovation: { month: string; value: number }[]
  teamwork: { month: string; value: number }[]
}

type Event = {
  id: number
  title: string
  description: string
  date: string
  time: string
  location: string
  image: string
  teamMembers?: {
    id: number
    nickname: string
    name: string
    avatar: string
  }[]
}

type TeamPowerSectionProps = {
  teamStats: TeamStats
  upcomingEvents: Event[]
  onRegister: (eventId: number) => void
  isRegistered: (eventId: number) => boolean
}

export function _TeamPowerSection({
  teamStats,
  upcomingEvents,
  onRegister,
  isRegistered,
}: TeamPowerSectionProps) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Team Performance Analytics</h3>
          <p className="text-slate-400">Track your team's progress across different categories</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-slate-800 hover:bg-slate-700 text-white">
            Last 3 Months
          </Button>
          <Button variant="outline" className="bg-slate-800 hover:bg-slate-700 text-white">
            Export Data
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Technology Chart */}
        <div className="bg-slate-900 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-400/10 rounded-lg">
                <Code className="h-5 w-5 text-purple-400" />
              </div>
              <h4 className="font-semibold">Technology</h4>
            </div>
            <div className="flex items-center gap-2 bg-purple-400/10 rounded-full px-3 py-1">
              <span className="text-sm text-purple-400">85% Growth</span>
            </div>
          </div>
          <div className="h-[200px] w-full">
            <div className="relative h-full">
              <div className="absolute inset-0 flex items-end justify-between gap-2">
                {teamStats.technology.map((stat, index) => (
                  <div key={stat.month} className="flex-1">
                    <div
                      className="bg-purple-400 rounded-t-sm w-full transition-all duration-500"
                      style={{
                        height: `${stat.value}%`,
                        opacity: index === teamStats.technology.length - 1 ? 1 : 0.3,
                      }}
                    />
                    <div className="text-center mt-2 text-sm text-slate-400">{stat.month}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Well-Being Chart */}
        <div className="bg-slate-900 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-400/10 rounded-lg">
                <Heart className="h-5 w-5 text-orange-400" />
              </div>
              <h4 className="font-semibold">Well-Being</h4>
            </div>
            <div className="flex items-center gap-2 bg-orange-400/10 rounded-full px-3 py-1">
              <span className="text-sm text-orange-400">90% Growth</span>
            </div>
          </div>
          <div className="h-[200px] w-full">
            <div className="relative h-full">
              <div className="absolute inset-0 flex items-end justify-between gap-2">
                {teamStats.wellBeing.map((stat, index) => (
                  <div key={stat.month} className="flex-1">
                    <div
                      className="bg-orange-400 rounded-t-sm w-full transition-all duration-500"
                      style={{
                        height: `${stat.value}%`,
                        opacity: index === teamStats.wellBeing.length - 1 ? 1 : 0.3,
                      }}
                    />
                    <div className="text-center mt-2 text-sm text-slate-400">{stat.month}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Available Team Challenges</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {upcomingEvents
            .filter(
              (event) =>
                event.title.toLowerCase().includes("collaborative") ||
                event.description.toLowerCase().includes("team"),
            )
            .map((event) => (
              <EventCard
                key={event.id}
                event={event}
                showRegisterButton={true}
                onRegister={() => onRegister(event.id)}
                isRegistered={isRegistered(event.id)}
              />
            ))}
        </div>
      </div>
    </div>
  )
} 