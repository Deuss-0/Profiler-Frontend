import { WeatherData, WeatherCondition } from "@/types/weather";

const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || ""; // Add your API key to .env.local
const BASE_URL = "https://api.openweathermap.org/data/2.5";

// Check if API key is available
const isApiKeyAvailable = !!API_KEY;

export async function getWeatherByCoordinates(lat: number, lon: number): Promise<WeatherData> {
  // If no API key, provide mock data
  if (!isApiKeyAvailable) {
    return getMockWeatherData();
  }

  try {
    const response = await fetch(
      `${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return formatWeatherData(data);
  } catch (error) {
    console.error("Failed to fetch weather data:", error);
    throw error;
  }
}

export async function getWeatherByCity(city: string): Promise<WeatherData> {
  // If no API key, provide mock data
  if (!isApiKeyAvailable) {
    return getMockWeatherData();
  }

  try {
    const response = await fetch(
      `${BASE_URL}/weather?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return formatWeatherData(data);
  } catch (error) {
    console.error("Failed to fetch weather data:", error);
    throw error;
  }
}

function formatWeatherData(data: any): WeatherData {
  // Map OpenWeather conditions to our condition types
  const mapCondition = (weatherId: number): WeatherCondition => {
    // Thunderstorm
    if (weatherId >= 200 && weatherId < 300) return "Stormy";
    // Drizzle and Rain
    if (weatherId >= 300 && weatherId < 600) return "Rainy";
    // Snow
    if (weatherId >= 600 && weatherId < 700) return "Snowy";
    // Atmosphere (fog, mist, etc)
    if (weatherId >= 700 && weatherId < 800) return "Foggy";
    // Clear
    if (weatherId === 800) return "Clear";
    // Clouds
    if (weatherId > 800) return "Cloudy";
    
    return "Clear"; // Default
  };
  
  return {
    temp: Math.round(data.main.temp),
    feelsLike: Math.round(data.main.feels_like),
    humidity: data.main.humidity,
    windSpeed: Math.round(data.wind.speed),
    condition: mapCondition(data.weather[0].id),
    description: data.weather[0].description,
    location: data.name,
    country: data.sys.country,
    sunrise: data.sys.sunrise * 1000, // Convert to milliseconds
    sunset: data.sys.sunset * 1000, // Convert to milliseconds
    timezone: data.timezone,
    coordinates: {
      lat: data.coord.lat,
      lon: data.coord.lon
    }
  };
}

// Generate mock weather data when API key is not available
function getMockWeatherData(): WeatherData {
  const conditions: WeatherCondition[] = ["Clear", "Cloudy", "Rainy", "Snowy", "Stormy", "Foggy", "Windy"];
  const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
  const randomTemp = Math.floor(Math.random() * 30) + 5; // 5-35°C
  
  const descriptions = {
    Clear: "clear sky",
    Cloudy: "scattered clouds",
    Rainy: "light rain",
    Snowy: "light snow",
    Stormy: "thunderstorm",
    Foggy: "mist",
    Windy: "strong wind"
  };

  return {
    temp: randomTemp,
    feelsLike: randomTemp - Math.floor(Math.random() * 5),
    humidity: Math.floor(Math.random() * 50) + 30, // 30-80%
    windSpeed: Math.floor(Math.random() * 20) + 5, // 5-25 km/h
    condition: randomCondition,
    description: descriptions[randomCondition],
    location: "Cybercity",
    country: "Digital Realm",
    sunrise: Date.now() - 3600000, // 1 hour ago
    sunset: Date.now() + 10800000, // 3 hours from now
    timezone: 0,
    coordinates: {
      lat: 0,
      lon: 0
    }
  };
}

// Use browser geolocation to get current position
export async function getCurrentPosition(): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser"));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        });
      },
      (error) => {
        reject(error);
      },
      { timeout: 10000 } // 10 second timeout
    );
  });
}

// Fallback to IP-based location if geolocation fails
export async function getLocationByIP(): Promise<{ lat: number; lon: number; city: string }> {
  try {
    const response = await fetch("https://ipapi.co/json/");
    const data = await response.json();
    
    return {
      lat: data.latitude,
      lon: data.longitude,
      city: data.city
    };
  } catch (error) {
    console.error("Failed to get location by IP:", error);
    throw error;
  }
} 