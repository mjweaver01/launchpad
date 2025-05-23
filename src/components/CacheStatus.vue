<template>
  <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm">
    <div class="flex items-center justify-between mb-3">
      <h3 class="font-semibold text-gray-700">Cache Status</h3>
      <button @click="toggleExpanded" class="text-gray-500 hover:text-gray-700 transition-colors">
        <svg
          :class="['w-4 h-4 transition-transform', expanded ? 'rotate-180' : '']"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
    </div>

    <div class="grid grid-cols-2 gap-4 mb-3">
      <div>
        <span class="text-gray-600">Cached Items:</span>
        <span class="font-medium ml-1">{{ cacheInfo.keys.length }}</span>
      </div>
      <div>
        <span class="text-gray-600">Storage Size:</span>
        <span class="font-medium ml-1">{{ formatSize(cacheInfo.totalSize) }}</span>
      </div>
    </div>

    <div v-if="expanded" class="border-t border-gray-200 pt-3">
      <div class="space-y-2">
        <div v-if="cacheInfo.keys.length === 0" class="text-gray-500 italic">No cached items</div>
        <div v-else>
          <h4 class="font-medium text-gray-700 mb-2">Cached Keys:</h4>
          <div class="space-y-1">
            <div
              v-for="key in cacheInfo.keys"
              :key="key"
              class="flex items-center justify-between bg-white px-2 py-1 rounded text-xs"
            >
              <span class="font-mono">{{ key }}</span>
              <span class="text-gray-500">
                {{ getCacheAge(key) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="flex gap-2 mt-3 pt-3 border-t border-gray-200">
        <button
          @click="refreshCache"
          class="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
        >
          Refresh
        </button>
        <button
          @click="clearCache"
          class="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
        >
          Clear All
        </button>
        <button
          @click="cleanupExpired"
          class="px-3 py-1 bg-yellow-500 text-white rounded text-xs hover:bg-yellow-600 transition-colors"
        >
          Cleanup Expired
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { useWeatherStore, useNewsStore, CacheStorage } from '../stores';

export default defineComponent({
  name: 'CacheStatus',
  setup() {
    const weatherStore = useWeatherStore();
    const newsStore = useNewsStore();
    const expanded = ref(false);
    const cacheInfo = ref({ keys: [], totalSize: 0 });

    const toggleExpanded = () => {
      expanded.value = !expanded.value;
    };

    const updateCacheInfo = () => {
      cacheInfo.value = CacheStorage.getCacheInfo();
    };

    const formatSize = (bytes: number) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getCacheAge = (key: string) => {
      try {
        const entry = CacheStorage.get(key);
        if (entry) {
          const ageMs = Date.now() - entry.timestamp;
          const ageMinutes = Math.floor(ageMs / (1000 * 60));
          if (ageMinutes < 1) return 'Just now';
          if (ageMinutes < 60) return `${ageMinutes}m ago`;
          const ageHours = Math.floor(ageMinutes / 60);
          return `${ageHours}h ago`;
        }
      } catch (error) {
        console.warn('Error getting cache age:', error);
      }
      return 'Unknown';
    };

    const refreshCache = async () => {
      await Promise.all([weatherStore.refresh(), newsStore.refresh()]);
      updateCacheInfo();
    };

    const clearCache = () => {
      weatherStore.clearCache();
      newsStore.clearCache();
      CacheStorage.clear();
      updateCacheInfo();
    };

    const cleanupExpired = () => {
      CacheStorage.clearExpired();
      newsStore.clearExpiredCache();
      updateCacheInfo();
    };

    onMounted(() => {
      updateCacheInfo();
    });

    return {
      expanded,
      cacheInfo,
      toggleExpanded,
      formatSize,
      getCacheAge,
      refreshCache,
      clearCache,
      cleanupExpired,
    };
  },
});
</script>
