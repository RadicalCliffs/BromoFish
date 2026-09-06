#!/usr/bin/env node
/**
 * Asserts that the shipped palette actually meets WCAG AA.
 *
 * Design tokens drift. This runs in CI so a "just slightly lighter" tweak to a muted text
 * colour cannot quietly drop the app below 4.5:1 for the people who need it most.
 */
import { readFileSync } from 'node:fs';

const src = readFileSync('src/theme/tokens.ts', 'utf8');

const lin = (c) => {
  c /= 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const parse = (hex) => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
};
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const contrast = (a, b) => {
  const [x, y] = [lum(parse(a)), lum(parse(b))].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

/** Pulls one theme's literal hex values straight out of the tokens file. */
const readTheme = (name) => {
  const block = src.slice(src.indexOf(`${name}: {`));
  const end = block.indexOf('\n  },');
  const body = block.slice(0, end);
  const theme = {};
  // Each entry is either a literal hex or a palette.* reference; resolve both.
  for (const [, key, ref, literal] of body.matchAll(/(\w+):\s*(?:palette\.(\w+)|'(#[0-9A-Fa-f]{3,8})')/g)) {
    if (literal) {
      theme[key] = literal;
    } else if (ref) {
      const m = src.match(new RegExp(`\\b${ref}:\\s*'(#[0-9A-Fa-f]{6})'`));
      if (m) theme[key] = m[1];
    }
  }
  return theme;
};

// Body text pairs that must clear 4.5:1, and large/UI pairs that must clear 3:1.
const BODY = [
  ['text', 'bg'],
  ['text', 'surface'],
  ['textMuted', 'bg'],
  ['textMuted', 'surface'],
  ['accentText', 'bg'],
  ['savedText', 'bg'],
  ['positiveText', 'bg'],
  ['onAccent', 'accent'],
];
// Interactive boundaries only. `border` is a decorative hairline between cards and is exempt
// from 1.4.11; `accent` is only ever a fill, and the text placed on it is checked above.
const UI = [
  ['borderStrong', 'bg'],
  ['borderStrong', 'surface'],
];

let failures = 0;
for (const name of ['light', 'dark']) {
  const theme = readTheme(name);
  console.log(`\n${name} theme`);
  for (const [fg, bg] of BODY) {
    if (!theme[fg] || !theme[bg]) {
      console.log(`  ?     ${fg} on ${bg} — could not resolve a colour`);
      failures++;
      continue;
    }
    const ratio = contrast(theme[fg], theme[bg]);
    const ok = ratio >= 4.5;
    if (!ok) failures++;
    console.log(`  ${ok ? 'pass' : 'FAIL'}  ${fg} on ${bg}  ${ratio.toFixed(2)}:1  (needs 4.5)`);
  }
  for (const [fg, bg] of UI) {
    const ratio = contrast(theme[fg], theme[bg]);
    const ok = ratio >= 3;
    if (!ok) failures++;
    console.log(`  ${ok ? 'pass' : 'FAIL'}  ${fg} on ${bg}  ${ratio.toFixed(2)}:1  (needs 3.0, non-text)`);
  }
}

console.log(failures ? `\n${failures} contrast failure(s).` : '\nAll palette pairs meet WCAG AA.');
process.exit(failures ? 1 : 0);
