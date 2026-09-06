import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, mkdirSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const run = (script, args = [], cwd = process.cwd()) => {
  try {
    return { code: 0, out: execFileSync('node', [script, ...args], { cwd, encoding: 'utf8' }) };
  } catch (e) {
    return { code: e.status ?? 1, out: `${e.stdout ?? ''}${e.stderr ?? ''}` };
  }
};

/** A sandbox with the schema files and a content/raw the test controls. */
const sandbox = () => {
  const dir = mkdtempSync(join(tmpdir(), 'dogear-'));
  mkdirSync(join(dir, 'content/raw'), { recursive: true });
  mkdirSync(join(dir, 'scripts'), { recursive: true });
  cpSync('content/schema', join(dir, 'content/schema'), { recursive: true });
  for (const s of ['validate-content.mjs', 'build-content.mjs', 'gen-seed-sql.mjs', 'salvage-partial.mjs']) {
    cpSync(join('scripts', s), join(dir, 'scripts', s));
  }
  return dir;
};

const exemplar = () => JSON.parse(readFileSync('content/schema/exemplar.json', 'utf8'));

test('the exemplar passes its own validator', () => {
  const dir = sandbox();
  writeFileSync(join(dir, 'content/raw/gold.json'), JSON.stringify(exemplar()));
  const { code, out } = run('scripts/validate-content.mjs', [], dir);
  assert.equal(code, 0, out);
  assert.match(out, /0 errors/);
  rmSync(dir, { recursive: true, force: true });
});

test('validator rejects a record that is missing sparks', () => {
  const dir = sandbox();
  const [book] = exemplar();
  writeFileSync(join(dir, 'content/raw/bad.json'), JSON.stringify([{ ...book, sparks: book.sparks.slice(0, 3) }]));
  const { code, out } = run('scripts/validate-content.mjs', [], dir);
  assert.equal(code, 1);
  assert.match(out, /3 sparks, need 10-12/);
  rmSync(dir, { recursive: true, force: true });
});

test('validator rejects an over-length insight', () => {
  const dir = sandbox();
  const [book] = exemplar();
  const sparks = book.sparks.map((s, i) => (i === 0 ? { ...s, insight: 'x'.repeat(900) } : s));
  writeFileSync(join(dir, 'content/raw/long.json'), JSON.stringify([{ ...book, sparks }]));
  const { code, out } = run('scripts/validate-content.mjs', [], dir);
  assert.equal(code, 1);
  assert.match(out, /"insight" length 900 outside 260-700/);
  rmSync(dir, { recursive: true, force: true });
});

test('validator rejects a carousel with no steps and a quotes field', () => {
  const dir = sandbox();
  const [book] = exemplar();
  const sparks = book.sparks.map((s, i) => (i === 1 ? { ...s, format: 'carousel' } : s));
  writeFileSync(join(dir, 'content/raw/x.json'), JSON.stringify([{ ...book, sparks, quotes: ['verbatim'] }]));
  const { code, out } = run('scripts/validate-content.mjs', [], dir);
  assert.equal(code, 1);
  assert.match(out, /carousel format needs 3-5 steps/);
  assert.match(out, /verbatim text is not allowed/);
  rmSync(dir, { recursive: true, force: true });
});

test('validator catches a duplicate id across two batch files', () => {
  const dir = sandbox();
  writeFileSync(join(dir, 'content/raw/a.json'), JSON.stringify(exemplar()));
  const [book] = exemplar();
  writeFileSync(join(dir, 'content/raw/b.json'), JSON.stringify([{ ...book, title: 'A Different Title' }]));
  const { code, out } = run('scripts/validate-content.mjs', [], dir);
  assert.equal(code, 1);
  assert.match(out, /duplicate id "atomic-habits"/);
  rmSync(dir, { recursive: true, force: true });
});

test('build drops low-confidence records and prunes dangling related links', () => {
  const dir = sandbox();
  const [book] = exemplar();
  const shaky = {
    ...book,
    id: 'shaky-book',
    title: 'Shaky Book',
    sparks: book.sparks.map((s, i) => ({ ...s, id: `shaky-book-s${String(i + 1).padStart(2, '0')}` })),
    verification: { ...book.verification, confidence: 'low' },
  };
  writeFileSync(join(dir, 'content/raw/a.json'), JSON.stringify([book, shaky]));
  const { code, out } = run('scripts/build-content.mjs', [], dir);
  assert.equal(code, 0, out);

  const lib = JSON.parse(readFileSync(join(dir, 'content/dist/library.json'), 'utf8'));
  assert.equal(lib.books.length, 1, 'the low-confidence record should not ship');
  assert.equal(lib.counts.books, 1);
  // The exemplar links to books that are not in this tiny library, so all links should go.
  assert.deepEqual(lib.books[0].if_you_liked, []);
  rmSync(dir, { recursive: true, force: true });
});

test('build keeps the first of two records with the same title', () => {
  const dir = sandbox();
  const [book] = exemplar();
  const twin = {
    ...book,
    id: 'atomic-habits-again',
    sparks: book.sparks.map((s, i) => ({ ...s, id: `atomic-habits-again-s${String(i + 1).padStart(2, '0')}` })),
  };
  writeFileSync(join(dir, 'content/raw/a.json'), JSON.stringify([book]));
  writeFileSync(join(dir, 'content/raw/b.json'), JSON.stringify([twin]));
  const { out } = run('scripts/build-content.mjs', [], dir);
  const lib = JSON.parse(readFileSync(join(dir, 'content/dist/library.json'), 'utf8'));
  assert.equal(lib.books.length, 1);
  assert.equal(lib.books[0].id, 'atomic-habits');
  assert.match(out, /duplicate of atomic-habits/);
  rmSync(dir, { recursive: true, force: true });
});

