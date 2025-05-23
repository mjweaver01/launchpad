<template>
  <div class="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-semibold text-gray-800">Latest News</h2>
      <div class="flex gap-2">
        <select
          v-model="selectedCategory"
          @change="resetAndLoadNews"
          class="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All</option>
          <option value="business">Business</option>
          <option value="entertainment">Entertainment</option>
          <option value="general">General</option>
          <option value="health">Health</option>
          <option value="science">Science</option>
          <option value="sports">Sports</option>
          <option value="technology">Technology</option>
        </select>
        <button
          @click="loadNews"
          class="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm"
          :disabled="loading"
        >
          <span v-if="!loading">Refresh</span>
          <span v-else>Loading...</span>
        </button>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="text-center py-8">
      <LoadingSpinner />
      <p class="text-gray-600 mt-2">Loading latest news...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="text-center py-8">
      <div class="text-red-500 mb-2">
        <svg class="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
          <path
            fill-rule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clip-rule="evenodd"
          />
        </svg>
      </div>
      <p class="text-red-600 text-sm">{{ error }}</p>
      <button
        @click="loadNews"
        class="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm"
      >
        Try Again
      </button>
    </div>

    <!-- News articles -->
    <div v-else-if="newsData" class="space-y-6">
      <!-- Featured article -->
      <div v-if="newsData.articles.length > 0" class="border-b border-gray-200 pb-6">
        <article class="group">
          <div class="grid md:grid-cols-3 gap-6">
            <div class="md:col-span-2">
              <h3
                class="text-xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors"
              >
                <a :href="newsData.articles[0].url" target="_blank" rel="noopener noreferrer">
                  {{ newsData.articles[0].title }}
                </a>
              </h3>
              <p class="text-gray-700 mb-3 leading-relaxed">
                {{ newsData.articles[0].description }}
              </p>
              <div class="flex items-center text-sm text-gray-500">
                <span class="font-medium">{{ newsData.articles[0].source.name }}</span>
                <span class="mx-2">•</span>
                <span>{{ formatDate(newsData.articles[0].publishedAt) }}</span>
                <span v-if="newsData.articles[0].author" class="mx-2">•</span>
                <span v-if="newsData.articles[0].author">{{ newsData.articles[0].author }}</span>
              </div>
            </div>
            <div class="md:col-span-1">
              <img
                v-if="newsData.articles[0].urlToImage"
                :src="newsData.articles[0].urlToImage"
                :alt="newsData.articles[0].title"
                class="w-full h-48 object-cover rounded-lg"
                @error="handleImageError"
              />
              <div
                v-else
                class="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center"
              >
                <svg class="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>
        </article>
      </div>

      <!-- Grid of other articles -->
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <article
          v-for="(article, index) in newsData.articles.slice(1)"
          :key="index"
          class="group bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <img
            v-if="article.urlToImage"
            :src="article.urlToImage"
            :alt="article.title"
            class="w-full h-32 object-cover rounded-md mb-3"
            @error="handleImageError"
          />
          <div
            v-else
            class="w-full h-32 bg-gray-200 rounded-md mb-3 flex items-center justify-center"
          >
            <svg class="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                clip-rule="evenodd"
              />
            </svg>
          </div>

          <h4
            class="font-semibold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-3"
          >
            <a :href="article.url" target="_blank" rel="noopener noreferrer">
              {{ article.title }}
            </a>
          </h4>

          <p class="text-sm text-gray-600 mb-3 line-clamp-2">
            {{ article.description }}
          </p>

          <div class="text-xs text-gray-500">
            <span class="font-medium">{{ article.source.name }}</span>
            <span class="mx-1">•</span>
            <span>{{ formatDate(article.publishedAt) }}</span>
          </div>
        </article>
      </div>

      <!-- Results summary and pagination -->
      <div class="flex flex-col sm:flex-row items-center justify-between pt-6 gap-4">
        <p class="text-gray-600 text-sm">
          Showing {{ (currentPage - 1) * pageSize + 1 }}-{{
            Math.min(currentPage * pageSize, newsData.totalResults)
          }}
          of {{ newsData.totalResults }} articles
        </p>

        <!-- Pagination controls -->
        <div class="flex items-center gap-2">
          <button
            @click="goToPage(currentPage - 1)"
            :disabled="currentPage <= 1"
            class="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <div class="flex items-center gap-1">
            <button
              v-for="page in visiblePages"
              :key="page"
              @click="goToPage(page)"
              :class="[
                'px-3 py-1 rounded-md text-sm transition-colors',
                page === currentPage
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300',
              ]"
            >
              {{ page }}
            </button>
          </div>

          <button
            @click="goToPage(currentPage + 1)"
            :disabled="currentPage >= totalPages"
            class="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, Ref } from 'vue';
import LoadingSpinner from './LoadingSpinner.vue';

interface NewsArticle {
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

interface NewsResponse {
  articles: NewsArticle[];
  totalResults: number;
}

export default defineComponent({
  name: 'NewsWidget',
  components: {
    LoadingSpinner,
  },
  setup() {
    const newsData: Ref<NewsResponse | null> = ref(null);
    const loading = ref(false);
    const error = ref('');
    const selectedCategory = ref('');
    const currentPage = ref(1);
    const pageSize = ref(10);
    const totalPages = ref(1);
    const visiblePages = ref([]);

    const formatDate = (dateString: string): string => {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      const diffMinutes = Math.floor(diffTime / (1000 * 60));

      if (diffMinutes < 60) {
        return `${diffMinutes}m ago`;
      } else if (diffHours < 24) {
        return `${diffHours}h ago`;
      } else if (diffDays < 7) {
        return `${diffDays}d ago`;
      } else {
        return date.toLocaleDateString();
      }
    };

    const handleImageError = (event: Event) => {
      const img = event.target as HTMLImageElement;
      img.style.display = 'none';
    };

    const fetchNews = async () => {
      try {
        let url = `/.netlify/functions/news?country=us&page=${currentPage.value}&pageSize=${pageSize.value}`;
        if (selectedCategory.value) {
          url += `&category=${selectedCategory.value}`;
        }

        const response = await fetch(url);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        newsData.value = data;
        totalPages.value = Math.ceil(data.totalResults / pageSize.value);

        // Calculate visible pages (show max 5 pages around current page)
        const maxVisiblePages = 5;
        const halfRange = Math.floor(maxVisiblePages / 2);
        let startPage = Math.max(1, currentPage.value - halfRange);
        let endPage = Math.min(totalPages.value, startPage + maxVisiblePages - 1);

        // Adjust start if we're near the end
        if (endPage - startPage < maxVisiblePages - 1) {
          startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        visiblePages.value = Array.from(
          { length: endPage - startPage + 1 },
          (_, i) => startPage + i
        );
      } catch (err) {
        throw new Error(err instanceof Error ? err.message : 'Failed to fetch news data');
      }
    };

    const loadNews = async () => {
      loading.value = true;
      error.value = '';
      newsData.value = null;

      try {
        await fetchNews();
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'An unexpected error occurred';
      } finally {
        loading.value = false;
      }
    };

    const resetAndLoadNews = () => {
      currentPage.value = 1;
      loadNews();
    };

    const goToPage = (page: number) => {
      currentPage.value = page;
      loadNews();
    };

    onMounted(() => {
      loadNews();
    });

    return {
      newsData,
      loading,
      error,
      selectedCategory,
      loadNews,
      formatDate,
      handleImageError,
      currentPage,
      pageSize,
      totalPages,
      visiblePages,
      goToPage,
      resetAndLoadNews,
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
</style>
