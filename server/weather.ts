export interface HourlyForecast {
  time: string; // ISO datetime string
  temperature: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  precipitationProbability: number; // percentage
}

export interface WeatherData {
  location: string;
  temperature: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  feelsLike: number;
  hourlyForecast?: HourlyForecast[]; // next 24 hours
}

export const getWeather = async (lat: number, lon: number): Promise<WeatherData> => {
  const API_KEY = process.env.VISUAL_CROSSING_API_KEY;

  if (!API_KEY) {
    throw new Error('Visual Crossing API key not found');
  }

  try {
    // Visual Crossing API uses lat,lon format
    const location = `${lat},${lon}`;
    const response = await fetch(
      `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${location}?unitGroup=metric&include=current,hours&key=${API_KEY}&contentType=json`
    );

    if (!response.ok) {
      throw new Error(`Weather API Error: ${response.status}`);
    }

    const data = await response.json();

    // Visual Crossing API response structure
    const currentConditions = data.currentConditions;

    // Process hourly forecast for next 24 hours
    const hourlyForecast: HourlyForecast[] = [];
    if (data.days && data.days.length > 0) {
      // Get today's remaining hours and tomorrow's hours if needed
      const today = data.days[0];
      const tomorrow = data.days[1];

      const now = new Date();
      const currentHour = now.getHours();

      // Add remaining hours from today
      if (today.hours) {
        for (let i = currentHour; i < Math.min(today.hours.length, currentHour + 24); i++) {
          const hour = today.hours[i];
          const hourTime = new Date(now);
          hourTime.setHours(i, 0, 0, 0);

          hourlyForecast.push({
            time: hourTime.toISOString(),
            temperature: Math.round(hour.temp),
            description: hour.conditions,
            icon: hour.icon,
            humidity: hour.humidity,
            windSpeed: hour.windspeed,
            precipitationProbability: hour.precipprob || 0,
          });
        }
      }

      // Add hours from tomorrow if we need more to reach 24 hours
      if (hourlyForecast.length < 24 && tomorrow && tomorrow.hours) {
        const hoursNeeded = 24 - hourlyForecast.length;
        for (let i = 0; i < Math.min(hoursNeeded, tomorrow.hours.length); i++) {
          const hour = tomorrow.hours[i];
          const hourTime = new Date(now);
          hourTime.setDate(hourTime.getDate() + 1);
          hourTime.setHours(i, 0, 0, 0);

          hourlyForecast.push({
            time: hourTime.toISOString(),
            temperature: Math.round(hour.temp),
            description: hour.conditions,
            icon: hour.icon,
            humidity: hour.humidity,
            windSpeed: hour.windspeed,
            precipitationProbability: hour.precipprob || 0,
          });
        }
      }
    }

    return {
      location: data.resolvedAddress,
      temperature: Math.round(currentConditions.temp),
      description: currentConditions.conditions,
      icon: currentConditions.icon,
      humidity: currentConditions.humidity,
      windSpeed: currentConditions.windspeed,
      feelsLike: Math.round(currentConditions.feelslike),
      hourlyForecast: hourlyForecast.slice(0, 24), // Ensure we only return 24 hours
    };
  } catch (error) {
    console.error('Weather API Error:', error);
    throw error;
  }
};
