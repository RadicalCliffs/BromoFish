#!/usr/bin/env node
/**
 * Resolves the same book appearing in two batch files.
 *
 * Agents occasionally drift past their assigned slice, so a title can land in two files. The
 * copy that lives in the batch it was actually assigned to wins; the stray is removed. A
 * legitimate swap — a book an agent substituted deliberately — is never assigned anywhere, so
 * it is left alone unless it collides, in which case the assigned copy still wins.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const norm = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

const assignedTo = new Map();
for (const f of readdirSync('content/batches').filter((n) => n.endsWith('.json') && n !== 'manifest.json')) {
  const batch = JSON.parse(readFileSync(join('content/batches', f), 'utf8'));
  for (const b of batch.books) assignedTo.set(norm(b.title), batch.batch);
}

const files = readdirSync('content/raw').filter((f) => f.endsWith('.json'));
const occurrences = new Map(); // title -> [{ batch, index }]
const loaded = new Map();

for (const f of files) {
  let data;
  try { data = JSON.parse(readFileSync(join('content/raw', f), 'utf8')); } catch { continue; }
  if (!Array.isArray(data)) continue;
  const batch = f.replace(/\.json$/, '');
  loaded.set(batch, data);
  data.forEach((b, i) => {
    const key = norm(b?.title);
    if (!key) return;
    if (!occurrences.has(key)) occurrences.set(key, []);
    occurrences.get(key).push({ batch, index: i });
  });
}

const removals = new Map(); // batch -> Set(index)
let collisions = 0;
for (const [title, places] of occurrences) {
  if (places.length < 2) continue;
  collisions++;
  const home = assignedTo.get(title);
  // Prefer the assigned batch; failing that, keep the first occurrence deterministically.
  const keep = places.find((p) => p.batch === home) ?? places[0];
  for (const p of places) {
    if (p === keep) continue;
    if (!removals.has(p.batch)) removals.set(p.batch, new Set());
    removals.get(p.batch).add(p.index);
    console.log(`"${loaded.get(p.batch)[p.index].title}" removed from ${p.batch} (belongs to ${home ?? keep.batch})`);
  }
}

for (const [batch, indexes] of removals) {
  const kept = loaded.get(batch).filter((_, i) => !indexes.has(i));
  writeFileSync(join('content/raw', `${batch}.json`), JSON.stringify(kept, null, 2) + '\n');
}

console.log(
  collisions
    ? `\nResolved ${collisions} cross-batch collision(s) across ${removals.size} file(s).`
    : '\nNo cross-batch duplicates.'
);
