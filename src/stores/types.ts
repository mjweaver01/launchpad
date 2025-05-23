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

// Cache duration in milliseconds (1 hour)
export const CACHE_DURATION = 60 * 60 * 1000;
