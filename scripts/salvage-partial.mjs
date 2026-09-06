#!/usr/bin/env node
/**
 * Recovers complete book records from a batch file that was truncated mid-write.
 *
 * An agent killed part-way through a Write leaves a JSON array with a half-finished object at
 * the end. Rather than discarding the whole file, this walks the text with a brace/bracket
 * depth counter (string- and escape-aware) and keeps every object that closed cleanly.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const salvage = (text) => {
  const start = text.indexOf('[');
  if (start === -1) return [];
  let depth = 0;
  let objStart = -1;
  let inString = false;
  let escaped = false;
  const objects = [];

  for (let i = start + 1; i < text.length; i++) {
    const ch = text[i];
    if (escaped) { escaped = false; continue; }
    if (ch === '\\') { if (inString) escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;

    if (ch === '{') {
      if (depth === 0) objStart = i;
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0 && objStart !== -1) {
        const slice = text.slice(objStart, i + 1);
        try {
          objects.push(JSON.parse(slice));
        } catch {
          // A record that will not parse on its own is not worth guessing at.
        }
        objStart = -1;
      }
    }
  }
  return objects;
};

const files = process.argv.slice(2);
const targets = files.length
  ? files
  : readdirSync('content/raw').filter((f) => f.endsWith('.json')).map((f) => join('content/raw', f));

let repaired = 0;
for (const file of targets) {
  const text = readFileSync(file, 'utf8');
  try {
    JSON.parse(text);
    continue; // already valid
  } catch {
    // fall through to salvage
  }
  const books = salvage(text);
  const complete = books.filter((b) => b?.id && Array.isArray(b.sparks) && b.sparks.length >= 10);
  writeFileSync(file, JSON.stringify(complete, null, 2) + '\n');
  repaired++;
  console.log(
    `${file}: recovered ${complete.length} complete record(s)` +
      (books.length > complete.length ? `, dropped ${books.length - complete.length} partial` : '') +
      (complete.length ? ` — ${complete.map((b) => b.title).join(', ')}` : '')
  );
}
if (!repaired) console.log('No truncated files found.');
