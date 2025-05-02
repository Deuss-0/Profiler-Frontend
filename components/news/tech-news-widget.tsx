import { Newspaper, _ExternalLink, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export function _TechNewsWidget() {
  const [loading, setLoading] = useState(false)
  
  // In a real application, this would fetch from a news API
  const newsItems = [
    {
      title: "The Future of Quantum Computing",
      source: "TechCrunch",
      url: "https://techcrunch.com",
      date: "3 hours ago"
    },
    {
      title: "AI Breakthroughs in Natural Language Processing",
      source: "Wired",
      url: "https://wired.com",
      date: "5 hours ago"
    },
    {
      title: "New Programming Language Trends for 2024",
      source: "The Verge",
      url: "https://theverge.com",
      date: "8 hours ago"
    }
  ]

  const refreshNews = () => {
    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      setLoading(false)
    }, 1000)
  }

  return (
    <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-amber-900/50 flex items-center justify-center text-amber-400">
            <Newspaper className="h-4 w-4" />
          </div>
          <span>Tech News</span>
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={refreshNews}
          disabled={loading}
          className="h-8 w-8 p-0 text-slate-400 hover:text-white"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="sr-only">Refresh</span>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {newsItems.map((item) => (
            <div key={item.title} className="border-b border-slate-800 pb-3 last:border-0 last:pb-0">
              <a 
                href={item.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block hover:bg-slate-800/30 p-2 -mx-2 rounded transition-colors"
              >
                <h3 className="font-medium text-white hover:text-amber-400 transition-colors">{item.title}</h3>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-slate-400">{item.source}</span>
                  <span className="text-xs text-slate-500">{item.date}</span>
                </div>
              </a>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 