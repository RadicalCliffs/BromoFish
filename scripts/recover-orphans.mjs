#!/usr/bin/env node
/**
 * Recovers book records left behind in a scratch directory by agents that were interrupted.
 *
 * Content authoring is expensive, so a record that was fully written but never made it into
 * content/raw is worth rescuing. Each recovered book is matched back to its assigned batch by
 * title, deduplicated against what already shipped, and appended to the right batch file.
 *
 * Usage: node scripts/recover-orphans.mjs <scratch-dir>
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const scratch = process.argv[2];
if (!scratch || !existsSync(scratch)) {
  console.error('Usage: node scripts/recover-orphans.mjs <scratch-dir>');
  process.exit(1);
}

const norm = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

/** Brace-depth scan that tolerates a file truncated mid-object. */
const salvage = (text) => {
  let depth = 0, objStart = -1, inString = false, escaped = false;
  const out = [];
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (escaped) { escaped = false; continue; }
    if (ch === '\\') { if (inString) escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') { if (depth === 0) objStart = i; depth++; }
    else if (ch === '}') {
      depth--;
      if (depth === 0 && objStart !== -1) {
        try { out.push(JSON.parse(text.slice(objStart, i + 1))); } catch { /* not a whole record */ }
        objStart = -1;
      }
    }
  }
  return out;
};

const walk = (dir, acc = []) => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    let st;
    try { st = statSync(full); } catch { continue; }
    if (st.isDirectory()) {
      if (entry === 'node_modules' || entry === 'webbuild') continue;
      walk(full, acc);
    } else if (entry.endsWith('.json')) {
      acc.push(full);
    }
  }
  return acc;
};

// Where each assigned title belongs.
const batchOf = new Map();
for (const f of readdirSync('content/batches')) {
  if (f === 'manifest.json' || !f.endsWith('.json')) continue;
  const batch = JSON.parse(readFileSync(join('content/batches', f), 'utf8'));
  for (const b of batch.books) batchOf.set(norm(b.title), { batch: batch.batch, category: batch.category });
}

// What already shipped, so recovery never duplicates.
const shipped = new Map();
for (const f of readdirSync('content/raw').filter((n) => n.endsWith('.json'))) {
  let data;
  try { data = JSON.parse(readFileSync(join('content/raw', f), 'utf8')); } catch { continue; }
  if (Array.isArray(data)) for (const b of data) shipped.set(norm(b?.title), f);
}

const isComplete = (b) =>
  b?.id && b?.title && b?.author && b?.crux?.headline && Array.isArray(b.sparks) && b.sparks.length >= 10 &&
  b.sparks.every((s) => s?.hook && s?.insight && s?.why && s?.apply && s?.format);

const recovered = new Map(); // batch -> books[]
const unmatched = [];
const seen = new Set();

for (const file of walk(scratch)) {
  let text;
  try { text = readFileSync(file, 'utf8'); } catch { continue; }
  if (!text.includes('"sparks"')) continue;
  for (const book of salvage(text)) {
    if (!isComplete(book)) continue;
    const key = norm(book.title);
    if (seen.has(key) || shipped.has(key)) continue;
    const home = batchOf.get(key);
    if (!home) { unmatched.push(book.title); continue; }
    seen.add(key);
    book.category = home.category;
    if (!recovered.has(home.batch)) recovered.set(home.batch, []);
    recovered.get(home.batch).push(book);
  }
}

let total = 0;
for (const [batch, books] of [...recovered.entries()].sort()) {
  const path = join('content/raw', `${batch}.json`);
  let existing = [];
  if (existsSync(path)) {
    try { existing = JSON.parse(readFileSync(path, 'utf8')); } catch { existing = []; }
  }
  // Keep the assigned order so a partially recovered batch still reads correctly.
  const order = JSON.parse(readFileSync(join('content/batches', `${batch}.json`), 'utf8')).books.map((b) => norm(b.title));
  const merged = [...existing, ...books].sort((a, b) => order.indexOf(norm(a.title)) - order.indexOf(norm(b.title)));
  writeFileSync(path, JSON.stringify(merged, null, 2) + '\n');
  total += books.length;
  console.log(`${batch}: +${books.length} recovered (${books.map((b) => b.title).join(', ')})`);
}

console.log(`\nRecovered ${total} book(s) into ${recovered.size} batch file(s).`);
if (unmatched.length) console.log(`Skipped ${unmatched.length} record(s) with no assigned batch: ${unmatched.join(', ')}`);
