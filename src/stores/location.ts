import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { LocationData, Coordinates, CacheEntry } from './types';
import { CACHE_DURATION } from './types';
import { CacheStorage } from './storage';

const LOCATION_CACHE_KEY = 'location_data';

export const useLocationStore = defineStore('location', () => {
  // State
  const locationCache = ref<CacheEntry<LocationData> | null>(null);
  const loading = ref(false);
  const error = ref('');

  // Initialize from localStorage on store creation
  const initializeFromStorage = () => {
    const storedLocation = CacheStorage.get<LocationData>(LOCATION_CACHE_KEY);
    if (storedLocation) {
      locationCache.value = storedLocation;
    }
  };

  // Computed
  const isLocationCacheValid = computed(() => {
    if (!locationCache.value) return false;
    return Date.now() < locationCache.value.expiresAt;
  });

  const currentLocation = computed(() => {
    return locationCache.value?.data || null;
  });

  const formattedLocation = computed(() => {
    if (!currentLocation.value) return '';

    const { city, state, country } = currentLocation.value;

    // For US addresses, show "City, State"
    // For international addresses, show "City, Country"
    if (country === 'United States' && state) {
      return `${city}, ${state}`;
    } else {
      return `${city}, ${country}`;
    }
  });

  // Actions
  const fetchLocationData = async (lat: number, lon: number): Promise<LocationData> => {
    const response = await fetch(`/.netlify/functions/geocoding?lat=${lat}&lon=${lon}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  };

  const loadLocation = async (
    coordinates: Coordinates,
    forceRefresh = false
  ): Promise<LocationData> => {
    // Initialize from storage if needed
    if (!locationCache.value) {
      initializeFromStorage();
    }

    // Check if we have cached location data for these coordinates
    const isSameCoordinates =
      locationCache.value?.data?.coordinates &&
      Math.abs(locationCache.value.data.coordinates.lat - coordinates.lat) < 0.01 &&
      Math.abs(locationCache.value.data.coordinates.lon - coordinates.lon) < 0.01;

    // Return cached data if valid, same coordinates, and not forced refresh
    if (!forceRefresh && isLocationCacheValid.value && locationCache.value && isSameCoordinates) {
      return locationCache.value.data;
    }

    loading.value = true;
    error.value = '';

    try {
      const locationData = await fetchLocationData(coordinates.lat, coordinates.lon);

      // Cache location data in both memory and localStorage
      const locationEntry: CacheEntry<LocationData> = {
        data: locationData,
        timestamp: Date.now(),
        expiresAt: Date.now() + CACHE_DURATION,
      };

      locationCache.value = locationEntry;
      CacheStorage.set(LOCATION_CACHE_KEY, locationEntry);

      error.value = '';
      return locationData;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch location data';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const clearCache = () => {
    locationCache.value = null;
    CacheStorage.remove(LOCATION_CACHE_KEY);
  };

  return {
    // State
    loading,
    error,

    // Computed
    isLocationCacheValid,
    currentLocation,
    formattedLocation,

    // Actions
    loadLocation,
    clearCache,
    initializeFromStorage,
  };
});
