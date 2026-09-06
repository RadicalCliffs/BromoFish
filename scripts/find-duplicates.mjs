#!/usr/bin/env node
/**
 * Finds near-duplicate sparks across the whole library.
 *
 * The library is written by many independent agents, so the same idea can legitimately appear
 * in two books — but the same *card* appearing twice in one scroll session is a credibility
 * failure. This compares word-trigram sets with Jaccard similarity, using an inverted index so
 * the comparison stays near-linear instead of quadratic across thousands of cards.
 *
 * Usage: node scripts/find-duplicates.mjs [--threshold 0.4] [--field hook|insight] [--json]
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const THRESHOLD = Number(arg('threshold', 0.4));
const FIELD = arg('field', 'hook');
const asJson = args.includes('--json');

const STOP = new Set(['the', 'a', 'an', 'of', 'to', 'and', 'is', 'it', 'you', 'your', 'in', 'that', 'for', 'on', 'not']);

const tokens = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !STOP.has(w));

/** Word trigrams. Shorter texts fall back to their bare token set. */
const shingles = (text) => {
  const t = tokens(text);
  if (t.length < 3) return new Set(t);
  const out = new Set();
  for (let i = 0; i <= t.length - 3; i++) out.add(`${t[i]} ${t[i + 1]} ${t[i + 2]}`);
  return out;
};

const jaccard = (a, b) => {
  if (!a.size || !b.size) return 0;
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  let shared = 0;
  for (const s of small) if (large.has(s)) shared++;
  return shared / (a.size + b.size - shared);
};

const cards = [];
for (const file of readdirSync('content/raw').filter((f) => f.endsWith('.json'))) {
  let data;
  try {
    data = JSON.parse(readFileSync(join('content/raw', file), 'utf8'));
  } catch {
    continue; // a batch still being written is not this tool's problem
  }
  if (!Array.isArray(data)) continue;
  for (const book of data) {
    for (const spark of book?.sparks ?? []) {
      const text = spark?.[FIELD];
      if (typeof text !== 'string') continue;
      cards.push({ id: spark.id, book: book.title, category: book.category, text, set: shingles(text) });
    }
  }
}

// Inverted index: only compare cards that share at least one trigram.
const index = new Map();
cards.forEach((card, i) => {
  for (const s of card.set) {
    if (!index.has(s)) index.set(s, []);
    index.get(s).push(i);
  }
});

const seenPair = new Set();
const hits = [];
cards.forEach((card, i) => {
  const candidates = new Set();
  for (const s of card.set) for (const j of index.get(s)) if (j > i) candidates.add(j);
  for (const j of candidates) {
    const key = `${i}:${j}`;
    if (seenPair.has(key)) continue;
    seenPair.add(key);
    const score = jaccard(card.set, cards[j].set);
    if (score >= THRESHOLD) hits.push({ score, a: card, b: cards[j] });
  }
});

hits.sort((x, y) => y.score - x.score);

if (asJson) {
  console.log(
    JSON.stringify(
      hits.map((h) => ({ score: Number(h.score.toFixed(3)), a: h.a.id, b: h.b.id, aText: h.a.text, bText: h.b.text })),
      null,
      2
    )
  );
} else {
  console.log(`\n${cards.length} cards compared on "${FIELD}" at threshold ${THRESHOLD}`);
  if (!hits.length) {
    console.log('No near-duplicates found.');
  } else {
    console.log(`${hits.length} near-duplicate pair(s):\n`);
    for (const h of hits.slice(0, 40)) {
      const sameBook = h.a.book === h.b.book;
      console.log(`  ${h.score.toFixed(2)}${sameBook ? '  [SAME BOOK]' : ''}`);
      console.log(`    ${h.a.id}  (${h.a.book})`);
      console.log(`      ${h.a.text}`);
      console.log(`    ${h.b.id}  (${h.b.book})`);
      console.log(`      ${h.b.text}\n`);
    }
    if (hits.length > 40) console.log(`  …and ${hits.length - 40} more`);
  }
}

// Two cards from the same book saying the same thing is always a defect; across books it is
// often legitimate, so only the former fails the build.
const sameBookHits = hits.filter((h) => h.a.book === h.b.book);
if (sameBookHits.length) {
  console.log(`\n${sameBookHits.length} duplicate pair(s) within a single book — these must be rewritten.`);
  process.exit(1);
}
