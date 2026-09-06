import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

test('every palette pair meets WCAG AA', () => {
  const out = execFileSync('node', ['scripts/check-contrast.mjs'], { encoding: 'utf8' });
  assert.match(out, /All palette pairs meet WCAG AA/);
  assert.doesNotMatch(out, /FAIL/);
});

test('every category accent clears AA against its paired foreground', () => {
  const categories = JSON.parse(readFileSync('content/schema/categories.json', 'utf8'));
  assert.ok(categories.length >= 20, 'the taxonomy should cover a broad library');
  for (const c of categories) {
    assert.ok(c.contrast >= 4.5, `${c.id} accent/foreground is only ${c.contrast}:1`);
    assert.match(c.accent, /^#[0-9A-F]{6}$/);
    assert.ok(c.label && c.short && c.blurb, `${c.id} is missing display copy`);
  }
});

test('category ids are unique and target counts are sane', () => {
  const categories = JSON.parse(readFileSync('content/schema/categories.json', 'utf8'));
  const ids = new Set(categories.map((c) => c.id));
  assert.equal(ids.size, categories.length, 'duplicate category id');
  const total = categories.reduce((n, c) => n + c.target, 0);
  assert.ok(total >= 500, `taxonomy targets only ${total} books`);
});

test('the curated booklist has no duplicate titles and matches the taxonomy', () => {
  const categories = new Set(
    JSON.parse(readFileSync('content/schema/categories.json', 'utf8')).map((c) => c.id)
  );
  const lines = readFileSync('content/schema/booklist.txt', 'utf8').split('\n').filter((l) => l.includes('|'));
  assert.ok(lines.length >= 500, `booklist has only ${lines.length} entries`);

  const titles = new Set();
  for (const line of lines) {
    const [cat, title, author] = line.split('|');
    assert.ok(categories.has(cat), `unknown category "${cat}"`);
    assert.ok(title?.trim().length > 1, `bad title in "${line}"`);
    assert.ok(author?.trim().length > 1, `bad author in "${line}"`);
    const key = title.toLowerCase().replace(/[^a-z0-9]/g, '');
    assert.ok(!titles.has(key), `duplicate title "${title}"`);
    titles.add(key);
  }
});
