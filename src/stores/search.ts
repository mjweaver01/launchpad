import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { SearchResult, SearchHistory, CacheEntry } from './types';
import { SEARCH_CACHE_DURATION } from './types';
import { CacheStorage } from './storage';

export const useSearchStore = defineStore('search', () => {
  // State
  const searchHistory = ref<SearchResult[]>([]);
  const loading = ref(false);
  const error = ref('');
  const currentQuery = ref('');

  // Initialize from localStorage on store creation
  const initializeFromStorage = () => {
    const stored = CacheStorage.get<SearchHistory>('search_history');
    if (stored) {
      searchHistory.value = stored.data.results || [];
    }
  };

  // Computed
  const recentSearches = computed(() => {
    return searchHistory.value.slice(0, 5).sort((a, b) => b.timestamp - a.timestamp);
  });

  // Actions
  const search = async (query: string): Promise<SearchResult | null> => {
    if (!query.trim()) {
      error.value = 'Search query cannot be empty';
      return null;
    }

    // Check if we already have this search result in recent history
    const existingResult = searchHistory.value.find(
      result => result.query.toLowerCase() === query.toLowerCase()
    );

    if (existingResult) {
      // If found within cache duration, return it
      if (Date.now() - existingResult.timestamp < SEARCH_CACHE_DURATION) {
        currentQuery.value = query;
        return existingResult;
      }
    }

    loading.value = true;
    error.value = '';
    currentQuery.value = query;

    try {
      const response = await fetch('/.netlify/functions/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const searchResult: SearchResult = {
        id: `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        query,
        answer: data.answer,
        sources: data.sources || [],
        timestamp: Date.now(),
      };

      // Add to history (remove existing entry if it exists)
      const filteredHistory = searchHistory.value.filter(
        result => result.query.toLowerCase() !== query.toLowerCase()
      );
      searchHistory.value = [searchResult, ...filteredHistory];

      // Keep only last 50 searches
      if (searchHistory.value.length > 50) {
        searchHistory.value = searchHistory.value.slice(0, 50);
      }

      // Save to localStorage
      const historyEntry: CacheEntry<SearchHistory> = {
        data: { results: searchHistory.value },
        timestamp: Date.now(),
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days for history
      };
      CacheStorage.set('search_history', historyEntry);

      error.value = '';
      return searchResult;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to perform search';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const clearHistory = () => {
    searchHistory.value = [];
    CacheStorage.remove('search_history');
  };

  const removeFromHistory = (id: string) => {
    searchHistory.value = searchHistory.value.filter(result => result.id !== id);

    // Update localStorage
    const historyEntry: CacheEntry<SearchHistory> = {
      data: { results: searchHistory.value },
      timestamp: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    };
    CacheStorage.set('search_history', historyEntry);
  };

  const clearCurrentQuery = () => {
    currentQuery.value = '';
    error.value = '';
  };

  return {
    // State
    searchHistory,
    loading,
    error,
    currentQuery,

    // Computed
    recentSearches,

    // Actions
    search,
    clearHistory,
    removeFromHistory,
    clearCurrentQuery,
    initializeFromStorage,
  };
});
