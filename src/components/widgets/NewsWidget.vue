<template>
  <div
    class="flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 w-full mx-auto transition-colors duration-200"
  >
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-semibold text-gray-800 dark:text-gray-200">Latest News</h2>
      <div class="flex gap-2">
        <select
          v-model="newsStore.selectedCategory"
          @change="handleCategoryChange"
          class="px-3 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          @click="handleRefresh"
          class="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center justify-center"
          :disabled="newsStore.loading"
        >
          <svg
            class="w-4 h-4"
            :class="{ 'animate-spin': newsStore.loading }"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
        <ExpandWidget widgetName="news" displayName="News" />
      </div>
    </div>

    <div class="h-full overflow-y-auto">
      <!-- Loading state -->
      <div v-if="newsStore.loading" class="text-center py-8">
        <LoadingSpinner />
        <p class="text-gray-600 dark:text-gray-400 mt-2">Loading latest news...</p>
      </div>

      <!-- Error state -->
      <div v-else-if="newsStore.error" class="text-center py-8">
        <div class="text-red-500 dark:text-red-400 mb-2">
          <svg class="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
        <p class="text-red-600 dark:text-red-400 text-sm">{{ newsStore.error }}</p>
        <button
          @click="handleRefresh"
          class="mt-3 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-sm"
        >
          Try Again
        </button>
      </div>

      <!-- News articles -->
      <div v-else-if="newsStore.currentNewsData" class="space-y-6">
        <!-- Featured article -->
        <div
          v-if="newsStore.currentNewsData.articles.length > 0"
          class="border-b border-gray-200 dark:border-gray-700 pb-6"
        >
          <article class="group">
            <div class="grid md:grid-cols-3 gap-6">
              <div class="md:col-span-2">
                <h3
                  class="text-xl font-bold text-gray-900 dark:text-gray-200 mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                >
                  <a
                    :href="newsStore.currentNewsData.articles[0].url"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {{ newsStore.currentNewsData.articles[0].title }}
                  </a>
                </h3>
                <p class="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
                  {{ newsStore.currentNewsData.articles[0].description }}
                </p>
                <div class="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <span class="font-medium">{{
                    newsStore.currentNewsData.articles[0].source.name
                  }}</span>
                  <span class="mx-2">•</span>
                  <span>{{ formatDate(newsStore.currentNewsData.articles[0].publishedAt) }}</span>
                  <span v-if="newsStore.currentNewsData.articles[0].author" class="mx-2">•</span>
                  <span v-if="newsStore.currentNewsData.articles[0].author">{{
                    newsStore.currentNewsData.articles[0].author
                  }}</span>
                </div>
              </div>
              <div class="md:col-span-1">
                <img
                  v-if="newsStore.currentNewsData.articles[0].urlToImage"
                  :src="newsStore.currentNewsData.articles[0].urlToImage"
                  :alt="newsStore.currentNewsData.articles[0].title"
                  class="w-full h-48 object-cover rounded-lg"
                  @error="handleImageError"
                />
                <div
                  v-else
                  class="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center"
                >
                  <svg
                    class="w-12 h-12 text-gray-400 dark:text-gray-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
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
        <div class="grid md:grid-cols-2 gap-6">
          <article
            v-for="(article, index) in newsStore.currentNewsData.articles.slice(1)"
            :key="index"
            class="group bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
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
              class="w-full h-32 bg-gray-200 dark:bg-gray-600 rounded-md mb-3 flex items-center justify-center"
            >
              <svg
                class="w-8 h-8 text-gray-400 dark:text-gray-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>

            <h4
              class="font-semibold text-gray-900 dark:text-gray-200 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-3"
            >
              <a :href="article.url" target="_blank" rel="noopener noreferrer">
                {{ article.title }}
              </a>
            </h4>

            <p class="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
              {{ article.description }}
            </p>

            <div class="text-xs text-gray-500 dark:text-gray-400">
              <span class="font-medium">{{ article.source.name }}</span>
              <span class="mx-1">•</span>
              <span>{{ formatDate(article.publishedAt) }}</span>
            </div>
          </article>
        </div>

        <!-- Results summary and pagination -->
        <div class="flex flex-col sm:flex-row items-center justify-between pt-6 gap-4">
          <p class="text-gray-600 dark:text-gray-400 text-sm">
            Showing {{ (newsStore.currentPage - 1) * newsStore.pageSize + 1 }}-{{
              Math.min(
                newsStore.currentPage * newsStore.pageSize,
                newsStore.currentNewsData.totalResults
              )
            }}
            of {{ newsStore.currentNewsData.totalResults }} articles
          </p>

          <!-- Pagination controls -->
          <div class="flex items-center gap-2">
            <button
              @click="newsStore.goToPage(newsStore.currentPage - 1)"
              :disabled="newsStore.currentPage <= 1"
              class="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <div class="flex items-center gap-1">
              <button
                v-for="page in newsStore.visiblePages"
                :key="page"
                @click="newsStore.goToPage(page)"
                :class="[
                  'px-3 py-1 rounded-md text-sm transition-colors',
                  page === newsStore.currentPage
                    ? 'bg-blue-600 dark:bg-blue-700 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600',
                ]"
              >
                {{ page }}
              </button>
            </div>

            <button
              @click="newsStore.goToPage(newsStore.currentPage + 1)"
              :disabled="newsStore.currentPage >= newsStore.totalPages"
              class="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>

        <!-- No articles message -->
        <div v-if="newsStore.currentNewsData.articles.length === 0" class="text-center py-12">
          <div class="text-gray-400 dark:text-gray-500 mb-4">
            <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
              />
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
            No articles found
          </h3>
          <p class="text-gray-500 dark:text-gray-500">
            Try selecting a different category or check back later for new articles.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import LoadingSpinner from '../LoadingSpinner.vue';
import { useNewsStore } from '../../stores';
import ExpandWidget from './ExpandWidget.vue';

export default defineComponent({
  name: 'NewsWidget',
  components: {
    LoadingSpinner,
    ExpandWidget,
  },
  setup() {
    const route = useRoute();
    const newsStore = useNewsStore();

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

    const handleCategoryChange = () => {
      newsStore.changeCategory(newsStore.selectedCategory);
    };

    const handleRefresh = () => {
      newsStore.loadCurrentPage(true);
    };

    onMounted(() => {
      // Load initial news if not already loaded
      if (!newsStore.currentNewsData) {
        newsStore.loadCurrentPage();
      }
    });

    return {
      route,
      newsStore,
      formatDate,
      handleImageError,
      handleCategoryChange,
      handleRefresh,
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
