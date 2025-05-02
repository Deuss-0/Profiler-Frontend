"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Shield, Terminal, Code } from "lucide-react"
import { ProfileButton } from "@/components/profile-button"
import { useAuth } from "@/contexts/auth-context"

export function HeroSection() {
  const [greeting, setGreeting] = useState("")
  const [displayUsername, setDisplayUsername] = useState("Hacker")
  const { user, isAuthenticated } = useAuth()
  
  useEffect(() => {
    // Set the greeting based on time of day
    const hour = new Date().getHours()
    if (hour < 12) setGreeting("Good morning")
    else if (hour < 18) setGreeting("Good afternoon")
    else setGreeting("Good evening")
    
    // Set username only on client side to avoid hydration mismatch
    if (isAuthenticated && user?.email) {
      setDisplayUsername(user.email.split('@')[0])
    }
  }, [isAuthenticated, user])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-950 to-slate-900 p-8 border border-cyan-800/30"
    >
      {/* Background grid effect */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10"></div>

      {/* Glowing orb effect */}
      <div className="absolute -top-20 -right-20 w-60 h-60 bg-cyan-500 rounded-full filter blur-[100px] opacity-20"></div>

      <div className="relative flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-cyan-400">
            {greeting}, <span className="text-white">{displayUsername}</span>
          </h1>
          <p className="text-slate-300 max-w-xl">
            Welcome to your cybersecurity dashboard. Stay secure, keep learning, and hack the planet!
          </p>
        </div>

        <div className="hidden md:flex items-center space-x-4">
          <div className="h-12 w-12 rounded-full bg-cyan-900/50 flex items-center justify-center text-cyan-400">
            <Shield className="h-6 w-6" />
          </div>
          <div className="h-12 w-12 rounded-full bg-cyan-900/50 flex items-center justify-center text-cyan-400">
            <Terminal className="h-6 w-6" />
          </div>
          <div className="h-12 w-12 rounded-full bg-cyan-900/50 flex items-center justify-center text-cyan-400">
            <Code className="h-6 w-6" />
          </div>
          <ProfileButton />
        </div>
      </div>
    </motion.div>
  )
}
