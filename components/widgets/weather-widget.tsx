import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, Wind, CloudFog, Droplets, Thermometer, ExternalLink } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useState, useEffect } from "react"
import { getWeatherByCoordinates, getCurrentPosition, getLocationByIP } from "@/lib/weather-service"
import { WeatherData, WeatherCondition } from "@/types/weather"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [isMockData, setIsMockData] = useState(false)

  // Prevent hydration issues
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const fetchWeather = async () => {
      try {
        setLoading(true)
        setError(null)
        setIsMockData(false)

        // First try browser geolocation
        try {
          const position = await getCurrentPosition()
          const data = await getWeatherByCoordinates(position.lat, position.lon)
          setWeather(data)
          
          // Check if this is mock data by verifying location
          if (data.location === "Cybercity" && data.country === "Digital Realm") {
            setIsMockData(true)
          }
        } catch (geoError) {
          // Fall back to IP-based geolocation
          try {
            const ipLocation = await getLocationByIP()
            const data = await getWeatherByCoordinates(ipLocation.lat, ipLocation.lon)
            setWeather(data)
            
            // Check if this is mock data
            if (data.location === "Cybercity" && data.country === "Digital Realm") {
              setIsMockData(true)
            }
          } catch (ipError) {
            throw new Error("Could not determine your location")
          }
        }
      } catch (error) {
        console.error("Failed to fetch weather:", error)
        setError(error instanceof Error ? error.message : "Failed to load weather data")
      } finally {
        setLoading(false)
      }
    }

    fetchWeather()
  }, [mounted])

  const getIcon = (condition: WeatherCondition) => {
    switch (condition) {
      case "Clear":
        return <Sun className="h-6 w-6 text-yellow-400" />
      case "Cloudy":
        return <Cloud className="h-6 w-6 text-slate-400" />
      case "Rainy":
        return <CloudRain className="h-6 w-6 text-blue-400" />
      case "Snowy":
        return <CloudSnow className="h-6 w-6 text-white" />
      case "Stormy":
        return <CloudLightning className="h-6 w-6 text-yellow-400" />
      case "Foggy":
        return <CloudFog className="h-6 w-6 text-slate-300" />
      case "Windy":
        return <Wind className="h-6 w-6 text-slate-400" />
      default:
        return <Sun className="h-6 w-6 text-yellow-400" />
    }
  }

  // Generate URL for external weather site
  const getWeatherUrl = (weather: WeatherData) => {
    if (isMockData) {
      return "https://openweathermap.org";
    }
    return `https://openweathermap.org/city/${weather.coordinates.lat},${weather.coordinates.lon}`;
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  }

  const iconVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: { 
        duration: 0.5,
        type: "spring",
        stiffness: 200
      }
    }
  }

  // SSR - return empty div to prevent hydration issues
  if (!mounted) {
    return <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-sm h-[140px]" />
  }

  if (loading) {
    return (
      <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-sm">
        <CardContent className="p-6 flex items-center justify-center h-[72px]">
          <motion.p 
            className="text-slate-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.3 } }}
          >
            Loading weather data...
          </motion.p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-sm">
        <CardContent className="p-6 flex items-center justify-center h-[72px]">
          <motion.p 
            className="text-slate-400 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.3 } }}
          >
            {error}
          </motion.p>
        </CardContent>
      </Card>
    )
  }

  if (!weather) {
    return (
      <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-sm">
        <CardContent className="p-6 flex items-center justify-center h-[72px]">
          <motion.p 
            className="text-slate-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.3 } }}
          >
            Weather data unavailable
          </motion.p>
        </CardContent>
      </Card>
    )
  }

  const locationDisplay = weather.country 
    ? `${weather.location}, ${weather.country}` 
    : weather.location;

  return (
    <AnimatePresence>
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
      >
        <a 
          href={getWeatherUrl(weather)} 
          target="_blank" 
          rel="noopener noreferrer"
          className="block transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
        >
          <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-sm hover:bg-slate-900/80 transition-colors relative">
            <CardContent className="p-6">
              <div className="absolute top-2 right-2">
                <ExternalLink className="h-4 w-4 text-slate-500" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <motion.div 
                    className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center",
                      weather.condition === "Clear" && "bg-yellow-900/30",
                      weather.condition === "Cloudy" && "bg-slate-800/50",
                      weather.condition === "Rainy" && "bg-blue-900/30",
                      weather.condition === "Snowy" && "bg-slate-700/30",
                      weather.condition === "Stormy" && "bg-purple-900/30",
                      weather.condition === "Foggy" && "bg-slate-700/40",
                      weather.condition === "Windy" && "bg-cyan-900/30"
                    )}
                    variants={iconVariants}
                    initial="initial"
                    animate="animate"
                  >
                    {getIcon(weather.condition)}
                  </motion.div>
                  <div>
                    <motion.p 
                      className="text-sm text-slate-400"
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0, transition: { delay: 0.2, duration: 0.3 } }}
                    >
                      {locationDisplay}
                      {isMockData && " (Demo)"}
                    </motion.p>
                    <motion.p 
                      className="text-2xl font-bold text-white"
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0, transition: { delay: 0.3, duration: 0.3 } }}
                    >
                      {weather.temp}°C
                    </motion.p>
                  </div>
                </div>
                <div className="text-right">
                  <motion.p 
                    className="text-sm text-slate-400"
                    initial={{ opacity: 0, x: 5 }}
                    animate={{ opacity: 1, x: 0, transition: { delay: 0.2, duration: 0.3 } }}
                  >
                    {weather.description}
                  </motion.p>
                  <motion.p 
                    className="text-lg font-medium text-white"
                    initial={{ opacity: 0, x: 5 }}
                    animate={{ opacity: 1, x: 0, transition: { delay: 0.3, duration: 0.3 } }}
                  >
                    {weather.condition}
                  </motion.p>
                </div>
              </div>
              
              <motion.div 
                className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-3 gap-2 text-xs"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.4, duration: 0.3 } }}
              >
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex items-center justify-center space-x-1">
                        <Thermometer className="h-3 w-3 text-red-400" />
                        <span className="text-slate-300">Feels: {weather.feelsLike}°C</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Feels like temperature</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex items-center justify-center space-x-1">
                        <Droplets className="h-3 w-3 text-blue-400" />
                        <span className="text-slate-300">{weather.humidity}%</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Humidity</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex items-center justify-center space-x-1">
                        <Wind className="h-3 w-3 text-cyan-400" />
                        <span className="text-slate-300">{weather.windSpeed} km/h</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Wind speed</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </motion.div>
              
              {isMockData && (
                <motion.div 
                  className="mt-2 pt-2 border-t border-slate-800"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { delay: 0.5, duration: 0.3 } }}
                >
                  <p className="text-xs text-amber-400 text-center">
                    Using demo data - Add OpenWeather API key in .env.local
                  </p>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </a>
      </motion.div>
    </AnimatePresence>
  )
} 