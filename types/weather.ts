export type WeatherCondition = 
  | "Clear" 
  | "Cloudy" 
  | "Rainy" 
  | "Snowy" 
  | "Stormy" 
  | "Foggy" 
  | "Windy";

export interface WeatherData {
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  condition: WeatherCondition;
  description: string;
  location: string;
  country: string;
  sunrise: number;
  sunset: number;
  timezone: number;
  coordinates: {
    lat: number;
    lon: number;
  };
} 