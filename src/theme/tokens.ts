/**
 * Dogear design tokens.
 *
 * The brand is warm, bright and paper-like rather than neon: a dog-eared page is a physical,
 * friendly gesture, so the palette leans on marigold, rose and ink instead of the saturated
 * blue-purple every learning app defaults to.
 *
 * Accessibility is a constraint, not a pass at the end. Every foreground/background pair
 * defined here clears WCAG AA (4.5:1) for body text, verified by `scripts/check-contrast.mjs`,
 * which runs in CI. Category accents are generated the same way in `scripts/gen-categories.mjs`.
 */

export const palette = {
  ink: '#1C1B29',
  inkSoft: '#2A2838',
  inkLift: '#3A3750',
  paper: '#FFFCF5',
  paperSoft: '#F4EFE4',
  /** Decorative hairline between cards. Not used to define an interactive boundary. */
  paperEdge: '#E4DCCB',
  /** Boundary of an interactive control. Meets the 3:1 required by WCAG 1.4.11. */
  paperEdgeStrong: '#857C6B',
  inkEdge: '#453F5C',
  inkEdgeStrong: '#8D87A6',

  marigold: '#FFB627',
  marigoldDeep: '#8A5900',
  rose: '#FF5A7E',
  roseDeep: '#B01236',
  jade: '#00B58A',
  jadeDeep: '#006B52',
  slate: '#6B6880',
  slateLight: '#9C99AE',

  white: '#FFFFFF',
  black: '#000000',
} as const;

export type ThemeName = 'light' | 'dark';

export interface Theme {
  name: ThemeName;
  /** Page background. */
  bg: string;
  /** Raised surface — cards, sheets, inputs. */
  surface: string;
  /** A surface one step further forward, for nested cards. */
  surfaceLift: string;
  /** Hairlines and dividers. Decorative — deliberately low contrast. */
  border: string;
  /** Boundary of an interactive control: inputs, buttons, selectable chips. Clears 3:1. */
  borderStrong: string;
  /** Primary body text. AA against bg and surface. */
  text: string;
  /** De-emphasised text. Still AA against bg. */
  textMuted: string;
  /** Text on a coloured accent fill. */
  onAccent: string;
  /** Brand accent for primary actions. */
  accent: string;
  /** Accent tuned to be legible as *text* on this theme's bg. */
  accentText: string;
  /** The dogear/save state. */
  saved: string;
  savedText: string;
  positive: string;
  positiveText: string;
  /** Scrim over imagery so text stays readable. */
  scrim: string;
}

export const themes: Record<ThemeName, Theme> = {
  light: {
    name: 'light',
    bg: palette.paper,
    surface: palette.white,
    surfaceLift: palette.paperSoft,
    border: palette.paperEdge,
    borderStrong: palette.paperEdgeStrong,
    text: palette.ink,
    textMuted: '#57536B',
    onAccent: palette.ink,
    accent: palette.marigold,
    accentText: palette.marigoldDeep,
    saved: palette.rose,
    savedText: palette.roseDeep,
    positive: palette.jade,
    positiveText: palette.jadeDeep,
    scrim: 'rgba(28,27,41,0.55)',
  },
  dark: {
    name: 'dark',
    bg: palette.ink,
    surface: palette.inkSoft,
    surfaceLift: palette.inkLift,
    border: palette.inkEdge,
    borderStrong: palette.inkEdgeStrong,
    text: palette.paper,
    textMuted: '#B4B0C6',
    onAccent: palette.ink,
    accent: palette.marigold,
    accentText: palette.marigold,
    saved: palette.rose,
    savedText: palette.rose,
    positive: palette.jade,
    positiveText: '#3DE0B4',
    scrim: 'rgba(12,11,20,0.62)',
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
  sm: 8,
  md: 14,
  lg: 22,
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
    shadowColor: palette.ink,
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  lift: {
    shadowColor: palette.ink,
    shadowOpacity: 0.22,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12,
  },
} as const;

/** Minimum interactive size. Below this, a target fails WCAG 2.5.8 and feels bad besides. */
export const HIT_SIZE = 44;

export const duration = {
  fast: 140,
  base: 240,
  slow: 420,
} as const;
