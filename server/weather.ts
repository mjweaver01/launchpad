export interface WeatherData {
  location: string;
  temperature: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  feelsLike: number;
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
      `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${location}?unitGroup=metric&include=current&key=${API_KEY}&contentType=json`
    );

    if (!response.ok) {
      throw new Error(`Weather API Error: ${response.status}`);
    }

    const data = await response.json();

    // Visual Crossing API response structure
    const currentConditions = data.currentConditions;

    return {
      location: data.resolvedAddress,
      temperature: Math.round(currentConditions.temp),
      description: currentConditions.conditions,
      icon: currentConditions.icon,
      humidity: currentConditions.humidity,
      windSpeed: currentConditions.windspeed,
      feelsLike: Math.round(currentConditions.feelslike),
    };
  } catch (error) {
    console.error('Weather API Error:', error);
    throw error;
  }
};
