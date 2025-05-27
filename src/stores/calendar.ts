import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { CalendarData, CalendarEvent, GoogleAuthState, CacheEntry } from './types';
import { CALENDAR_CACHE_DURATION } from './types';
import { CacheStorage } from './storage';

const CALENDAR_CACHE_KEY = 'calendar_data';
const GOOGLE_AUTH_CACHE_KEY = 'google_auth_state';

export const useCalendarStore = defineStore('calendar', () => {
  // State
  const calendarCache = ref<CacheEntry<CalendarData> | null>(null);
  const authState = ref<GoogleAuthState>({
    accessToken: null,
    refreshToken: null,
    expiresAt: null,
    userInfo: null,
  });

  const loading = ref(false);
  const error = ref('');
  const authLoading = ref(false);

  // Initialize from localStorage on store creation
  const initializeFromStorage = () => {
    const storedCalendar = CacheStorage.get<CalendarData>(CALENDAR_CACHE_KEY);
    const storedAuthEntry = CacheStorage.get<GoogleAuthState>(GOOGLE_AUTH_CACHE_KEY);

    if (storedCalendar) {
      calendarCache.value = storedCalendar;
    }

    if (storedAuthEntry) {
      authState.value = storedAuthEntry.data;
    }
  };

  // Computed
  const isCalendarCacheValid = computed(() => {
    if (!calendarCache.value) return false;
    return Date.now() < calendarCache.value.expiresAt;
  });

  const isAuthenticated = computed(() => {
    return !!(
      authState.value.accessToken &&
      authState.value.expiresAt &&
      Date.now() < authState.value.expiresAt
    );
  });

  const upcomingEvents = computed(() => {
    if (!calendarCache.value?.data.events) return [];

    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return calendarCache.value.data.events
      .filter(event => {
        const eventDate = new Date(event.start.dateTime || event.start.date || '');
        return eventDate >= now && eventDate <= nextWeek;
      })
      .sort((a, b) => {
        const dateA = new Date(a.start.dateTime || a.start.date || '');
        const dateB = new Date(b.start.dateTime || b.start.date || '');
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, 5); // Show next 5 events
  });

  const todaysEvents = computed(() => {
    if (!calendarCache.value?.data.events) return [];

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    return calendarCache.value.data.events
      .filter(event => {
        const eventDate = new Date(event.start.dateTime || event.start.date || '');
        return eventDate >= startOfDay && eventDate < endOfDay;
      })
      .sort((a, b) => {
        const dateA = new Date(a.start.dateTime || a.start.date || '');
        const dateB = new Date(b.start.dateTime || b.start.date || '');
        return dateA.getTime() - dateB.getTime();
      });
  });

  const tomorrowsEvents = computed(() => {
    if (!calendarCache.value?.data.events) return [];

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const startOfDay = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
    const endOfDay = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate() + 1);

    return calendarCache.value.data.events
      .filter(event => {
        const eventDate = new Date(event.start.dateTime || event.start.date || '');
        return eventDate >= startOfDay && eventDate < endOfDay;
      })
      .sort((a, b) => {
        const dateA = new Date(a.start.dateTime || a.start.date || '');
        const dateB = new Date(b.start.dateTime || b.start.date || '');
        return dateA.getTime() - dateB.getTime();
      });
  });

  // Actions
  const initiateGoogleAuth = (): string => {
    console.log('initiateGoogleAuth called');
    const clientId = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID;
    console.log('Client ID from env:', clientId);

    if (!clientId) {
      const errorMsg = 'Google Client ID not configured';
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    const redirectUri = `${window.location.origin}/auth/google/callback`;
    console.log('Redirect URI:', redirectUri);

    const scope =
      'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scope);
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');

    console.log('Auth URL constructed:', authUrl.toString());
    return authUrl.toString();
  };

  const handleAuthCallback = async (code: string) => {
    authLoading.value = true;
    error.value = '';

    try {
      const response = await fetch('/.netlify/functions/google-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Authentication failed');
      }

      const authData = await response.json();

      authState.value = {
        accessToken: authData.access_token,
        refreshToken: authData.refresh_token,
        expiresAt: Date.now() + authData.expires_in * 1000,
        userInfo: authData.userInfo,
      };

      // Save auth state to localStorage
      const authEntry: CacheEntry<GoogleAuthState> = {
        data: authState.value,
        timestamp: Date.now(),
        expiresAt: Date.now() + authData.expires_in * 1000,
      };
      CacheStorage.set(GOOGLE_AUTH_CACHE_KEY, authEntry);

      return authData;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Authentication failed';
      throw err;
    } finally {
      authLoading.value = false;
    }
  };

  const refreshAccessToken = async () => {
    if (!authState.value.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch('/.netlify/functions/google-refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: authState.value.refreshToken,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const tokenData = await response.json();

      authState.value.accessToken = tokenData.access_token;
      authState.value.expiresAt = Date.now() + tokenData.expires_in * 1000;

      // Update localStorage
      const updatedAuthEntry: CacheEntry<GoogleAuthState> = {
        data: authState.value,
        timestamp: Date.now(),
        expiresAt: Date.now() + tokenData.expires_in * 1000,
      };
      CacheStorage.set(GOOGLE_AUTH_CACHE_KEY, updatedAuthEntry);

      return tokenData;
    } catch (err) {
      // If refresh fails, clear auth state
      logout();
      throw err;
    }
  };

  const fetchCalendarEvents = async (): Promise<CalendarData> => {
    if (!isAuthenticated.value) {
      // Try to refresh token if we have one
      if (authState.value.refreshToken) {
        await refreshAccessToken();
      } else {
        throw new Error('Not authenticated');
      }
    }

    const response = await fetch('/.netlify/functions/calendar-events', {
      headers: {
        Authorization: `Bearer ${authState.value.accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  };

  const loadCalendar = async (forceRefresh = false) => {
    // Initialize from storage if needed
    if (!calendarCache.value && !authState.value.accessToken) {
      initializeFromStorage();
    }

    // Return cached data if valid and not forced refresh
    if (!forceRefresh && isCalendarCacheValid.value && calendarCache.value) {
      return calendarCache.value.data;
    }

    loading.value = true;
    error.value = '';

    try {
      const calendarData = await fetchCalendarEvents();

      // Cache calendar data in both memory and localStorage
      const calendarEntry: CacheEntry<CalendarData> = {
        data: calendarData,
        timestamp: Date.now(),
        expiresAt: Date.now() + CALENDAR_CACHE_DURATION,
      };

      calendarCache.value = calendarEntry;
      CacheStorage.set(CALENDAR_CACHE_KEY, calendarEntry);

      error.value = '';
      return calendarData;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch calendar data';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const signInWithGoogle = () => {
    try {
      console.log('signInWithGoogle called');
      const authUrl = initiateGoogleAuth();
      console.log('About to redirect to:', authUrl);
      window.location.href = authUrl;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to initiate authentication';
      console.error('Error in signInWithGoogle:', errorMsg);
      error.value = errorMsg;
    }
  };

  const logout = () => {
    authState.value = {
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      userInfo: null,
    };
    calendarCache.value = null;

    CacheStorage.remove(GOOGLE_AUTH_CACHE_KEY);
    CacheStorage.remove(CALENDAR_CACHE_KEY);
  };

  const refresh = () => {
    return loadCalendar(true);
  };

  const clearCache = () => {
    calendarCache.value = null;
    CacheStorage.remove(CALENDAR_CACHE_KEY);
  };

  return {
    // State
    loading,
    error,
    authLoading,
    authState,

    // Computed
    isCalendarCacheValid,
    isAuthenticated,
    upcomingEvents,
    todaysEvents,
    tomorrowsEvents,

    // Actions
    loadCalendar,
    signInWithGoogle,
    handleAuthCallback,
    logout,
    refresh,
    clearCache,
    initializeFromStorage,
  };
});
