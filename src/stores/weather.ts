import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { WeatherData, Coordinates, CacheEntry } from './types';
import { CACHE_DURATION } from './types';
import { CacheStorage } from './storage';

const WEATHER_CACHE_KEY = 'weather_data';
const COORDINATES_CACHE_KEY = 'coordinates_data';

export const useWeatherStore = defineStore('weather', () => {
  // State
  const weatherCache = ref<CacheEntry<WeatherData> | null>(null);
  const coordinatesCache = ref<CacheEntry<Coordinates> | null>(null);

  const loading = ref(false);
  const error = ref('');

  // Initialize from localStorage on store creation
  const initializeFromStorage = () => {
    const storedWeather = CacheStorage.get<WeatherData>(WEATHER_CACHE_KEY);
    const storedCoordinates = CacheStorage.get<Coordinates>(COORDINATES_CACHE_KEY);

    if (storedWeather) {
      weatherCache.value = storedWeather;
    }

    if (storedCoordinates) {
      coordinatesCache.value = storedCoordinates;
    }
  };

  // Computed
  const isWeatherCacheValid = computed(() => {
    if (!weatherCache.value) return false;
    return Date.now() < weatherCache.value.expiresAt;
  });

  const isCoordinatesCacheValid = computed(() => {
    if (!coordinatesCache.value) return false;
    return Date.now() < coordinatesCache.value.expiresAt;
  });

  // Actions
  const getCurrentLocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        resolve,
        error => {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              reject(new Error('Location access denied. Please enable location permissions.'));
              break;
            case error.POSITION_UNAVAILABLE:
              reject(new Error('Location information is unavailable.'));
              break;
            case error.TIMEOUT:
              reject(new Error('Location request timed out.'));
              break;
            default:
              reject(new Error('An unknown error occurred while retrieving location.'));
              break;
          }
        },
        {
          timeout: 10000,
          enableHighAccuracy: true,
        }
      );
    });
  };

  const fetchWeatherData = async (lat: number, lon: number): Promise<WeatherData> => {
    const response = await fetch(`/.netlify/functions/weather?lat=${lat}&lon=${lon}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  };

  const loadWeather = async (forceRefresh = false) => {
    // Initialize from storage if needed
    if (!weatherCache.value && !coordinatesCache.value) {
      initializeFromStorage();
    }

    // Return cached data if valid and not forced refresh
    if (!forceRefresh && isWeatherCacheValid.value && weatherCache.value) {
      return weatherCache.value.data;
    }

    // Check if coordinates are cached and valid
    let coordinates: Coordinates;
    if (!forceRefresh && isCoordinatesCacheValid.value && coordinatesCache.value) {
      coordinates = coordinatesCache.value.data;
    } else {
      loading.value = true;
      error.value = '';

      try {
        const position = await getCurrentLocation();
        coordinates = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        };

        // Cache coordinates in both memory and localStorage
        const coordinatesEntry: CacheEntry<Coordinates> = {
          data: coordinates,
          timestamp: Date.now(),
          expiresAt: Date.now() + CACHE_DURATION,
        };

        coordinatesCache.value = coordinatesEntry;
        CacheStorage.set(COORDINATES_CACHE_KEY, coordinatesEntry);
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Failed to get location';
        loading.value = false;
        throw err;
      }
    }

    try {
      const weatherData = await fetchWeatherData(coordinates.lat, coordinates.lon);

      // Cache weather data in both memory and localStorage
      const weatherEntry: CacheEntry<WeatherData> = {
        data: weatherData,
        timestamp: Date.now(),
        expiresAt: Date.now() + CACHE_DURATION,
      };

      weatherCache.value = weatherEntry;
      CacheStorage.set(WEATHER_CACHE_KEY, weatherEntry);

      error.value = '';
      return weatherData;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch weather data';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const refresh = () => {
    return loadWeather(true);
  };

  const clearCache = () => {
    weatherCache.value = null;
    coordinatesCache.value = null;
    CacheStorage.remove(WEATHER_CACHE_KEY);
    CacheStorage.remove(COORDINATES_CACHE_KEY);
  };

  return {
    // State
    loading,
    error,
    weatherCache,
    coordinatesCache,

    // Computed
    isWeatherCacheValid,
    isCoordinatesCacheValid,

    // Actions
    loadWeather,
    refresh,
    clearCache,
    initializeFromStorage,
  };
});
