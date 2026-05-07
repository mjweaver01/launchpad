<script setup lang="ts">
import { onMounted } from 'vue';
import { Newspaper, RefreshCw, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-vue-next';
import { useNewsStore } from '../../stores';
import WidgetCard from './WidgetCard.vue';
import IconButton from '../ui/IconButton.vue';
import UiSelect from '../ui/UiSelect.vue';
import UiButton from '../ui/UiButton.vue';
import EmptyState from '../ui/EmptyState.vue';
import ErrorState from '../ui/ErrorState.vue';
import Skeleton from '../ui/Skeleton.vue';

const newsStore = useNewsStore();

const categoryOptions = [
  { label: 'All categories', value: '' },
  { label: 'Business', value: 'business' },
  { label: 'Entertainment', value: 'entertainment' },
  { label: 'General', value: 'general' },
  { label: 'Health', value: 'health' },
  { label: 'Science', value: 'science' },
  { label: 'Sports', value: 'sports' },
  { label: 'Technology', value: 'technology' },
];

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.style.display = 'none';
};

const handleCategoryChange = (value: string | number) => {
  newsStore.changeCategory(value as string);
};

const handleRefresh = () => newsStore.loadCurrentPage(true);

onMounted(() => {
  if (!newsStore.currentNewsData) newsStore.loadCurrentPage();
});
</script>

