import { defineStore } from 'pinia';
import { ref } from 'vue';
import { DEFAULT_APP_FONT, getFont, isFontId, type FontId } from '../assets/fonts';

const STORAGE_KEY = 'appFont';

/** App-wide font. Applied by overriding the --font-sans and --font-display variables. */
export const useAppFontStore = defineStore('appFont', () => {
  const fontId = ref<FontId>(DEFAULT_APP_FONT);

  const apply = () => {
    const root = document.documentElement.style;
    if (fontId.value === DEFAULT_APP_FONT) {
      // Fall back to the stacks defined in main.css.
      root.removeProperty('--font-sans');
      root.removeProperty('--font-display');
      return;
    }
    const { stack } = getFont(fontId.value);
    root.setProperty('--font-sans', stack);
    root.setProperty('--font-display', stack);
  };

  const initialize = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (isFontId(saved)) fontId.value = saved;
    } catch {
      /* storage unavailable */
    }
    apply();
  };

  const setFont = (id: FontId) => {
    fontId.value = id;
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* storage unavailable */
    }
    apply();
  };

  return { fontId, initialize, setFont };
});
