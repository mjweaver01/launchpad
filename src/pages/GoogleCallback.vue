<template>
  <div class="min-h-screen bg-gray-100 flex items-center justify-center">
    <div class="bg-white rounded-lg shadow-md p-8 max-w-md w-full mx-4">
      <div class="text-center">
        <!-- Loading State -->
        <div v-if="loading" class="space-y-4">
          <svg
            class="animate-spin mx-auto h-12 w-12 text-indigo-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <h2 class="text-xl font-semibold text-gray-800">Connecting your calendar...</h2>
          <p class="text-gray-600">Please wait while we complete the authentication.</p>
        </div>

        <!-- Success State -->
        <div v-else-if="success" class="space-y-4">
          <svg
            class="mx-auto h-12 w-12 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
            ></path>
          </svg>
          <h2 class="text-xl font-semibold text-gray-800">Calendar Connected!</h2>
          <p class="text-gray-600">You will be redirected to your dashboard in a moment.</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="space-y-4">
          <svg
            class="mx-auto h-12 w-12 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            ></path>
          </svg>
          <h2 class="text-xl font-semibold text-gray-800">Connection Failed</h2>
          <p class="text-red-600 text-sm">{{ error }}</p>
          <button
            @click="goHome"
            class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Go Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useCalendarStore } from '../stores';

export default defineComponent({
  name: 'GoogleCallback',
  setup() {
    const router = useRouter();
    const route = useRoute();
    const calendarStore = useCalendarStore();

    const loading = ref(true);
    const success = ref(false);
    const error = ref('');

    const goHome = () => {
      router.push('/');
    };

    const handleCallback = async () => {
      try {
        const code = route.query.code as string;
        const errorParam = route.query.error as string;

        if (errorParam) {
          throw new Error(`Authentication cancelled: ${errorParam}`);
        }

        if (!code) {
          throw new Error('No authorization code received');
        }

        // Handle the authorization code
        await calendarStore.handleAuthCallback(code);

        success.value = true;
        loading.value = false;

        // Redirect to home after a delay
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Unknown error occurred';
        loading.value = false;
      }
    };

    onMounted(() => {
      handleCallback();
    });

    return {
      loading,
      success,
      error,
      goHome,
    };
  },
});
</script>
