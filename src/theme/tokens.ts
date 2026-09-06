/**
 * Shift for Brains design tokens.
 *
 * The brand is aggressive, neon, and high-contrast. Dark bg with cyan glows, pink accents,
 * sharp corners, and uppercase typography. Designed to stop scrollers and command attention.
 *
 * Accessibility: contrast ratios verified for cyan (#00D9FF) and pink (#FF006E) on dark bg.
 */

export const palette = {
  bg: '#0A0E27',
  bgDeep: '#050710',
  surface: '#131829',
  surfaceLight: '#1A1F3A',

  cyan: '#00D9FF',
  cyanAccent: '#00B8CC',
  pink: '#FF006E',
  pinkAccent: '#DC143C',

  text: '#FFFFFF',
  textMuted: '#8D87A6',

  white: '#FFFFFF',
  black: '#000000',
} as const;

export type ThemeName = 'dark';

export interface Theme {
  name: ThemeName;
  bg: string;
  surface: string;
  surfaceLift: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  onAccent: string;
  accent: string;
  accentText: string;
  saved: string;
  savedText: string;
  positive: string;
  positiveText: string;
  scrim: string;
  glowColor: string;
}

export const themes: Record<ThemeName, Theme> = {
  dark: {
    name: 'dark',
    bg: palette.bg,
    surface: palette.surface,
    surfaceLift: palette.surfaceLight,
    border: palette.surfaceLight,
    borderStrong: palette.cyan,
    text: palette.text,
    textMuted: palette.textMuted,
    onAccent: palette.bg,
    accent: palette.cyan,
    accentText: palette.cyan,
    saved: palette.pink,
    savedText: palette.pink,
    positive: palette.cyan,
    positiveText: palette.cyan,
    scrim: 'rgba(10,14,39,0.8)',
    glowColor: 'rgba(0, 217, 255, 0.3)',
  },
};

/** 4pt base scale. Spacing is never ad-hoc — always one of these. */
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 32,
  pill: 999,
} as const;

/**
 * Type scale. `lineHeight` is baked in because React Native will not compute a sensible one,
 * and cramped line height is the fastest way to make a reading app unreadable.
 */
export const type = {
  hook: { fontSize: 30, lineHeight: 36, fontWeight: '800' as const, letterSpacing: -0.6 },
  hookSm: { fontSize: 25, lineHeight: 31, fontWeight: '800' as const, letterSpacing: -0.4 },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '700' as const, letterSpacing: -0.3 },
  subtitle: { fontSize: 18, lineHeight: 25, fontWeight: '600' as const },
  body: { fontSize: 17, lineHeight: 26, fontWeight: '400' as const },
  bodyStrong: { fontSize: 17, lineHeight: 26, fontWeight: '600' as const },
  small: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '600' as const, letterSpacing: 0.2 },
  overline: { fontSize: 11, lineHeight: 14, fontWeight: '800' as const, letterSpacing: 1.1 },
} as const;

export const shadow = {
  card: {
    shadowColor: palette.cyan,
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  lift: {
    shadowColor: palette.cyan,
    shadowOpacity: 0.3,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
} as const;

/** Minimum interactive size. Below this, a target fails WCAG 2.5.8 and feels bad besides. */
export const HIT_SIZE = 44;

export const duration = {
  fast: 140,
  base: 240,
  slow: 420,
} as const;
