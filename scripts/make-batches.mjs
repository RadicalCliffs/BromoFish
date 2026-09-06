#!/usr/bin/env node
/** Splits the curated booklist into per-agent assignment files of at most BATCH books. */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const BATCH = 15;
const lines = readFileSync('content/schema/booklist.txt', 'utf8').split('\n').filter((l) => l.includes('|'));
const byCat = new Map();
for (const l of lines) {
  const [cat, title, author] = l.split('|');
  if (!byCat.has(cat)) byCat.set(cat, []);
  byCat.get(cat).push({ title: title.trim(), author: author.trim() });
}
mkdirSync('content/batches', { recursive: true });
const manifest = [];
for (const [cat, books] of byCat) {
  const chunks = Math.ceil(books.length / BATCH);
  const size = Math.ceil(books.length / chunks);
  for (let i = 0; i < chunks; i++) {
    const slice = books.slice(i * size, (i + 1) * size);
    if (!slice.length) continue;
    const name = chunks > 1 ? `${cat}-${i + 1}` : cat;
    writeFileSync(`content/batches/${name}.json`, JSON.stringify({ batch: name, category: cat, books: slice }, null, 2) + '\n');
    manifest.push({ name, category: cat, count: slice.length });
  }
}
writeFileSync('content/batches/manifest.json', JSON.stringify(manifest, null, 2) + '\n');
console.log(`${manifest.length} batches · ${manifest.reduce((n, m) => n + m.count, 0)} books`);
console.log(manifest.map((m) => `${m.name}(${m.count})`).join(' '));
