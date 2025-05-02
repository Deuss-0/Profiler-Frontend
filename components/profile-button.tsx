"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"
import { User, LogOut, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProfileButtonProps {
  className?: string
}

export function ProfileButton({ className }: ProfileButtonProps) {
  const { user, isAuthenticated, logout } = useAuth()
  const [mounted, setMounted] = useState(false)
  
  // Only enable client-side rendering after hydration
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Initial render - always show the same structure for both server and client
  // to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="h-12 w-12 rounded-full bg-cyan-900/50 flex items-center justify-center">
        <Button variant="ghost" className="h-12 w-12 rounded-full p-0 bg-transparent hover:bg-cyan-800/50">
          <div className="h-9 w-9 rounded-full bg-cyan-800 flex items-center justify-center text-cyan-100">
            <User className="h-5 w-5" />
          </div>
        </Button>
      </div>
    )
  }

  // Client-side conditional rendering based on authentication state
  if (!isAuthenticated) {
    return (
      <div className={cn("h-12 w-auto rounded-full bg-cyan-900/50 flex items-center justify-center px-4", className)}>
        <Button variant="ghost" className="text-cyan-400 hover:text-white hover:bg-transparent p-0" asChild>
          <Link href="/auth/login" className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            <span className="font-medium">Sign In</span>
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className={cn("h-12 w-12 rounded-full bg-cyan-900/50 flex items-center justify-center", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-12 w-12 rounded-full p-0 bg-transparent hover:bg-cyan-800/50">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user?.avatar_url} alt={user?.full_name} />
              <AvatarFallback className="bg-cyan-800 text-cyan-100">{user?.initials || user?.full_name?.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
          <DropdownMenuLabel className="text-white">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user?.full_name}</p>
              <p className="text-xs leading-none text-slate-400">{user?.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-slate-700" />
          <DropdownMenuItem className="cursor-pointer hover:bg-slate-700 focus:bg-slate-700">
            <Link href="/profile" className="flex items-center w-full">
              <Settings className="h-4 w-4 mr-2" />
              Profile Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => logout()} className="text-red-400 focus:text-red-400 focus:bg-red-900/20 cursor-pointer">
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
} 