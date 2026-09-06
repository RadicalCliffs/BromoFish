#!/usr/bin/env node
/**
 * Generates content/schema/categories.json.
 *
 * Category accents are derived from a hand-tuned HSL sweep rather than picked by eye, so
 * that every accent is guaranteed to clear WCAG AA (4.5:1) against whichever of ink or
 * paper is paired with it. Colour is never the only signal in the UI — every category also
 * carries an icon and a label — but the palette still has to pass on its own.
 */
import { writeFileSync } from 'node:fs';

const INK = '#1C1B29';
const PAPER = '#FFFCF5';

// id, label, short chip label, hue (deg), saturation, lightness, target book count, blurb
const CATS = [
  ['self-help',                 'Self-Help',              'Self',        18,  92, 46, 36, 'Becoming the version of you that does the thing.'],
  ['psychology',                'Psychology',             'Psych',      265,  72, 52, 36, 'How the mind actually works, biases and all.'],
  ['business-strategy',         'Business & Strategy',    'Business',   215,  78, 44, 32, 'How companies win, and why most of them don’t.'],
  ['entrepreneurship',          'Entrepreneurship',       'Startups',   340,  82, 48, 24, 'Building something from nothing without going broke.'],
  ['leadership-management',     'Leadership',             'Leading',     10,  62, 40, 24, 'Getting good work out of people who have a choice.'],
  ['personal-finance',          'Personal Finance',       'Money',      162,  84, 32, 24, 'Earning, keeping and not fumbling your own money.'],
  ['investing-economics',       'Investing & Economics',  'Investing',  188,  82, 30, 24, 'Markets, incentives and the price of everything.'],
  ['productivity-focus',        'Productivity & Focus',   'Focus',       42,  96, 50, 20, 'Doing fewer things, and finishing them.'],
  ['health-fitness',            'Health & Fitness',       'Fitness',    334,  74, 44, 24, 'Training, eating and sleeping like it matters.'],
  ['medical-body',             'Medicine & The Body',    'Medicine',    92,  62, 30, 20, 'What is going on under your own skin.'],
  ['wellbeing-happiness',       'Wellbeing & Happiness',  'Wellbeing',   36,  94, 52, 24, 'A life that feels good from the inside.'],
  ['mindfulness-spirituality',  'Mindfulness',            'Mindful',    248,  54, 46, 20, 'Attention, stillness and the examined life.'],
  ['philosophy',                'Philosophy',             'Philosophy', 282,  46, 38, 24, 'The oldest arguments, still unresolved, still useful.'],
  ['relationships-communication','Relationships',         'People',     318,  70, 46, 24, 'Being understood, and understanding back.'],
  ['culture-society',           'Culture & Society',      'Culture',    290,  66, 44, 24, 'The invisible rules everyone is following.'],
  ['politics-power',            'Politics & Power',       'Politics',   356,  62, 40, 20, 'Who decides, how, and at whose expense.'],
  ['history',                   'History',                'History',     28,  56, 34, 24, 'How we got here, told honestly.'],
  ['science-nature',            'Science & Nature',       'Science',    172,  76, 32, 24, 'The universe, and our slow decoding of it.'],
  ['technology-future',         'Technology & Future',    'Tech',       232,  74, 50, 24, 'What the machines are doing to us next.'],
  ['creativity-art',            'Creativity & Art',       'Creative',   306,  78, 48, 20, 'Making things, and surviving the making.'],
  ['learning-education',        'Learning',               'Learning',   200,  84, 40, 20, 'Getting better at getting better.'],
  ['sport-performance',         'Sport & Performance',    'Sport',      140,  70, 32, 20, 'Elite practice, pressure and the long grind.'],
  ['how-to-diy',                'How-To & DIY',           'How-To',      64,  78, 34, 16, 'Practical skills you can use this weekend.'],
  ['entertainment-storytelling','Storytelling',           'Stories',    252,  70, 44, 16, 'Why some stories grab you and never let go.'],
  ['biography-memoir',          'Biography & Memoir',     'Lives',      348,  48, 36, 20, 'One life, examined closely enough to borrow from.'],
];

const hsl2rgb = (h, s, l) => {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)].map((v) => Math.round(v * 255));
};
const hex = (rgb) => '#' + rgb.map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const contrast = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const parse = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

/**
 * Nudges lightness toward whichever surface it is already closer to until the accent clears
 * a 5:1 target. Hues near the light/dark crossover cannot reach AA at their nominal
 * lightness, so rather than hand-picking replacements we walk to the nearest passing value.
 */
const solveLightness = (hue, sat, light) => {
  const score = (l) => {
    const rgb = hsl2rgb(hue, sat, l);
    return Math.max(contrast(rgb, parse(INK)), contrast(rgb, parse(PAPER)));
  };
  if (score(light) >= 5) return light;
  const down = lum(hsl2rgb(hue, sat, light)) < 0.4;
  for (let step = 1; step <= 40; step++) {
    const l = down ? light - step : light + step;
    if (l < 12 || l > 92) break;
    if (score(l) >= 5) return l;
  }
  for (let step = 1; step <= 40; step++) {
    const l = down ? light + step : light - step;
    if (l < 12 || l > 92) break;
    if (score(l) >= 5) return l;
  }
  return light;
};

const out = [];
const failures = [];
for (const [id, label, short, hue, sat, nominal, target, blurb] of CATS) {
  const light = solveLightness(hue, sat, nominal);
  const rgb = hsl2rgb(hue, sat, light);
  const accent = hex(rgb);
  const onInk = contrast(rgb, parse(INK));
  const onPaper = contrast(rgb, parse(PAPER));
  // Text colour placed *on* the accent, and the accent used *as* text on each surface.
  const foreground = onInk > onPaper ? INK : PAPER;
  const fgContrast = Math.max(onInk, onPaper);
  // Accent as a text/icon colour on the dark surface needs its own check.
  const asTextOnInk = onInk;
  if (fgContrast < 4.5) failures.push(`${id}: accent/foreground only ${fgContrast.toFixed(2)}:1`);
  out.push({
    id, label, short, blurb, target,
    accent,
    accentHsl: `hsl(${hue} ${sat}% ${light}%)`,
    foreground,
    contrast: Number(fgContrast.toFixed(2)),
    onInkContrast: Number(asTextOnInk.toFixed(2)),
    tint: hex(hsl2rgb(hue, Math.min(sat, 70), 94)),
    tintDark: hex(hsl2rgb(hue, Math.max(sat - 30, 20), 16)),
  });
}

if (failures.length) {
  console.error('Contrast failures:\n' + failures.join('\n'));
  process.exit(1);
}
writeFileSync('content/schema/categories.json', JSON.stringify(out, null, 2) + '\n');
const total = out.reduce((n, c) => n + c.target, 0);
console.log(`${out.length} categories · ${total} target books · min contrast ${Math.min(...out.map((c) => c.contrast)).toFixed(2)}:1`);
