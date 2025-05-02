import { BookOpen, ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function _LearningResourcesWidget() {
  const resources = [
    {
      name: "Udemy",
      url: "https://www.udemy.com",
      description: "Online learning platform with courses on programming, web development, and more."
    },
    {
      name: "Coursera",
      url: "https://www.coursera.org",
      description: "Access courses from top universities and organizations worldwide."
    },
    {
      name: "freeCodeCamp",
      url: "https://www.freecodecamp.org",
      description: "Free coding curriculum and certifications for web development."
    }
  ]

  return (
    <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-blue-900/50 flex items-center justify-center text-blue-400">
            <BookOpen className="h-4 w-4" />
          </div>
          <span>Learning Resources</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {resources.map((resource) => (
            <div key={resource.name} className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-white">{resource.name}</h3>
                <p className="text-sm text-slate-400">{resource.description}</p>
              </div>
              <Button 
                size="sm" 
                className="bg-blue-900/30 text-blue-400 hover:bg-blue-900/50 hover:text-blue-300"
                onClick={() => window.open(resource.url, "_blank")}
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                <span>Learn</span>
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 