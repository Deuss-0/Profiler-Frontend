"use client"

import { Sparkles, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { ChallengeDetailsDialog } from "./challenge-details-dialog"

interface ChallengeBannerProps {
  onAcceptChallenge: () => void
}

export function _ChallengeBanner({ onAcceptChallenge }: ChallengeBannerProps) {
  const [showDetails, setShowDetails] = useState(false)

  const isGroupChallenge = true // This challenge is a group challenge

  return (
    <>
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-1">
        <div className="relative rounded-lg bg-slate-900/95 p-6">
          <div className="absolute top-0 left-0 h-full w-full bg-slate-900/50" />
          <div className="relative flex flex-col md:flex-row items-center gap-6">
            <div className="flex-shrink-0 p-4 rounded-full bg-indigo-500/20">
              <Sparkles className="h-8 w-8 text-indigo-400" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
                <h3 className="text-xl font-bold text-white">New Challenge: Clean Code Innovation!</h3>
                {isGroupChallenge && (
                  <span className="inline-flex items-center gap-1 bg-pink-500/20 text-pink-400 px-2 py-1 rounded-full text-sm">
                    <Users className="h-4 w-4" />
                    Group Challenge
                  </span>
                )}
              </div>
              <p className="text-slate-300 mb-4 md:mb-0">
                Team up with 2-4 randomly assigned members and showcase your programming skills to earn up to 5000 XP by
                implementing clean code best practices together.
              </p>
            </div>
            <div className="flex-shrink-0">
              <Button
                size="lg"
                className="bg-indigo-500 hover:bg-indigo-600 text-white border-0 shadow-lg shadow-indigo-500/25"
                onClick={() => setShowDetails(true)}
              >
                View Details
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ChallengeDetailsDialog open={showDetails} onOpenChange={setShowDetails} onAcceptChallenge={onAcceptChallenge} />
    </>
  )
}
