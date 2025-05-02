"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Trophy, Target, Flag, Award, Shield, Skull, X, Ticket } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"

// TryHackMe level system
type ThmLevel = {
  level: number;
  hexLevel: string;
  name: string;
  minPoints: number;
}

const THM_LEVELS: ThmLevel[] = [
  { level: 1, hexLevel: "0x1", name: "Neophyte", minPoints: 0 },
  { level: 2, hexLevel: "0x2", name: "Apprentice", minPoints: 200 },
  { level: 3, hexLevel: "0x3", name: "Pathfinder", minPoints: 500 },
  { level: 4, hexLevel: "0x4", name: "Seeker", minPoints: 1000 },
  { level: 5, hexLevel: "0x5", name: "Visionary", minPoints: 1500 },
  { level: 6, hexLevel: "0x6", name: "Voyager", minPoints: 2000 },
  { level: 7, hexLevel: "0x7", name: "Adept", minPoints: 3000 },
  { level: 8, hexLevel: "0x8", name: "Hacker", minPoints: 4000 },
  { level: 9, hexLevel: "0x9", name: "Mage", minPoints: 8000 },
  { level: 10, hexLevel: "0xA", name: "Wizard", minPoints: 12000 },
  { level: 11, hexLevel: "0xB", name: "Master", minPoints: 15000 },
  { level: 12, hexLevel: "0xC", name: "Guru", minPoints: 17000 },
  { level: 13, hexLevel: "0xD", name: "Legend", minPoints: 20000 },
  { level: 14, hexLevel: "0xE", name: "Guardian", minPoints: 35000 },
  { level: 15, hexLevel: "0xF", name: "TITAN", minPoints: 50000 },
  { level: 16, hexLevel: "0x10", name: "SAGE", minPoints: 65000 },
  { level: 17, hexLevel: "0x11", name: "VANGUARD", minPoints: 80000 },
  { level: 18, hexLevel: "0x12", name: "SHOGUN", minPoints: 95000 },
  { level: 19, hexLevel: "0x13", name: "ASCENDED", minPoints: 110000 },
  { level: 20, hexLevel: "0x14", name: "MYTHIC", minPoints: 130000 },
  { level: 21, hexLevel: "0x15", name: "ETERNAL", minPoints: 150000 }
];

// Helper function to get level and rank based on points
const getThmLevelAndRank = (points: number): { level: number; hexLevel: string; rank: string } => {
  // Find the highest level the user qualifies for
  let userLevel = THM_LEVELS[0]; // Default to the lowest level
  
  for (let i = THM_LEVELS.length - 1; i >= 0; i--) {
    if (points >= THM_LEVELS[i].minPoints) {
      userLevel = THM_LEVELS[i];
      break;
    }
  }
  
  return {
    level: userLevel.level,
    hexLevel: userLevel.hexLevel,
    rank: userLevel.name
  };
};

// Calculate next level and progress percentage
const getNextLevelProgress = (points: number): { nextLevel: ThmLevel | null; progressPercentage: number } => {
  // Find current level
  let currentLevelIndex = 0;
  for (let i = THM_LEVELS.length - 1; i >= 0; i--) {
    if (points >= THM_LEVELS[i].minPoints) {
      currentLevelIndex = i;
      break;
    }
  }
  
  // If at max level, return null for next level
  if (currentLevelIndex === THM_LEVELS.length - 1) {
    return { nextLevel: null, progressPercentage: 100 };
  }
  
  const nextLevel = THM_LEVELS[currentLevelIndex + 1];
  const currentLevel = THM_LEVELS[currentLevelIndex];
  
  // Calculate progress percentage to next level
  const pointsForNextLevel = nextLevel.minPoints - currentLevel.minPoints;
  const currentProgress = points - currentLevel.minPoints;
  const progressPercentage = Math.min(100, Math.floor((currentProgress / pointsForNextLevel) * 100));
  
  return { nextLevel, progressPercentage };
};

