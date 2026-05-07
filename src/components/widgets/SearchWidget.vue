<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { marked } from 'marked';
import { Sparkles, Search, History, Trash2, X, RotateCcw } from 'lucide-vue-next';
import { useSearchStore } from '../../stores/search';
import type { SearchResult } from '../../stores/types';
import WidgetCard from './WidgetCard.vue';
import IconButton from '../ui/IconButton.vue';
import UiButton from '../ui/UiButton.vue';
import EmptyState from '../ui/EmptyState.vue';
import ErrorState from '../ui/ErrorState.vue';
import Spinner from '../ui/Spinner.vue';

const searchStore = useSearchStore();
const searchQuery = ref('');
const showHistory = ref(false);
const showSuggestions = ref(false);
const currentResult = ref<SearchResult | null>(null);

onMounted(() => searchStore.initializeFromStorage());

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

const formatAnswer = (answer: string) => marked.parse(answer);

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

const resetChat = () => {
  currentResult.value = null;
};

const handleBlur = () => setTimeout(() => (showSuggestions.value = false), 200);
</script>

<template>
  <WidgetCard title="AI Search" :icon="Sparkles" widgetName="search" displayName="Search">
    <template #actions>
      <IconButton
        v-if="searchStore.searchHistory.length > 0"
        :icon="History"
        :label="showHistory ? 'Hide history' : 'Show history'"
        @click="showHistory = !showHistory"
      />
    </template>

    <div class="relative mb-5">
      <Search
        class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[color:var(--color-fg-subtle)] pointer-events-none"
      />
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Ask anything…"
        class="ui-input !pl-10 !pr-12 !py-2.5"
        :disabled="searchStore.loading"
        @keyup.enter="handleSearch"
        @focus="showSuggestions = true"
        @blur="handleBlur"
      />
      <button
        class="absolute right-1.5 top-1/2 -translate-y-1/2 ui-icon-btn"
        :disabled="searchStore.loading || !searchQuery.trim()"
        aria-label="Search"
        @click="handleSearch"
      >
        <Search />
      </button>

      <Transition name="ui-popover">
        <div
          v-if="showSuggestions && searchStore.recentSearches.length > 0"
          class="absolute top-full left-0 right-0 mt-1.5 z-10 ui-card !p-1.5 !shadow-[var(--shadow-popover)]"
        >
          <p class="text-[0.7rem] uppercase tracking-wider text-[color:var(--color-fg-subtle)] px-2 pt-1.5 pb-1">
            Recent
          </p>
          <button
            v-for="result in searchStore.recentSearches"
            :key="result.id"
            class="w-full text-left px-2 py-1.5 text-sm rounded-md text-[color:var(--color-fg-muted)] hover:bg-[color:var(--color-surface-2)] hover:text-[color:var(--color-fg)] flex items-center gap-2 transition-colors"
            @mousedown="selectSuggestion(result.query)"
          >
            <History class="h-3.5 w-3.5 text-[color:var(--color-fg-subtle)] flex-shrink-0" />
            <span class="truncate">{{ result.query }}</span>
          </button>
        </div>
      </Transition>
    </div>

    <ErrorState
      v-if="searchStore.error"
      :message="searchStore.error"
      @retry="handleSearch"
    />

    <div v-else-if="searchStore.loading" class="text-center py-10">
      <Spinner :size="28" />
      <p class="text-sm text-[color:var(--color-fg-muted)] mt-3">Searching the web with AI…</p>
      <p class="text-xs text-[color:var(--color-fg-subtle)] mt-1">This may take a few moments</p>
    </div>

    <div v-else-if="currentResult && !showHistory">
      <div
        class="rounded-xl bg-[color:var(--color-surface-2)] border border-[color:var(--color-border)] p-5"
      >
        <div class="flex items-center gap-2 mb-3">
          <div
            class="flex h-7 w-7 items-center justify-center rounded-lg bg-[color:var(--color-brand-600)] text-white"
          >
            <Sparkles class="h-4 w-4" />
          </div>
          <h3 class="text-sm font-semibold text-[color:var(--color-fg)]">AI Answer</h3>
        </div>
        <div
          class="markdown-content text-sm text-[color:var(--color-fg-muted)] leading-relaxed"
          v-html="formatAnswer(currentResult.answer)"
        />
      </div>
      <div
        class="flex items-center justify-between text-xs text-[color:var(--color-fg-subtle)] pt-3 mt-3 border-t border-[color:var(--color-border)]"
      >
        <span>{{ formatDate(currentResult.timestamp) }}</span>
        <UiButton variant="ghost" size="sm" :leading-icon="RotateCcw" @click="resetChat">
          Reset
        </UiButton>
      </div>
    </div>

    <div v-if="showHistory && searchStore.searchHistory.length > 0">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-semibold text-[color:var(--color-fg)]">History</h3>
        <UiButton variant="danger" size="sm" :leading-icon="Trash2" @click="searchStore.clearHistory">
          Clear
        </UiButton>
      </div>
      <div class="space-y-1.5">
        <div
          v-for="result in searchStore.searchHistory.slice(0, 10)"
          :key="result.id"
          class="group flex items-center gap-2 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 transition-colors hover:bg-[color:var(--color-surface-2)]"
        >
          <button
            class="flex-1 text-left text-sm text-[color:var(--color-fg)] hover:text-[color:var(--color-brand-600)] transition-colors truncate"
            @click="selectFromHistory(result)"
          >
            {{ result.query }}
          </button>
          <span class="text-xs text-[color:var(--color-fg-subtle)] flex-shrink-0">
            {{ formatDate(result.timestamp) }}
          </span>
          <button
            class="ui-icon-btn opacity-0 group-hover:opacity-100 transition-opacity"
            :aria-label="`Remove ${result.query} from history`"
            @click="searchStore.removeFromHistory(result.id)"
          >
            <X />
          </button>
        </div>
      </div>
    </div>

    <EmptyState
      v-if="!searchStore.loading && !currentResult && !searchStore.error && !showHistory"
      :icon="Sparkles"
      title="Search the web with AI"
      description="Ask questions, research topics, or find current information."
    />
  </WidgetCard>
</template>

<style scoped>
.ui-popover-enter-active,
.ui-popover-leave-active {
  transition:
    opacity 150ms ease,
    transform 150ms ease;
}
.ui-popover-enter-from,
.ui-popover-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