<template>
  <WidgetCard title="News" :icon="Newspaper" widgetName="news" displayName="News">
    <template #actions>
      <UiSelect
        v-model="newsStore.selectedCategory"
        :options="categoryOptions"
        class="!w-[140px] !py-1.5 !text-xs"
        aria-label="News category"
        @change="handleCategoryChange"
      />
      <IconButton
        :icon="RefreshCw"
        :spin="newsStore.loading"
        :disabled="newsStore.loading"
        label="Refresh news"
        @click="handleRefresh"
      />
    </template>

    <div v-if="newsStore.loading && !newsStore.currentNewsData" class="space-y-4">
      <div class="grid md:grid-cols-3 gap-4">
        <div class="md:col-span-2 space-y-2">
          <Skeleton height="1.5rem" />
          <Skeleton height="1rem" />
          <Skeleton height="1rem" width="80%" />
        </div>
        <Skeleton height="8rem" />
      </div>
      <div class="grid md:grid-cols-2 gap-4">
        <div v-for="n in 4" :key="n" class="space-y-2">
          <Skeleton height="6rem" />
          <Skeleton height="1rem" />
          <Skeleton height="0.75rem" width="60%" />
        </div>
      </div>
    </div>

    <ErrorState
      v-else-if="newsStore.error"
      :message="newsStore.error"
      @retry="handleRefresh"
    />

    <div v-else-if="newsStore.currentNewsData">
      <article
        v-if="newsStore.currentNewsData.articles.length > 0"
        class="group pb-5 mb-5 border-b border-[color:var(--color-border)]"
      >
        <div class="grid md:grid-cols-3 gap-5">
          <div class="md:col-span-2">
            <h3
              class="text-lg font-semibold text-[color:var(--color-fg)] mb-2 group-hover:text-[color:var(--color-brand-600)] dark:group-hover:text-[color:var(--color-brand-400)] transition-colors leading-snug"
            >
              <a
                :href="newsStore.currentNewsData.articles[0].url"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{ newsStore.currentNewsData.articles[0].title }}
              </a>
            </h3>
            <p class="text-sm text-[color:var(--color-fg-muted)] mb-3 leading-relaxed line-clamp-3">
              {{ newsStore.currentNewsData.articles[0].description }}
            </p>
            <div class="flex items-center gap-2 text-xs text-[color:var(--color-fg-subtle)]">
              <span class="font-medium text-[color:var(--color-fg-muted)]">
                {{ newsStore.currentNewsData.articles[0].source.name }}
              </span>
              <span>·</span>
              <span>{{ formatDate(newsStore.currentNewsData.articles[0].publishedAt) }}</span>
            </div>
          </div>
          <div class="md:col-span-1">
            <img
              v-if="newsStore.currentNewsData.articles[0].urlToImage"
              :src="newsStore.currentNewsData.articles[0].urlToImage"
              :alt="newsStore.currentNewsData.articles[0].title"
              class="w-full h-40 object-cover rounded-lg border border-[color:var(--color-border)]"
              @error="handleImageError"
            />
            <div
              v-else
              class="w-full h-40 bg-[color:var(--color-surface-2)] rounded-lg flex items-center justify-center text-[color:var(--color-fg-subtle)]"
            >
              <ImageIcon class="h-8 w-8" />
            </div>
          </div>
        </div>
      </article>

      <div class="grid md:grid-cols-2 gap-4">
        <article
          v-for="(article, index) in newsStore.currentNewsData.articles.slice(1)"
          :key="index"
          class="group rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-3 hover:bg-[color:var(--color-surface-3)] transition-colors"
        >
          <img
            v-if="article.urlToImage"
            :src="article.urlToImage"
            :alt="article.title"
            class="w-full h-28 object-cover rounded-lg mb-3"
            @error="handleImageError"
          />
          <div
            v-else
            class="w-full h-28 bg-[color:var(--color-surface-3)] rounded-lg mb-3 flex items-center justify-center text-[color:var(--color-fg-subtle)]"
          >
            <ImageIcon class="h-6 w-6" />
          </div>
          <h4
            class="text-sm font-semibold text-[color:var(--color-fg)] mb-2 group-hover:text-[color:var(--color-brand-600)] transition-colors line-clamp-3 leading-snug"
          >
            <a :href="article.url" target="_blank" rel="noopener noreferrer">
              {{ article.title }}
            </a>
          </h4>
          <p class="text-xs text-[color:var(--color-fg-muted)] mb-2 line-clamp-2 leading-relaxed">
            {{ article.description }}
          </p>
          <div class="flex items-center gap-2 text-[0.7rem] text-[color:var(--color-fg-subtle)]">
            <span class="font-medium text-[color:var(--color-fg-muted)]">{{ article.source.name }}</span>
            <span>·</span>
            <span>{{ formatDate(article.publishedAt) }}</span>
          </div>
        </article>
      </div>

      <EmptyState
        v-if="newsStore.currentNewsData.articles.length === 0"
        :icon="Newspaper"
        title="No articles found"
        description="Try selecting a different category or check back later."
      />

      <div
        v-else
        class="flex flex-col sm:flex-row items-center justify-between gap-3 mt-5 pt-4 border-t border-[color:var(--color-border)]"
      >
        <p class="text-xs text-[color:var(--color-fg-muted)]">
          {{ (newsStore.currentPage - 1) * newsStore.pageSize + 1 }}–{{
            (newsStore.currentPage - 1) * newsStore.pageSize +
            newsStore.currentNewsData.articles.length
          }}
          of {{ newsStore.currentNewsData.totalResults }}
        </p>
        <div class="flex items-center gap-1">
          <IconButton
            :icon="ChevronLeft"
            :disabled="newsStore.currentPage <= 1"
            label="Previous page"
            @click="newsStore.goToPage(newsStore.currentPage - 1)"
          />
          <button
            v-for="page in newsStore.visiblePages"
            :key="page"
            class="min-w-8 h-8 px-2 rounded-md text-xs font-medium transition-colors"
            :class="
              page === newsStore.currentPage
                ? 'bg-[color:var(--color-brand-600)] text-white'
                : 'text-[color:var(--color-fg-muted)] hover:bg-[color:var(--color-surface-2)] hover:text-[color:var(--color-fg)]'
            "
            @click="newsStore.goToPage(page)"
          >
            {{ page }}
          </button>
          <IconButton
            :icon="ChevronRight"
            :disabled="newsStore.currentPage >= newsStore.totalPages"
            label="Next page"
            @click="newsStore.goToPage(newsStore.currentPage + 1)"
          />
        </div>
      </div>
    </div>
  </WidgetCard>
</template>
