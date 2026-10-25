import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export const FULLSCREEN_ACTIVE_KEY = 'fullscreen.active';
const FULLSCREEN_DIM_KEY = 'fullscreen.dim';
const FULLSCREEN_LAYOUT_KEY = 'fullscreen.layout';

export interface FullScreenLayout {
  /** Landscape: share of the width the clock gets beside one other widget (percent). Set by dragging. */
  clockWidth: number;
  /** Portrait: share of the height the clock gets above/below one other widget (percent). Set by dragging. */
  clockHeight: number;
  /** Space between widgets (px). */
  gap: number;
  /** Space around the edge of the screen (px). */
  padding: number;
}

export const FULLSCREEN_LAYOUT_LIMITS = {
  clockWidth: { min: 30, max: 80, step: 5 },
  clockHeight: { min: 30, max: 80, step: 5 },
  gap: { min: 0, max: 48, step: 2 },
  padding: { min: 0, max: 48, step: 2 },
} as const;

export const defaultFullScreenLayout = (): FullScreenLayout => ({
  clockWidth: 60,
  clockHeight: 50,
  gap: 12,
  padding: 12,
});

const clamp = (value: unknown, min: number, max: number, fallback: number): number => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

const sanitizeLayout = (raw: Partial<FullScreenLayout> | null | undefined): FullScreenLayout => {
  const d = defaultFullScreenLayout();
  const L = FULLSCREEN_LAYOUT_LIMITS;
  return {
    clockWidth: clamp(raw?.clockWidth, L.clockWidth.min, L.clockWidth.max, d.clockWidth),
    clockHeight: clamp(raw?.clockHeight, L.clockHeight.min, L.clockHeight.max, d.clockHeight),
    gap: clamp(raw?.gap, L.gap.min, L.gap.max, d.gap),
    padding: clamp(raw?.padding, L.padding.min, L.padding.max, d.padding),
  };
};

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
  const layout = ref<FullScreenLayout>(defaultFullScreenLayout());

  const initialize = () => {
    try {
      const stored = localStorage.getItem(FULLSCREEN_DIM_KEY);
      if (stored !== null) dim.value = Math.min(0.9, Math.max(0, Number(stored) || 0));
      const storedLayout = localStorage.getItem(FULLSCREEN_LAYOUT_KEY);
      layout.value = sanitizeLayout(storedLayout ? JSON.parse(storedLayout) : null);
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

  const setLayout = (patch: Partial<FullScreenLayout>) => {
    layout.value = sanitizeLayout({ ...layout.value, ...patch });
    try {
      localStorage.setItem(FULLSCREEN_LAYOUT_KEY, JSON.stringify(layout.value));
    } catch {
      /* storage unavailable */
    }
  };

  const resetLayout = () => setLayout(defaultFullScreenLayout());

  watch(dim, v => {
    try {
      localStorage.setItem(FULLSCREEN_DIM_KEY, String(v));
    } catch {
      /* storage unavailable */
    }
  });

  return {
    isRemembered,
    dim,
    layout,
    initialize,
    remember,
    setDim,
    setLayout,
    resetLayout,
  };
});