test('seed sql escapes apostrophes rather than breaking the statement', () => {
  const dir = sandbox();
  mkdirSync(join(dir, 'supabase'), { recursive: true });
  const [book] = exemplar();
  const tricky = {
    ...book,
    title: "Don't Make Me Think",
    id: 'dont-make-me-think',
    sparks: book.sparks.map((s, i) => ({
      ...s,
      id: `dont-make-me-think-s${String(i + 1).padStart(2, '0')}`,
      hook: i === 0 ? "It's a user's job to wonder — not to figure it out" : s.hook,
    })),
  };
  writeFileSync(join(dir, 'content/raw/a.json'), JSON.stringify([tricky]));
  run('scripts/build-content.mjs', [], dir);
  const { code, out } = run('scripts/gen-seed-sql.mjs', [], dir);
  assert.equal(code, 0, out);

  const sql = readFileSync(join(dir, 'supabase/seed.sql'), 'utf8');
  assert.match(sql, /'Don''t Make Me Think'/);
  assert.match(sql, /It''s a user''s job/);
  assert.match(sql, /^begin;$/m);
  assert.match(sql, /^commit;$/m);
  // Every statement that opens a string must close it: an odd count means a broken escape.
  const quotes = (sql.match(/'/g) ?? []).length;
  assert.equal(quotes % 2, 0, 'unbalanced quotes in generated SQL');
  rmSync(dir, { recursive: true, force: true });
});

test('salvage recovers whole records from a file truncated mid-write', () => {
  const dir = sandbox();
  const [book] = exemplar();
  const second = {
    ...book,
    id: 'second-book',
    title: 'Second Book',
    sparks: book.sparks.map((s, i) => ({ ...s, id: `second-book-s${String(i + 1).padStart(2, '0')}` })),
  };
  // Simulate an agent killed part-way through writing the third record.
  const whole = JSON.stringify([book, second], null, 2);
  const truncated = whole.slice(0, whole.lastIndexOf(']')) + ',\n  { "id": "third-book", "title": "Third';
  const target = join(dir, 'content/raw/cut.json');
  writeFileSync(target, truncated);

  assert.throws(() => JSON.parse(readFileSync(target, 'utf8')), 'the fixture should start out unparseable');

  const { code, out } = run('scripts/salvage-partial.mjs', [], dir);
  assert.equal(code, 0, out);

  const recovered = JSON.parse(readFileSync(target, 'utf8'));
  assert.equal(recovered.length, 2);
  assert.deepEqual(recovered.map((b) => b.id), ['atomic-habits', 'second-book']);
  assert.equal(recovered[1].sparks.length, 10, 'a recovered record must keep all its sparks');
  rmSync(dir, { recursive: true, force: true });
});

test('salvage drops a record whose own JSON is malformed rather than guessing', () => {
  const dir = sandbox();
  const [book] = exemplar();
  const target = join(dir, 'content/raw/messy.json');
  // A structurally balanced but invalid object, followed by a good one.
  writeFileSync(target, `[\n  { "id": "broken", "title": }, \n  ${JSON.stringify(book)}\n`);
  run('scripts/salvage-partial.mjs', [], dir);
  const recovered = JSON.parse(readFileSync(target, 'utf8'));
  assert.equal(recovered.length, 1);
  assert.equal(recovered[0].id, 'atomic-habits');
  rmSync(dir, { recursive: true, force: true });
});

test('duplicate detection fails the build on two identical hooks in one book', () => {
  const dir = sandbox();
  cpSync('scripts/find-duplicates.mjs', join(dir, 'scripts/find-duplicates.mjs'));
  const [book] = exemplar();
  const sparks = book.sparks.map((s, i) => (i === 4 ? { ...s, hook: book.sparks[0].hook } : s));
  writeFileSync(join(dir, 'content/raw/dupe.json'), JSON.stringify([{ ...book, sparks }]));
  const { code, out } = run('scripts/find-duplicates.mjs', ['--threshold', '0.45'], dir);
  assert.equal(code, 1, out);
  assert.match(out, /SAME BOOK/);
  rmSync(dir, { recursive: true, force: true });
});

test('duplicate detection tolerates the same idea appearing in two different books', () => {
  const dir = sandbox();
  cpSync('scripts/find-duplicates.mjs', join(dir, 'scripts/find-duplicates.mjs'));
  const [book] = exemplar();
  const twin = {
    ...book,
    id: 'other-book',
    title: 'Other Book',
    sparks: book.sparks.map((s, i) => ({ ...s, id: `other-book-s${String(i + 1).padStart(2, '0')}` })),
  };
  writeFileSync(join(dir, 'content/raw/a.json'), JSON.stringify([book, twin]));
  const { code, out } = run('scripts/find-duplicates.mjs', ['--threshold', '0.45'], dir);
  // Reported for review, but not a build failure — two books can share a genuine idea.
  assert.equal(code, 0, out);
  assert.match(out, /near-duplicate pair/);
  rmSync(dir, { recursive: true, force: true });
});
