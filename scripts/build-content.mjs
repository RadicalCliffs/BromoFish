#!/usr/bin/env node
/**
 * Compiles content/raw/*.json into the shipped library.
 *
 * The raw files are one-per-agent and deliberately dumb. This step is where the library
 * becomes coherent: duplicates across batches are resolved, low-confidence records are
 * dropped, dangling `if_you_liked` links are pruned, and per-category counts are reported so
 * a thin category is visible rather than silently shipped.
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const RAW = 'content/raw';
const categories = JSON.parse(readFileSync('content/schema/categories.json', 'utf8'));
const validCategories = new Set(categories.map((c) => c.id));

const books = [];
const seen = new Map();
const dropped = [];

const files = readdirSync(RAW).filter((f) => f.endsWith('.json')).sort();
for (const file of files) {
  let batch;
  try {
    batch = JSON.parse(readFileSync(join(RAW, file), 'utf8'));
  } catch (e) {
    dropped.push(`${file}: unparseable (${e.message})`);
    continue;
  }
  if (!Array.isArray(batch)) {
    dropped.push(`${file}: not an array`);
    continue;
  }
  for (const book of batch) {
    if (!book?.id || !Array.isArray(book.sparks)) {
      dropped.push(`${file}: malformed record "${book?.title ?? '?'}"`);
      continue;
    }
    if (!validCategories.has(book.category)) {
      dropped.push(`${book.id}: unknown category "${book.category}"`);
      continue;
    }
    if (book.verification?.confidence === 'low') {
      dropped.push(`${book.id}: low confidence`);
      continue;
    }
    // Two agents can legitimately land on the same title from different categories. The first
    // one wins so the build is deterministic given a sorted file list.
    const key = book.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (seen.has(key)) {
      dropped.push(`${book.id}: duplicate of ${seen.get(key)}`);
      continue;
    }
    seen.set(key, book.id);
    books.push(book);
  }
}

const ids = new Set(books.map((b) => b.id));
let prunedLinks = 0;
for (const book of books) {
  if (Array.isArray(book.if_you_liked)) {
    const kept = book.if_you_liked.filter((s) => s !== book.id && ids.has(s));
    prunedLinks += book.if_you_liked.length - kept.length;
    book.if_you_liked = kept;
  }
  book.spark_count = book.sparks.length;
}

// Stable ordering: category order from the taxonomy, then title. Feed shuffling happens on
// device with a per-user seed, so the shipped order only needs to be predictable.
const catOrder = new Map(categories.map((c, i) => [c.id, i]));
books.sort((a, b) => (catOrder.get(a.category) - catOrder.get(b.category)) || a.title.localeCompare(b.title));

const byCategory = new Map(categories.map((c) => [c.id, 0]));
for (const b of books) byCategory.set(b.category, byCategory.get(b.category) + 1);

const sparkCount = books.reduce((n, b) => n + b.sparks.length, 0);
const carouselCount = books.reduce((n, b) => n + b.sparks.filter((s) => s.format === 'carousel').length, 0);

const library = {
  version: 1,
  generated_at: new Date().toISOString().slice(0, 10),
  counts: { books: books.length, sparks: sparkCount, carousels: carouselCount, categories: categories.length },
  categories,
  books,
};

mkdirSync('content/dist', { recursive: true });
mkdirSync('src/data', { recursive: true });
writeFileSync('content/dist/library.json', JSON.stringify(library, null, 2) + '\n');
// The app bundles the minified copy; the pretty one exists for diffing and for the SQL seed.
writeFileSync('src/data/library.json', JSON.stringify(library));

const thin = categories.filter((c) => byCategory.get(c.id) < c.target * 0.6);

console.log(`\nDogear library built`);
console.log(`  ${books.length} books · ${sparkCount} sparks · ${carouselCount} carousels`);
console.log(`  ${prunedLinks} dangling related-book links pruned`);
if (dropped.length) {
  console.log(`\n  ${dropped.length} record(s) dropped:`);
  for (const d of dropped.slice(0, 40)) console.log(`    - ${d}`);
  if (dropped.length > 40) console.log(`    …and ${dropped.length - 40} more`);
}
console.log('\n  per category:');
for (const c of categories) {
  const n = byCategory.get(c.id);
  const flag = n < c.target * 0.6 ? '  ← thin' : '';
  console.log(`    ${c.id.padEnd(30)} ${String(n).padStart(3)} / ${c.target}${flag}`);
}
if (thin.length) console.log(`\n  ${thin.length} category(ies) below 60% of target.`);
