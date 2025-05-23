// Common types used across stores

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

// Weather types
export interface WeatherData {
  location: string;
  temperature: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  feelsLike: number;
}

export interface Coordinates {
  lat: number;
  lon: number;
}

// News types
export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  source: {
    name: string;
  };
  author: string;
}

export interface NewsResponse {
  articles: NewsArticle[];
  totalResults: number;
}

// Todo types
export interface TodoItem {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface TodoData {
  items: TodoItem[];
}

// Search types
export interface SearchResult {
  id: string;
  query: string;
  answer: string;
  sources: SearchSource[];
  timestamp: number;
}

export interface SearchSource {
  title: string;
  url: string;
  snippet: string;
}

export interface SearchHistory {
  results: SearchResult[];
}

// Calendar types
export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  location?: string;
  htmlLink: string;
  created: string;
  updated: string;
  creator?: {
    email: string;
    displayName?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus: string;
  }>;
  colorId?: string;
  status: string;
}

export interface CalendarData {
  events: CalendarEvent[];
  nextSyncToken?: string;
}

export interface GoogleAuthState {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  userInfo: {
    email: string;
    name: string;
    picture?: string;
  } | null;
}

// Cache duration in milliseconds (1 hour)
export const CACHE_DURATION = 60 * 60 * 1000;
// Todo cache duration - 1 year
export const TODO_CACHE_DURATION = 365 * 24 * 60 * 60 * 1000;
// Search cache duration - shorter since search results can become outdated quickly (30 minutes)
export const SEARCH_CACHE_DURATION = 30 * 60 * 1000;
// Calendar cache duration - shorter since events can change frequently (15 minutes)
export const CALENDAR_CACHE_DURATION = 15 * 60 * 1000;
