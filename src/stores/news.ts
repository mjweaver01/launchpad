import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { NewsArticle, NewsResponse, CacheEntry } from './types';
import { CACHE_DURATION } from './types';
import { CacheStorage } from './storage';

export const useNewsStore = defineStore('news', () => {
  // State
  const newsCache = ref<Map<string, CacheEntry<NewsResponse>>>(new Map());
  const loading = ref(false);
  const error = ref('');
  const refreshTrigger = ref(0);

  // Pagination state
  const currentPage = ref(1);
  const pageSize = ref(8);
  const totalPages = ref(1);
  const selectedCategory = ref('');
  const currentNewsData = ref<NewsResponse | null>(null);

  // Computed for visible pagination pages
  const visiblePages = computed(() => {
    const maxVisiblePages = 5;
    const halfRange = Math.floor(maxVisiblePages / 2);
    let startPage = Math.max(1, currentPage.value - halfRange);
    let endPage = Math.min(totalPages.value, startPage + maxVisiblePages - 1);

    // Adjust start if we're near the end
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  });

  // Initialize from localStorage on store creation
  const initializeFromStorage = () => {
    // Load all news cache entries from localStorage
    const cacheInfo = CacheStorage.getCacheInfo();

    cacheInfo.keys.forEach(key => {
      if (key.startsWith('news_')) {
        const stored = CacheStorage.get<NewsResponse>(key);
        if (stored) {
          const cacheKey = key.replace('news_', '');
          newsCache.value.set(cacheKey, stored);
        }
      }
    });
  };

  // Cache utilities
  const getNewsCacheKey = (category: string, page: number, pageSize: number) => {
    return `${category || 'all'}-${page}-${pageSize}`;
  };

  const getStorageKey = (cacheKey: string) => {
    return `news_${cacheKey}`;
  };

  const isNewsCacheValid = (cacheKey: string) => {
    const cached = newsCache.value.get(cacheKey);
    if (!cached) return false;
    return Date.now() < cached.expiresAt;
  };

  // Pagination utilities
  const calculatePagination = (data: NewsResponse) => {
    totalPages.value = Math.ceil(data.totalResults / pageSize.value);
  };

  const resetPagination = () => {
    currentPage.value = 1;
    selectedCategory.value = '';
    currentNewsData.value = null;
  };

  // Actions
  const fetchNewsData = async (
    category: string,
    page: number,
    pageSize: number
  ): Promise<NewsResponse> => {
    let url = `/.netlify/functions/news?country=us&page=${page}&pageSize=${pageSize}`;
    if (category) {
      url += `&category=${category}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  };

  const loadNews = async (category = '', page = 1, pageSize = 10, forceRefresh = false) => {
    const cacheKey = getNewsCacheKey(category, page, pageSize);

    // Initialize from storage if cache is empty
    if (newsCache.value.size === 0) {
      initializeFromStorage();
    }

    // Return cached data if valid and not forced refresh
    if (!forceRefresh && isNewsCacheValid(cacheKey)) {
      const cachedData = newsCache.value.get(cacheKey)!.data;
      currentNewsData.value = cachedData;
      calculatePagination(cachedData);
      return cachedData;
    }

    loading.value = true;
    error.value = '';

    try {
      const newsData = await fetchNewsData(category, page, pageSize);

      // Cache news data in both memory and localStorage
      const newsEntry: CacheEntry<NewsResponse> = {
        data: newsData,
        timestamp: Date.now(),
        expiresAt: Date.now() + CACHE_DURATION,
      };

      newsCache.value.set(cacheKey, newsEntry);
      CacheStorage.set(getStorageKey(cacheKey), newsEntry);

      // Update current data and pagination
      currentNewsData.value = newsData;
      calculatePagination(newsData);

      error.value = '';
      return newsData;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch news data';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const loadCurrentPage = async (forceRefresh = false) => {
    // Reset to page 1 when force refreshing
    if (forceRefresh) {
      currentPage.value = 1;
    }
    return loadNews(selectedCategory.value, currentPage.value, pageSize.value, forceRefresh);
  };

  const goToPage = async (page: number) => {
    currentPage.value = page;
    return loadCurrentPage();
  };

  const changeCategory = async (category: string) => {
    selectedCategory.value = category;
    currentPage.value = 1; // Reset to first page when changing category
    return loadCurrentPage();
  };

  const refresh = (category = '', page = 1, pageSize = 10) => {
    // Increment refresh trigger and reset pagination
    refreshTrigger.value++;
    resetPagination();
    return loadNews(category, page, pageSize, true);
  };

  const clearCache = () => {
    // Clear memory cache
    const keysToRemove = Array.from(newsCache.value.keys());
    newsCache.value.clear();

    // Clear localStorage cache
    keysToRemove.forEach(cacheKey => {
      CacheStorage.remove(getStorageKey(cacheKey));
    });

    // Reset current data
    currentNewsData.value = null;
  };

  const clearExpiredCache = () => {
    const now = Date.now();
    const keysToRemove: string[] = [];

    // Check memory cache for expired entries
    newsCache.value.forEach((entry, key) => {
      if (now >= entry.expiresAt) {
        keysToRemove.push(key);
      }
    });

    // Remove expired entries from both memory and localStorage
    keysToRemove.forEach(cacheKey => {
      newsCache.value.delete(cacheKey);
      CacheStorage.remove(getStorageKey(cacheKey));
    });
  };

  return {
    // State
    loading,
    error,
    refreshTrigger,

    // Pagination state
    currentPage,
    pageSize,
    totalPages,
    selectedCategory,
    currentNewsData,
    visiblePages,

    // Actions
    loadNews,
    loadCurrentPage,
    goToPage,
    changeCategory,
    refresh,
    clearCache,
    clearExpiredCache,
    initializeFromStorage,
    resetPagination,

    // Cache utilities
    getNewsCacheKey,
    isNewsCacheValid,
  };
});
