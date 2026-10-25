import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export const FULLSCREEN_ACTIVE_KEY = 'fullscreen.active';
const FULLSCREEN_DIM_KEY = 'fullscreen.dim';

/** Read synchronously (used by the router before Pinia stores are touched). */
export const readRememberedFullScreen = (): boolean => {
  try {
    return localStorage.getItem(FULLSCREEN_ACTIVE_KEY) === '1';
  } catch {
    return false;
  }
};

export const useFullScreenStore = defineStore('fullScreen', () => {
  const isRemembered = ref(readRememberedFullScreen());
  /** 0 = no dimming, 0.9 = nearly black. Applied as a black overlay in full screen. */
  const dim = ref(0);

  const initialize = () => {
    try {
      const stored = localStorage.getItem(FULLSCREEN_DIM_KEY);
      if (stored !== null) dim.value = Math.min(0.9, Math.max(0, Number(stored) || 0));
    } catch {
      /* storage unavailable */
    }
  };

  const remember = (active: boolean) => {
    isRemembered.value = active;
    try {
      if (active) localStorage.setItem(FULLSCREEN_ACTIVE_KEY, '1');
      else localStorage.removeItem(FULLSCREEN_ACTIVE_KEY);
    } catch {
      /* storage unavailable */
    }
  };

  const setDim = (value: number) => {
    dim.value = Math.min(0.9, Math.max(0, value));
  };

  watch(dim, v => {
    try {
      localStorage.setItem(FULLSCREEN_DIM_KEY, String(v));
    } catch {
      /* storage unavailable */
    }
  });

  return { isRemembered, dim, initialize, remember, setDim };
});
