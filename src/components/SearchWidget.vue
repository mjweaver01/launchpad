<template>
  <div class="bg-white rounded-lg shadow-md p-6 w-full mx-auto">
    <!-- Search Header -->
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-semibold text-gray-800">AI Web Search</h2>
      <button
        v-if="searchStore.searchHistory.length > 0"
        @click="showHistory = !showHistory"
        class="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm flex items-center gap-1"
        :class="{ 'bg-gray-600 hover:bg-gray-600 text-white': showHistory }"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
            clip-rule="evenodd"
          />
        </svg>
        History
      </button>
    </div>

    <!-- Search Input -->
    <div class="relative mb-8">
      <div class="relative">
        <input
          v-model="searchQuery"
          @keyup.enter="handleSearch"
          type="text"
          placeholder="Search the web with AI..."
          class="w-full px-4 py-3 pr-12 text-lg border-2 border-gray-300 rounded-full focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
          :disabled="searchStore.loading"
        />
        <button
          @click="handleSearch"
          :disabled="searchStore.loading || !searchQuery.trim()"
          class="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg v-if="!searchStore.loading" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              clip-rule="evenodd"
            />
          </svg>
          <LoadingSpinner v-else w="5" h="5" />
        </button>
      </div>

      <!-- Recent Searches Dropdown -->
      <div
        v-if="showSuggestions && searchStore.recentSearches.length > 0"
        class="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-10"
      >
        <div class="p-2">
          <p class="text-xs text-gray-500 mb-2">Recent searches</p>
          <button
            v-for="result in searchStore.recentSearches"
            :key="result.id"
            @click="selectSuggestion(result.query)"
            class="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center gap-2"
          >
            <svg class="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clip-rule="evenodd"
              />
            </svg>
            {{ result.query }}
          </button>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="searchStore.error" class="text-center py-4 mb-6">
      <div class="text-red-500 mb-2">
        <svg class="w-8 h-8 mx-auto" fill="currentColor" viewBox="0 0 20 20">
          <path
            fill-rule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clip-rule="evenodd"
          />
        </svg>
      </div>
      <p class="text-red-600 text-sm">{{ searchStore.error }}</p>
      <button
        @click="handleSearch"
        class="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
      >
        Try Again
      </button>
    </div>

    <!-- Loading State -->
    <div v-else-if="searchStore.loading" class="text-center py-8">
      <LoadingSpinner class="mx-auto mb-4" />
      <p class="text-gray-600">Searching the web with AI...</p>
      <p class="text-sm text-gray-500 mt-1">This may take a few moments</p>
    </div>

    <!-- Search Results -->
    <div v-else-if="currentResult && !showHistory" class="space-y-6 max-h-[400px] overflow-y-auto">
      <!-- AI Answer -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
          </div>
          <div class="flex-1">
            <h3 class="font-semibold text-gray-900 mb-2">AI Answer</h3>
            <div
              class="markdown-content max-w-none text-gray-700"
              v-html="formatAnswer(currentResult.answer)"
            ></div>
          </div>
        </div>
      </div>

      <!-- Search Info -->
      <div class="text-xs text-gray-500 pt-4 border-t border-gray-200">
        Search performed {{ formatDate(currentResult.timestamp) }}
      </div>
    </div>

    <!-- Search History -->
    <div
      v-if="showHistory && searchStore.searchHistory.length > 0"
      class="mt-8 pt-6 border-t border-gray-200"
    >
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900">Search History</h3>
        <button
          @click="searchStore.clearHistory"
          class="text-sm text-red-600 hover:text-red-700 transition-colors"
        >
          Clear History
        </button>
      </div>
      <div class="space-y-3">
        <div
          v-for="result in searchStore.searchHistory.slice(0, 10)"
          :key="result.id"
          class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
        >
          <button
            @click="selectFromHistory(result)"
            class="flex-1 text-left text-sm text-gray-700 hover:text-blue-600 transition-colors"
          >
            {{ result.query }}
          </button>
          <div class="flex items-center gap-2">
            <span class="text-xs text-gray-500">{{ formatDate(result.timestamp) }}</span>
            <button
              @click="searchStore.removeFromHistory(result.id)"
              class="p-1 text-gray-400 hover:text-red-500 transition-colors"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="!searchStore.loading && !currentResult && !searchStore.error"
      class="text-center py-12"
    >
      <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
          <path
            fill-rule="evenodd"
            d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
            clip-rule="evenodd"
          />
        </svg>
      </div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">Search the web with AI</h3>
      <p class="text-gray-600 max-w-md mx-auto">
        Get intelligent answers and sources from across the web. Ask questions, research topics, or
        find current information.
      </p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed, watch } from 'vue';
import { marked } from 'marked';
import { useSearchStore } from '../stores/search';
import type { SearchResult } from '../stores/types';
import LoadingSpinner from './LoadingSpinner.vue';

export default defineComponent({
  name: 'SearchWidget',
  components: {
    LoadingSpinner,
  },
  setup() {
    const searchStore = useSearchStore();
    const searchQuery = ref('');
    const showHistory = ref(false);
    const showSuggestions = ref(false);
    const currentResult = ref<SearchResult | null>(null);

    // Initialize store from localStorage
    onMounted(() => {
      searchStore.initializeFromStorage();
    });

    // Watch for focus on search input to show suggestions
    const handleInputFocus = () => {
      showSuggestions.value = true;
    };

    const handleInputBlur = () => {
      // Delay hiding suggestions to allow clicks
      setTimeout(() => {
        showSuggestions.value = false;
      }, 200);
    };

    const handleSearch = async () => {
      if (!searchQuery.value.trim()) return;

      try {
        const result = await searchStore.search(searchQuery.value);
        if (result) {
          currentResult.value = result;
          showHistory.value = false;
        }
      } catch (error) {
        console.error('Search failed:', error);
      }
    };

    const selectSuggestion = (query: string) => {
      searchQuery.value = query;
      showSuggestions.value = false;
      handleSearch();
    };

    const selectFromHistory = (result: SearchResult) => {
      searchQuery.value = result.query;
      currentResult.value = result;
      showHistory.value = false;
    };

    const formatAnswer = (answer: string) => {
      // Use marked to parse markdown
      return marked.parse(answer);
    };

    const formatDate = (timestamp: number) => {
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 1) return 'just now';
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      if (days < 7) return `${days}d ago`;
      return date.toLocaleDateString();
    };

    return {
      searchStore,
      searchQuery,
      showHistory,
      showSuggestions,
      currentResult,
      handleSearch,
      selectSuggestion,
      selectFromHistory,
      formatAnswer,
      formatDate,
      handleInputFocus,
      handleInputBlur,
    };
  },
});
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.prose {
  max-width: none;
}

.prose p {
  margin-bottom: 0.75rem;
}

.prose p:last-child {
  margin-bottom: 0;
}
</style>
