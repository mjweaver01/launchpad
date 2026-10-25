// One list of typefaces for both the app-wide font and the clock font.
// Self-hosted, latin subset only: each file is registered from code (rather
// than @fontsource's CSS, which pulls every language subset) so exactly one
// file per font is bundled and precached for offline use.
import nunitoUrl from '@fontsource-variable/nunito/files/nunito-latin-wght-normal.woff2?url';
import oswaldUrl from '@fontsource-variable/oswald/files/oswald-latin-wght-normal.woff2?url';
import outfitUrl from '@fontsource-variable/outfit/files/outfit-latin-wght-normal.woff2?url';
import dmSerifUrl from '@fontsource/dm-serif-display/files/dm-serif-display-latin-400-normal.woff2?url';

export type FontId = 'sans' | 'rounded' | 'mono' | 'condensed' | 'serif' | 'light';

// Literal fallback stacks (no var()) so a font's stack can be assigned to the
// --font-sans variable without referring to itself.
const SANS_STACK =
  "'Inter var', 'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
const MONO_STACK =
  "'JetBrains Mono', ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace";
const SERIF_STACK = "Georgia, 'Times New Roman', serif";

export interface FontOption {
  id: FontId;
  label: string;
  /** CSS font-family value. */
  stack: string;
  /** Self-hosted file to register; system fonts have none. */
  source?: { family: string; url: string; weight: string };
  /** How the clock draws its digits in this font. */
  clock: { weight: number; letterSpacing: string };
}

export const FONTS: FontOption[] = [
  {
    id: 'sans',
    label: 'Sans',
    stack: SANS_STACK,
    clock: { weight: 700, letterSpacing: '-0.03em' },
  },
  {
    id: 'rounded',
    label: 'Rounded',
    stack: `'Nunito Variable', ${SANS_STACK}`,
    source: { family: 'Nunito Variable', url: nunitoUrl, weight: '200 1000' },
    clock: { weight: 800, letterSpacing: '-0.02em' },
  },
  {
    id: 'mono',
    label: 'Monospace',
    stack: MONO_STACK,
    clock: { weight: 700, letterSpacing: '-0.05em' },
  },
  {
    id: 'condensed',
    label: 'Condensed',
    stack: `'Oswald Variable', ${SANS_STACK}`,
    source: { family: 'Oswald Variable', url: oswaldUrl, weight: '200 700' },
    clock: { weight: 500, letterSpacing: '0' },
  },
  {
    id: 'serif',
    label: 'Serif',
    stack: `'DM Serif Display', ${SERIF_STACK}`,
    source: { family: 'DM Serif Display', url: dmSerifUrl, weight: '400' },
    clock: { weight: 400, letterSpacing: '-0.01em' },
  },
  {
    id: 'light',
    label: 'Geometric',
    stack: `'Outfit Variable', ${SANS_STACK}`,
    source: { family: 'Outfit Variable', url: outfitUrl, weight: '100 900' },
    clock: { weight: 200, letterSpacing: '-0.02em' },
  },
];

export const DEFAULT_APP_FONT: FontId = 'sans';

export const isFontId = (value: unknown): value is FontId => FONTS.some(f => f.id === value);

export const getFont = (id: FontId): FontOption => FONTS.find(f => f.id === id) ?? FONTS[0];

/** Options for a UiSelect. */
export const fontSelectOptions = FONTS.map(f => ({ label: f.label, value: f.id }));

/** Register the self-hosted fonts. They download only when first used. */
export const registerFonts = () => {
  if (typeof document === 'undefined' || !('fonts' in document)) return;
  for (const { source } of FONTS) {
    if (!source) continue;
    const face = new FontFace(source.family, `url(${source.url}) format('woff2')`, {
      weight: source.weight,
      display: 'swap',
    });
    document.fonts.add(face);
  }
};
