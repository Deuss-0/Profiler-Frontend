import { Code2, ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function _CodingPlatformsWidget() {
  const platforms = [
    {
      name: "LeetCode",
      url: "https://leetcode.com",
      description: "Popular platform for technical interview preparation with algorithmic challenges."
    },
    {
      name: "CodeWars",
      url: "https://www.codewars.com",
      description: "Improve your skills by training with others on real code challenges."
    },
    {
      name: "HackerRank",
      url: "https://www.hackerrank.com",
      description: "Practice coding, prepare for interviews, and get hired."
    }
  ]

  return (
    <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-purple-900/50 flex items-center justify-center text-purple-400">
            <Code2 className="h-4 w-4" />
          </div>
          <span>Coding Platforms</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {platforms.map((platform) => (
            <div key={platform.name} className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-white">{platform.name}</h3>
                <p className="text-sm text-slate-400">{platform.description}</p>
              </div>
              <Button 
                size="sm" 
                className="bg-purple-900/30 text-purple-400 hover:bg-purple-900/50 hover:text-purple-300"
                onClick={() => window.open(platform.url, "_blank")}
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                <span>Visit</span>
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 