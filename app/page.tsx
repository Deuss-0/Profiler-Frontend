"use client"

//import { useState } from "react"
//import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { HeroSection } from "@/components/hero-section"
import { ClockWidget } from "@/components/widgets/clock-widget"
import { WeatherWidget } from "@/components/widgets/weather-widget"
import { SearchBar } from "@/components/widgets/search-bar"
//import { ChallengeBanner } from "@/components/challenge-banner"
//import { CurrentChallengeSection } from "@/components/current-challenge-section"
import { TerminalWidget } from "@/components/widgets/terminal-widget"
import { QuickNotesWidget } from "@/components/widgets/quick-notes-widget"
import { HackingPlatformsWidget } from "@/components/hacking/hacking-platforms-widget"
import { SocialProfilesWidget } from "@/components/social/social-profiles-widget"
import { BookmarksGrid } from "@/components/bookmarks/bookmarks-grid"
//import { EventCard } from "@/components/events/event-card"
//import { TeamPowerSection } from "@/components/events/team-power-section"
//import { TeamSelectionDialog } from "@/components/team-selection-dialog"
//import { Check, Crown } from "lucide-react"
//import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
//import { Button } from "@/components/ui/button"
//import { ProfileButton } from "@/components/profile-button"

// Types

/*
type TeamMember = {
  id: number
  nickname: string
  name: string
  avatar: string
}

/*
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

type RegisteredEvent = {
  eventId: number
  teamMembers?: TeamMember[]
}

// Mock data
const availableMembers: TeamMember[] = [
  { id: 1, nickname: "JohnDoe", name: "John Doe", avatar: "/placeholder.svg" },
  { id: 2, nickname: "JaneDoe", name: "Jane Doe", avatar: "/placeholder.svg" },
  { id: 3, nickname: "PeterPan", name: "Peter Pan", avatar: "/placeholder.svg" },
  { id: 4, nickname: "WendyDarling", name: "Wendy Darling", avatar: "/placeholder.svg" },
  { id: 5, nickname: "bytecoder", name: "Chris Brown", avatar: "/placeholder.svg" },
  { id: 6, nickname: "algoguru", name: "Emma Davis", avatar: "/placeholder.svg" },
]

/* Future Events and Challenges Implementation 
const teamStats = {
  technology: [
    { month: "Jan", value: 65 },
    { month: "Feb", value: 75 },
    { month: "Mar", value: 85 },
  ],
  wellBeing: [
    { month: "Jan", value: 70 },
    { month: "Feb", value: 80 },
    { month: "Mar", value: 90 },
  ],
  connections: [
    { month: "Jan", value: 60 },
    { month: "Feb", value: 85 },
    { month: "Mar", value: 95 },
  ],
  innovation: [
    { month: "Jan", value: 55 },
    { month: "Feb", value: 70 },
    { month: "Mar", value: 80 },
  ],
  teamwork: [
    { month: "Jan", value: 75 },
    { month: "Feb", value: 85 },
    { month: "Mar", value: 95 },
  ],
}
*/


/*
const upcomingEvents: Event[] = [
  {
    id: 1,
    title: "Tech Talk: Future of AI",
    description: "Join us for an exciting discussion about the future of AI and its impact on software development.",
    date: "March 15, 2024",
    time: "3:00 PM",
    location: "Virtual",
    image: "/placeholder.svg?height=160&width=320&text=AI+Technology",
  },
  {
    id: 2,
    title: "Workshop: Clean Code Practices",
    description: "Learn best practices for writing clean, maintainable code from industry experts.",
    date: "March 20, 2024",
    time: "2:00 PM",
    location: "Main Office",
    image: "/placeholder.svg?height=160&width=320&text=Clean+Code",
  },
  {
    id: 3,
    title: "Team Building Event",
    description: "Join us for a fun afternoon of team building activities and networking.",
    date: "March 25, 2024",
    time: "4:00 PM",
    location: "City Park",
    image: "/placeholder.svg?height=160&width=320&text=Team+Building",
  },
  {
    id: 4,
    title: "Collaborative Problem Solving Challenge",
    description:
      "Form a team of 3-5 members and work together to solve complex technical challenges. Experience the power of teamwork while tackling real-world programming problems.",
    date: "March 28, 2024",
    time: "2:00 PM",
    location: "Innovation Lab",
    image: "/placeholder.svg?height=160&width=320&text=Team+Challenge",
  },
]
*/

