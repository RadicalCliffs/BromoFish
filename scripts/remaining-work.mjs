#!/usr/bin/env node
/**
 * Reports what the library is still missing, and writes resume files so a re-run only covers
 * the gap rather than redoing work that already validated.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const norm = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

// Titles an agent deliberately swapped out are satisfied, not missing — otherwise every
// future diff re-requests a book we decided on purpose not to carry.
const swappedOut = new Set();
if (existsSync('content/schema/swaps.txt')) {
  for (const line of readFileSync('content/schema/swaps.txt', 'utf8').split('\n')) {
    if (!line.trim() || line.startsWith('#')) continue;
    const [, dropped] = line.split('|');
    if (dropped) swappedOut.add(norm(dropped));
  }
}

const have = new Set();
for (const f of readdirSync('content/raw').filter((n) => n.endsWith('.json'))) {
  let data;
  try { data = JSON.parse(readFileSync(join('content/raw', f), 'utf8')); } catch { continue; }
  if (Array.isArray(data)) for (const b of data) if (b?.title) have.add(norm(b.title));
}

mkdirSync('content/batches/resume', { recursive: true });
const manifest = JSON.parse(readFileSync('content/batches/manifest.json', 'utf8'));
const rows = [];
for (const { name } of manifest) {
  const batch = JSON.parse(readFileSync(join('content/batches', `${name}.json`), 'utf8'));
  const missing = batch.books.filter((b) => !have.has(norm(b.title)) && !swappedOut.has(norm(b.title)));
  const resumePath = join('content/batches/resume', `${name}.json`);
  if (missing.length) {
    writeFileSync(resumePath, JSON.stringify({ ...batch, books: missing }, null, 2) + '\n');
  } else if (existsSync(resumePath)) {
    writeFileSync(resumePath, JSON.stringify({ ...batch, books: [] }, null, 2) + '\n');
  }
  rows.push({ name, done: batch.books.length - missing.length, total: batch.books.length, missing: missing.length });
}

const done = rows.filter((r) => !r.missing);
const partial = rows.filter((r) => r.missing && r.done);
const untouched = rows.filter((r) => r.done === 0);

console.log(`\ncomplete: ${done.length} batches`);
console.log(`partial:  ${partial.length} batches — ${partial.map((r) => `${r.name} ${r.done}/${r.total}`).join(', ') || 'none'}`);
console.log(`untouched: ${untouched.length} batches`);
console.log(`\nbooks: ${[...have].length} of ${rows.reduce((n, r) => n + r.total, 0)}`);
console.log(`\nresume queue (partial first, they are cheapest to finish):`);
console.log([...partial, ...untouched].map((r) => r.name).join('\n'));