type PlatformData = {
  username: string
  rank: string
  points: number
  badges: number
  ranking: number
  completedChallenges: number
  totalPoints: number
  level?: number
  hexLevel?: string
  avatar?: string
  nextLevelPercentage?: number
}

type HackingProfile = {
  platform: string
  username: string
  apiKey?: string
  connected: boolean
}

type THMBadge = {
  _id: string
  name: string
  image?: string
}

type THMTicket = {
  name: string;
  title: string;
  colour: string;
  automaticRedeem: boolean;
}

export function HackingPlatformsWidget() {
  const [thm, setThm] = useState<PlatformData | null>(null)
  const [htb, setHtb] = useState<PlatformData | null>(null)
  const [thmBadges, setThmBadges] = useState<THMBadge[]>([])
  const [thmTickets, setThmTickets] = useState<{ won: THMTicket[], available: THMTicket[] }>({ won: [], available: [] })
  const [loading, setLoading] = useState(true)
  const [hackingProfiles, setHackingProfiles] = useState<HackingProfile[]>([])
  const { isAuthenticated } = useAuth()
  const { toast } = useToast()
  const API_URL = process.env.NEXT_PUBLIC_API_URL
  // Function to fetch TryHackMe rank
  const fetchTryHackMeRank = async (username: string) => {
    try {
      if (!username) return null;
      
      // Safe fetch with better error handling
      console.log(`Fetching TryHackMe rank for: ${username}`);
      const response = await fetch(`${API_URL}/api/tryhackme/rank/${username}`, {
        method: 'GET',
        cache: 'no-store'
      });
      
      if (!response.ok) {
        console.warn(`TryHackMe rank API error: ${response.status}`);
        return null; // Return null instead of throwing
      }
      
      const data = await response.json();
      return data.userRank; // Extract rank from response
    } catch (error) {
      console.error('Error fetching TryHackMe rank:', error);
      return null; // Never throw, just return null on errors
    }
  }

  // Function to fetch TryHackMe badges
  const fetchTryHackMeBadges = async (username: string) => {
    try {
      if (!username) return { badges: [], count: 0 };
      
      // Safe fetch with better error handling
      console.log(`Fetching TryHackMe badges for: ${username}`);
      const response = await fetch(`${API_URL}/api/tryhackme/badges/${username}`, {
        method: 'GET',
        cache: 'no-store'
      });
      
      if (!response.ok) {
        console.warn(`TryHackMe badges API error: ${response.status}`);
        return { badges: [], count: 0 }; // Return empty data instead of throwing
      }
      
      const data = await response.json();
      return {
        badges: data.badges || [],
        count: data.count || 0
      };
    } catch (error) {
      console.error('Error fetching TryHackMe badges:', error);
      return { badges: [], count: 0 }; // Never throw, just return empty data
    }
  }

  // Function to fetch TryHackMe completed rooms
  const fetchTryHackMeRooms = async (username: string) => {
    try {
      if (!username) return 0;
      
      // Safe fetch with better error handling
      console.log(`Fetching TryHackMe rooms for: ${username}`);
      const response = await fetch(`${API_URL}/api/tryhackme/rooms/${username}`, {
        method: 'GET',
        cache: 'no-store'
      });
      
      if (!response.ok) {
        console.warn(`TryHackMe rooms API error: ${response.status}`);
        return 0; // Return 0 instead of throwing
      }
      
      const data = await response.json();
      return data.completedRooms || 0;
    } catch (error) {
      console.error('Error fetching TryHackMe rooms:', error);
      return 0; // Never throw, just return 0 on errors
    }
  }

  // Function to fetch TryHackMe user data from Discord API
  const fetchTryHackMeUserData = async (username: string) => {
    try {
      if (!username) return null;
      
      console.log(`Fetching TryHackMe user data for: ${username}`);
      
      // Use the backend endpoint which handles the API call for us
      const response = await fetch(`${API_URL}/api/tryhackme/user/${username}`, {
        method: 'GET',
        cache: 'no-store'
      });
      
      if (!response.ok) {
        console.warn(`TryHackMe user data API error: ${response.status}`);
        return null;
      }
      
      const data = await response.json();
      return {
        points: data.points,
        avatar: data.avatar,
        userRank: data.userRank,
        subscribed: data.subscribed
      };
    } catch (error) {
      console.error('Error fetching TryHackMe user data:', error);
      return null;
    }
  }

  // Function to fetch TryHackMe tickets
  const fetchTryHackMeTickets = async (username: string) => {
    try {
      if (!username) return { won: [], available: [] };
      
      console.log(`Fetching TryHackMe tickets for: ${username}`);
      
      // Use the backend endpoint which handles the API call for us
      const response = await fetch(`${API_URL}/api/tryhackme/tickets/${username}`, {
        method: 'GET',
        cache: 'no-store'
      });
      
      if (!response.ok) {
        console.warn(`TryHackMe tickets API error: ${response.status}`);
        return { won: [], available: [] };
      }
      
      const data = await response.json();
      return {
        won: data.ticketsWon || [],
        available: data.ticketsAva || []
      };
    } catch (error) {
      console.error('Error fetching TryHackMe tickets:', error);
      return { won: [], available: [] };
    }
  }

  // Function to fetch user's hacking profiles
  const fetchHackingProfiles = async () => {
    try {
      if (!isAuthenticated) {
        return []
      }
      
      // Add proper headers with token
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      };
      
      // Check for token in storage
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }
      
      console.log(`Fetching hacking profiles from: ${API_URL}/api/hacking-profiles`);
      
      const response = await fetch(`${API_URL}/api/hacking-profiles`, {
        method: 'GET',
        credentials: "include",
        headers,
        cache: 'no-store' // Prevent caching issues
      })
      
      if (!response.ok) {
        // Get error details
        const errorText = await response.text();
        console.error(`Hacking profiles API error ${response.status}:`, errorText);
        
        // For non-auth errors, try to return empty array instead of throwing
        if (response.status === 401 || response.status === 403) {
          throw new Error('Authentication required to fetch hacking profiles');
        } else {
          console.warn('Non-fatal error fetching hacking profiles, returning empty array');
          return [];
        }
      }
      
      const data = await response.json()
      return data.profiles || []
    } catch (error) {
      console.error('Error fetching hacking profiles:', error)
      
      // Don't bubble up the error, just return empty
      return []
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        if (!isAuthenticated) {
          // Show demo data for non-authenticated users
          const demoPoints = 2500;
          const demoLevelData = getThmLevelAndRank(demoPoints);
          const demoNextLevelData = getNextLevelProgress(demoPoints);
          
          setThm({
            username: "Demo User",
            rank: demoLevelData.rank,
            points: demoPoints,
            badges: 5,
            ranking: 5000,
            completedChallenges: 25,
            totalPoints: 150000,
            level: demoLevelData.level,
            hexLevel: demoLevelData.hexLevel,
            avatar: "https://assets.tryhackme.com/img/favicon.png",
            nextLevelPercentage: demoNextLevelData.progressPercentage
          })

          setHtb({
            username: "Demo User",
            rank: "Script Kiddie",
            points: 1500,
            badges: 3,
            ranking: 7500,
            completedChallenges: 15,
            totalPoints: 10000,
          })

          // Set demo badges
          setThmBadges([
            { _id: "1", name: "demo-badge-1", image: "" },
            { _id: "2", name: "demo-badge-2", image: "" },
            { _id: "3", name: "demo-badge-3", image: "" },
            { _id: "4", name: "demo-badge-4", image: "" },
            { _id: "5", name: "demo-badge-5", image: "" }
          ])

          // Set demo tickets
          setThmTickets({
            won: [
              { name: "streak-freeze-1", title: "1 Day Streak Freeze", colour: "lightblue", automaticRedeem: true },
              { name: "cybercrusader-title", title: "Cyber Crusader", colour: "orange", automaticRedeem: true }
            ],
            available: [
              { name: "streak-freeze-7", title: "7 Day Streak Freeze", colour: "red", automaticRedeem: true },
              { name: "10-swag-voucher", title: "£10 Swag Voucher", colour: "yellow", automaticRedeem: true },
              { name: "tryhackme-tshirt", title: "TryHackMe T-Shirt", colour: "green", automaticRedeem: true }
            ]
          })

          toast({
            title: "Demo Mode",
            description: "Sign in to see your actual progress and statistics.",
            className: "bg-blue-800 border-0 text-white",
          })
          return
        }

        // Fetch user's hacking profiles
        const profiles = await fetchHackingProfiles()
        setHackingProfiles(profiles)
        
        // Find TryHackMe profile
        const thmProfile = profiles.find((p: HackingProfile) => p.platform === 'tryhackme' && p.connected)
        
        if (thmProfile && thmProfile.username) {
          // Fetch TryHackMe rank
          const thmRank = await fetchTryHackMeRank(thmProfile.username)
          
          // Fetch TryHackMe badges
          const thmBadgesData = await fetchTryHackMeBadges(thmProfile.username)
          setThmBadges(thmBadgesData.badges)
          
          // Fetch TryHackMe completed rooms
          const completedRooms = await fetchTryHackMeRooms(thmProfile.username)
          
          // Fetch TryHackMe user data from Discord API
          const userData = await fetchTryHackMeUserData(thmProfile.username)
          
          // Fetch TryHackMe tickets
          const ticketsData = await fetchTryHackMeTickets(thmProfile.username)
          setThmTickets(ticketsData)
          
          // The actual points from API
          const userPoints = userData?.points || 7500;
          
          // Get level data based on points
          const levelData = getThmLevelAndRank(userPoints);
          
          // Get next level progress
          const nextLevelData = getNextLevelProgress(userPoints);
          
          setThm({
            username: thmProfile.username,
            rank: levelData.rank,
            points: userPoints,
            badges: thmBadgesData.count,
            ranking: userData?.userRank || thmRank || 0,
            completedChallenges: completedRooms,
            totalPoints: 150000, // Max points for ETERNAL level
            level: levelData.level,
            hexLevel: levelData.hexLevel,
            avatar: userData?.avatar || undefined,
            nextLevelPercentage: nextLevelData.progressPercentage
          })
        } else {
          // No TryHackMe profile, show placeholder
          setThm({
            username: "Not Connected",
            rank: "N/A",
            points: 0,
            badges: 0,
            ranking: 0,
            completedChallenges: 0,
            totalPoints: 150000,
            level: 0,
            hexLevel: "0x0"
          })
        }

        // For HackTheBox, you can implement similar logic if you have an API
        setHtb({
          username: "0xSecurity",
          rank: "Pro Hacker",
          points: 5000,
          badges: 8,
          ranking: 2500,
          completedChallenges: 42,
          totalPoints: 10000,
        })
      } catch (error) {
        console.error("Failed to fetch platform data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [isAuthenticated, toast, API_URL])

  // Helper function to format badge name
  const formatBadgeName = (name: string) => {
    return name
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Helper function for ticket color mapping
  const getTicketColor = (colour: string) => {
    const colorMap: Record<string, string> = {
      "lightblue": "bg-blue-200 text-blue-900",
      "red": "bg-red-500 text-white",
      "yellow": "bg-yellow-400 text-yellow-900",
      "green": "bg-green-500 text-white",
      "darkblue": "bg-blue-800 text-white",
      "brown": "bg-amber-800 text-white",
      "lime": "bg-lime-400 text-lime-900",
      "pink": "bg-pink-400 text-pink-900",
      "gray": "bg-gray-500 text-white",
      "purple": "bg-purple-600 text-white",
      "black": "bg-black text-white",
      "orange": "bg-orange-500 text-white"
    }
    
    return colorMap[colour] || "bg-slate-600 text-white"
  }

  if (loading) {
    return (
      <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-sm">
        <CardContent className="p-6 flex items-center justify-center h-[200px]">
          <p className="text-slate-400">Loading platform data...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Hacking Platforms</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="tryhackme">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="tryhackme" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
              <div className="flex items-center">
                <img src="https://assets.tryhackme.com/img/favicon.png" alt="TryHackMe" className="h-4 w-4 mr-2" />
                TryHackMe
              </div>
            </TabsTrigger>
            <TabsTrigger value="hackthebox" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <div className="flex items-center">
                <img src="/hack-the-box.svg" alt="HTB" className="h-4 w-4 mr-2" />
                HackTheBox
                <Badge className="ml-2 bg-black/30 text-green-300 text-[10px] px-1.5 py-0 h-4">Coming Soon</Badge>
              </div>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tryhackme">
            {thm && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    {thm.avatar ? (
                      <img 
                        src={thm.avatar} 
                        alt={thm.username} 
                        className="h-12 w-12 rounded-full mr-3 border-2 border-red-600/30"
                        onError={(e) => {
                          console.error("Failed to load avatar, using fallback");
                          (e.target as HTMLImageElement).src = 'https://assets.tryhackme.com/img/favicon.png';
                        }}
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-slate-700 flex items-center justify-center mr-3 border-2 border-red-600/30">
                        <img src="https://assets.tryhackme.com/img/favicon.png" alt="TryHackMe" className="h-6 w-6" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-xl font-bold text-red-400">{thm.username}</h3>
                      <p className="text-slate-400">Level: {thm.rank}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-red-900 text-red-100">{thm.hexLevel || '0x0'}</Badge>
                    <Badge className="bg-slate-700 text-slate-100">Rank #{thm.ranking}</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Points</span>
                    <span className="text-white">
                      {thm.points.toLocaleString()} pts
                    </span>
                  </div>
                  <Progress value={thm.nextLevelPercentage || 0} className="h-2 bg-slate-700">
                    <div className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full" />
                  </Progress>
                  {thm.level && thm.level < 21 && (
                    <div className="text-xs text-slate-400 text-right">
                      {thm.nextLevelPercentage}% to {THM_LEVELS[thm.level]?.name || 'next level'}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4 pt-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <div className="bg-slate-800/50 rounded-lg p-3 text-center cursor-pointer hover:bg-slate-800 transition-colors">
                        <Trophy className="h-5 w-5 text-yellow-400 mx-auto mb-1" />
                        <p className="text-xs text-slate-400">Badges</p>
                        <p className="text-lg font-bold">{thm.badges}</p>
                      </div>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] bg-slate-900 border-slate-700 text-slate-100">
                      <DialogHeader>
                        <DialogTitle className="text-xl flex items-center">
                          <Trophy className="h-5 w-5 text-yellow-400 mr-2" />
                          TryHackMe Badges ({thmBadges.length})
                        </DialogTitle>
                      </DialogHeader>
                      {thmBadges.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 max-h-[400px] overflow-y-auto pr-2">
                          {thmBadges.map((badge) => (
                            <div key={badge._id} className="bg-slate-800/70 rounded-lg p-3 flex flex-col items-center justify-between hover:bg-slate-800 transition-colors">
                              <div className="h-14 w-14 rounded-full bg-slate-700 flex items-center justify-center mb-3">
                                {badge.image ? (
                                  <img 
                                    src={`https://assets.tryhackme.com/img/badges/${badge.image}`} 
                                    alt={badge.name} 
                                    className="h-12 w-12 rounded-full"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = 'https://assets.tryhackme.com/img/favicon.png';
                                    }}
                                  />
                                ) : (
                                  <Award className="h-8 w-8 text-yellow-400" />
                                )}
                              </div>
                              <p className="text-sm font-medium text-center text-slate-200">{formatBadgeName(badge.name)}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-40">
                          <Trophy className="h-12 w-12 text-slate-600 mb-4" />
                          <p className="text-slate-400">No badges earned yet</p>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                  <div 
                    className="bg-slate-800/50 rounded-lg p-3 text-center cursor-pointer hover:bg-slate-800 transition-colors group relative"
                    title="Completed TryHackMe rooms"
                  >
                    <Target className="h-5 w-5 text-red-400 mx-auto mb-1" />
                    <p className="text-xs text-slate-400">Rooms</p>
                    <p className="text-lg font-bold">{thm.completedChallenges}</p>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="bg-slate-900/90 backdrop-blur-sm p-2 rounded-md text-xs text-slate-200">
                        {thm.completedChallenges} completed rooms
                      </div>
                    </div>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <div className="bg-slate-800/50 rounded-lg p-3 text-center hover:bg-slate-800 transition-colors cursor-pointer">
                        <Ticket className="h-5 w-5 text-purple-400 mx-auto mb-1" />
                        <p className="text-xs text-slate-400">Tickets</p>
                        <p className="text-lg font-bold">{thmTickets.won.length}</p>
                      </div>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] bg-slate-900 border-slate-700 text-slate-100">
                      <DialogHeader>
                        <DialogTitle className="text-xl flex items-center">
                          <Ticket className="h-5 w-5 text-purple-400 mr-2" />
                          TryHackMe Tickets
                        </DialogTitle>
                      </DialogHeader>
                      
                      <div className="mt-4">
                        <h3 className="text-md font-semibold mb-2 flex items-center">
                          <Trophy className="h-4 w-4 text-yellow-400 mr-2" />
                          Tickets Won ({thmTickets.won.length})
                        </h3>
                        
                        {thmTickets.won.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
                            {thmTickets.won.map((ticket) => (
                              <div 
                                key={ticket.name} 
                                className={`${getTicketColor(ticket.colour)} rounded-md p-2 flex items-center`}
                              >
                                <Ticket className="h-4 w-4 mr-2 flex-shrink-0" />
                                <span className="text-sm font-medium">{ticket.title}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-slate-400 mb-6">No tickets won yet</p>
                        )}
                        
                        <h3 className="text-md font-semibold mb-2 flex items-center">
                          <Ticket className="h-4 w-4 text-slate-400 mr-2" />
                          Available Tickets ({thmTickets.available.length})
                        </h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-2">
                          {thmTickets.available.map((ticket) => (
                            <div 
                              key={ticket.name} 
                              className={`${getTicketColor(ticket.colour)} bg-opacity-30 rounded-md p-2 flex items-center`}
                            >
                              <Ticket className="h-4 w-4 mr-2 flex-shrink-0" />
                              <span className="text-sm font-medium">{ticket.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="hackthebox">
            {htb && (
              <div className="space-y-4 relative">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold text-green-400">{htb.username}</h3>
                    <p className="text-slate-400">Rank: {htb.rank}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-green-900 text-green-100">Pro Hacker</Badge>
                    <Badge className="bg-slate-700 text-slate-100">Rank #{htb.ranking}</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Points</span>
                    <span className="text-white">
                      {htb.points} / {htb.totalPoints}
                    </span>
                  </div>
                  <Progress value={(htb.points / htb.totalPoints) * 100} className="h-2 bg-slate-700">
                    <div className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full" />
                  </Progress>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                    <Award className="h-5 w-5 text-yellow-400 mx-auto mb-1" />
                    <p className="text-xs text-slate-400">Badges</p>
                    <p className="text-lg font-bold">{htb.badges}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                    <Shield className="h-5 w-5 text-blue-400 mx-auto mb-1" />
                    <p className="text-xs text-slate-400">Machines</p>
                    <p className="text-lg font-bold">{htb.completedChallenges}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                    <Skull className="h-5 w-5 text-purple-400 mx-auto mb-1" />
                    <p className="text-xs text-slate-400">Challenges</p>
                    <p className="text-lg font-bold">28</p>
                  </div>
                </div>

                {/* Coming Soon Overlay */}
                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                  <div className="text-4xl mb-2">🔒</div>
                  <h3 className="text-xl font-bold text-green-400 mb-2">Coming Soon</h3>
                  <p className="text-slate-400 text-center max-w-xs">
                    Hack The Box integration is currently in development and will be available soon.
                  </p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
} 