export default function CybersecurityDashboard() {
  
  /* const { toast } = useToast()
  const [registeredEvents, setRegisteredEvents] = useState<RegisteredEvent[]>([
    // Add a pre-registered event here
    {
      eventId: 2, // This corresponds to the "Workshop: Clean Code Practices" event
      teamMembers: [
        { id: 1, nickname: "JohnDoe", name: "John Doe", avatar: "/placeholder.svg" },
        { id: 2, nickname: "JaneDoe", name: "Jane Doe", avatar: "/placeholder.svg" },
      ],
    },
  ])
  const [eventToLeave, setEventToLeave] = useState<number | null>(null)
  const [currentChallenge, setCurrentChallenge] = useState<{
    name: string
    endDate: Date
    teamMembers?: TeamMember[]
  } | null>(null)
  const [showTeamSelection, setShowTeamSelection] = useState(false)
  const [currentEventId, setCurrentEventId] = useState<number | null>(null)

  const isEventStarted = (eventDate: string, eventTime: string) => {
    const [month, day, year] = eventDate.split(" ")[0].split(",")[0].split("/").map(Number)
    const [hours, minutes] = eventTime.split(":").map(Number)
    const [ampm] = eventTime.split(" ")[1]

    const eventDateTime = new Date(2024, month - 1, day)
    eventDateTime.setHours(ampm === "PM" ? hours + 12 : hours, minutes)

    return new Date() >= eventDateTime
  }

  // Filter registered events with team members
  /*
  const myRegisteredEvents = upcomingEvents
    .filter((event) => registeredEvents.find((reg) => reg.eventId === event.id))
    .map((event) => ({
      ...event,
      teamMembers: registeredEvents.find((reg) => reg.eventId === event.id)?.teamMembers || [],
    }))
  */
/*
  const handleRegistration = (eventId: number) => {
    const event = upcomingEvents.find((e) => e.id === eventId)

    if (event?.title.toLowerCase().includes("collaborative") || event?.description.toLowerCase().includes("team")) {
      setCurrentEventId(eventId)
      setShowTeamSelection(true)
      return
    }

    if (registeredEvents.some((reg) => reg.eventId === eventId)) {
      toast({
        title: "Already Registered",
        description: "You are already registered for this event.",
        variant: "default",
      })
      return
    }

    setRegisteredEvents([...registeredEvents, { eventId }])
    toast({
      description: "You have successfully registered for the event!",
      className: "bg-emerald-800 border-0 text-white",
      icon: <Check className="h-5 w-5" />,
    })
  }

  const handleLeaveEvent = (eventId: number) => {
    setEventToLeave(eventId)
  }

  const handleEventComplete = (eventId: number) => {
    // Implement check-in logic here
    const pointsEarned = 1000 // You can adjust this or make it dynamic based on the event

    toast({
      description: (
        <div className="flex flex-col gap-2">
          <p>¡Evento completado con éxito!</p>
          <div className="flex items-center gap-2 bg-emerald-700/50 rounded-full px-3 py-1 w-fit">
            <Crown className="h-4 w-4 text-yellow-300" />
            <span className="text-sm font-medium">+{pointsEarned} XP</span>
          </div>
        </div>
      ),
      className: "bg-emerald-800 border-0 text-white",
      icon: <Check className="h-5 w-5" />,
    })
  }

  const confirmLeaveEvent = () => {
    if (eventToLeave !== null) {
      setRegisteredEvents(registeredEvents.filter((reg) => reg.eventId !== eventToLeave))
      setEventToLeave(null)
      toast({
        title: "Event Left",
        description: "You have been removed from this event.",
        variant: "default",
      })
    }
  }

  const handleTeamConfirmation = (members: TeamMember[]) => {
    if (currentEventId) {
      setRegisteredEvents([
        ...registeredEvents,
        {
          eventId: currentEventId,
          teamMembers: members,
        },
      ])
      toast({
        description: "¡Te has registrado exitosamente con tu equipo!",
        className: "bg-emerald-800 border-0 text-white",
        icon: <Check className="h-5 w-5" />,
      })
      setCurrentEventId(null)
    }
  }

  const handleAcceptChallenge = () => {
    // Randomly select 2-4 team members
    const teamSize = Math.floor(Math.random() * 3) + 2 // Random number between 2 and 4
    const shuffled = [...availableMembers].sort(() => 0.5 - Math.random())
    const selectedTeam = shuffled.slice(0, teamSize)

    setCurrentChallenge({
      name: "Clean Code Innovation Challenge",
      endDate: new Date("2024-03-31T23:59:59"),
      teamMembers: selectedTeam,
    })
    toast({
      description: (
        <div className="flex flex-col gap-3">
          <p>You've successfully joined the Clean Code Challenge!</p>
          <div className="space-y-2">
            <p className="text-sm font-medium">Your assigned team:</p>
            <div className="flex -space-x-2">
              {selectedTeam.map((member) => (
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

  const handleLeaveChallenge = () => {
    setCurrentChallenge(null)
    toast({
      title: "Challenge Left",
      description: "You have been removed from this challenge.",
      variant: "default",
    })
  }
*/

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="container mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-6">
        {/* Hero Section */}
        <HeroSection />
        </div>

        {/* Top Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <ClockWidget />
          <WeatherWidget />
          <SearchBar />
        </div>

        {/* Add Challenge Banner here 
        {!currentChallenge && (
          <div className="mb-8">
            <ChallengeBanner onAcceptChallenge={handleAcceptChallenge} />
          </div>
        )}*/}

        {/* Current Challenge Section 
        {currentChallenge && (
          <CurrentChallengeSection
            challengeName={currentChallenge.name}
            endDate={currentChallenge.endDate}
            onLeaveChallenge={handleLeaveChallenge}
            teamMembers={currentChallenge.teamMembers}
          />
        )}*/}

          {/* Bookmarks */}
          <div className="mb-6">
          <BookmarksGrid />
        </div>
        
        {/* Platform Widgets */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <HackingPlatformsWidget />
          <SocialProfilesWidget />
        </div>

       

        {/* Middle Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <TerminalWidget />
          <QuickNotesWidget />
        </div>

       {/* FUTURE EVENTS AND CHALLENGES IMPLEMENTATION  */}
        {/* Events and Challenges */}
        {/*
        <div className="mt-12">
          <Tabs defaultValue="missions" className="w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Events & Challenges</h2>
              <TabsList className="bg-slate-900">
                <TabsTrigger
                  value="missions"
                  className="data-[state=active]:bg-cyan-400 data-[state=active]:text-slate-900"
                >
                  My Missions
                </TabsTrigger>
                <TabsTrigger
                  value="whats-next"
                  className="data-[state=active]:bg-cyan-400 data-[state=active]:text-slate-900"
                >
                  What's Next?
                </TabsTrigger>
                <TabsTrigger
                  value="team-power"
                  className="data-[state=active]:bg-cyan-400 data-[state=active]:text-slate-900"
                >
                  Team Power-Up
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="missions" className="mt-0">
              <p className="text-slate-400 mb-6">Your current active missions</p>
              {myRegisteredEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myRegisteredEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      showLeaveButton={true}
                      onLeave={() => handleLeaveEvent(event.id)}
                      onComplete={() => handleEventComplete(event.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl bg-slate-900/50 p-8 text-center">
                  <p className="text-slate-400">No active missions at the moment</p>
                  <p className="text-sm text-slate-500 mt-2">
                    Register for events in the "What's Next?" tab to see them here
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="whats-next" className="mt-0">
              <p className="text-slate-400 mb-6">Upcoming events and opportunities</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    showRegisterButton={true}
                    onRegister={() => handleRegistration(event.id)}
                    isRegistered={registeredEvents.some((reg) => reg.eventId === event.id)}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="team-power" className="mt-0">
              <TeamPowerSection
                teamStats={teamStats}
                upcomingEvents={upcomingEvents}
                onRegister={handleRegistration}
                isRegistered={(eventId) => registeredEvents.some((reg) => reg.eventId === eventId)}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      */} 

      {/* Modals */}
      {/*
      <TeamSelectionDialog
        open={showTeamSelection}
        onOpenChange={setShowTeamSelection}
        minTeamSize={3}
        maxTeamSize={5}
        onConfirm={handleTeamConfirmation}
      />

      {eventToLeave !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/80" onClick={() => setEventToLeave(null)}></div>
          <div className="relative bg-slate-900 border border-slate-800 rounded-lg w-full max-w-md p-6 shadow-lg">
            <div className="flex gap-4 items-center sm:items-start mb-4">
              <div className="hidden sm:flex h-12 w-12 rounded-full items-center justify-center bg-amber-500/10">
                <AlertTriangle className="h-6 w-6 text-amber-500" />
              </div>
              <div className="space-y-2 text-left">
                <h2 className="text-xl font-semibold text-white">Leave Event</h2>
                <p className="text-slate-400">
                  Are you sure you want to leave {upcomingEvents.find((e) => e.id === eventToLeave)?.title}? This action
                  cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setEventToLeave(null)}
                className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 hover:text-white"
              >
                Cancel
              </Button>
              <Button onClick={confirmLeaveEvent} className="bg-red-600 text-white hover:bg-red-700">
                Leave Event
              </Button>
            </div>
          </div>
          
        </div>
      )}
      */}
      </div>

      <Toaster />
    </div>
  )
}
