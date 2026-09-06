#!/usr/bin/env node
/**
 * Validates every content/raw/*.json batch against the Dogear book schema plus a set of
 * editorial rules the schema can't express. Exits non-zero if any record is invalid.
 * Usage: node scripts/validate-content.mjs [--quiet] [file...]
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';

const RAW_DIR = 'content/raw';
const CATEGORIES = new Set(
  JSON.parse(readFileSync('content/schema/categories.json', 'utf8')).map((c) => c.id)
);

const DIFFICULTY = new Set(['easy', 'moderate', 'challenging']);
const CONFIDENCE = new Set(['high', 'medium', 'low']);
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// Editorial tripwires. These are style failures, reported as warnings, not hard errors.
const BANNED = [
  'in today\'s fast-paced', 'game-changer', 'game changer', 'delve into', 'unlock the power',
  'the author argues', 'the author explains', 'in this book', 'this book teaches',
  'revolutionize', 'paradigm shift', 'at the end of the day', 'needle-moving',
];

const errors = [];
const warnings = [];
const seenIds = new Map();
const seenTitles = new Map();

const err = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);

function str(where, val, field, min, max, { optional = false, nullable = false } = {}) {
  if (val === undefined) {
    if (!optional) err(where, `missing "${field}"`);
    return;
  }
  if (val === null) {
    if (!nullable) err(where, `"${field}" is null`);
    return;
  }
  if (typeof val !== 'string') return err(where, `"${field}" must be a string`);
  const n = val.trim().length;
  if (n < min || n > max) err(where, `"${field}" length ${n} outside ${min}-${max}`);
  if (/[�]/.test(val)) err(where, `"${field}" contains a replacement character`);
}

function tagList(where, val, field, min, max) {
  if (!Array.isArray(val)) return err(where, `"${field}" must be an array`);
  if (val.length < min || val.length > max) err(where, `"${field}" has ${val.length}, need ${min}-${max}`);
  for (const t of val) if (typeof t !== 'string' || !SLUG.test(t)) err(where, `"${field}" bad tag "${t}"`);
}

function validateBook(book, file, i) {
  const where = `${basename(file)}[${i}] ${book?.title ?? '<untitled>'}`;
  if (!book || typeof book !== 'object' || Array.isArray(book)) return err(where, 'not an object');

  if (typeof book.id !== 'string' || !SLUG.test(book.id)) err(where, `bad id "${book.id}"`);
  else if (seenIds.has(book.id)) err(where, `duplicate id "${book.id}" (also in ${seenIds.get(book.id)})`);
  else seenIds.set(book.id, basename(file));

  str(where, book.title, 'title', 2, 120);
  str(where, book.subtitle, 'subtitle', 2, 180, { optional: true, nullable: true });
  str(where, book.author, 'author', 2, 160);
  str(where, book.subcategory, 'subcategory', 2, 60, { optional: true });
  str(where, book.why_it_matters, 'why_it_matters', 80, 320);
  str(where, book.not_for_you_if, 'not_for_you_if', 40, 220);

  const titleKey = String(book.title ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (titleKey) {
    if (seenTitles.has(titleKey)) err(where, `duplicate title (also in ${seenTitles.get(titleKey)})`);
    else seenTitles.set(titleKey, basename(file));
  }

  if (!Number.isInteger(book.year) || book.year < -600 || book.year > 2026) err(where, `bad year "${book.year}"`);
  if (!CATEGORIES.has(book.category)) err(where, `unknown category "${book.category}"`);
  if (!DIFFICULTY.has(book.difficulty)) err(where, `bad difficulty "${book.difficulty}"`);
  if (book.read_time_min !== undefined && (!Number.isInteger(book.read_time_min) || book.read_time_min < 4 || book.read_time_min > 30))
    err(where, `bad read_time_min "${book.read_time_min}"`);
  tagList(where, book.tags, 'tags', 3, 8);

  if (!book.crux || typeof book.crux !== 'object') err(where, 'missing crux');
  else {
    str(where, book.crux.headline, 'crux.headline', 12, 70);
    str(where, book.crux.body, 'crux.body', 180, 520);
  }

  if (!Array.isArray(book.actions)) err(where, 'missing actions');
  else {
    if (book.actions.length < 3 || book.actions.length > 4) err(where, `actions has ${book.actions.length}, need 3-4`);
    book.actions.forEach((a, k) => str(where, a, `actions[${k}]`, 40, 200));
  }

  if (book.if_you_liked !== undefined) {
    if (!Array.isArray(book.if_you_liked) || book.if_you_liked.length > 4) err(where, 'bad if_you_liked');
    else for (const s of book.if_you_liked) if (!SLUG.test(String(s))) err(where, `if_you_liked bad slug "${s}"`);
  }

  const v = book.verification;
  if (!v || typeof v !== 'object') err(where, 'missing verification');
  else {
    if (typeof v.author_verified !== 'boolean') err(where, 'verification.author_verified must be boolean');
    if (typeof v.year_verified !== 'boolean') err(where, 'verification.year_verified must be boolean');
    if (!CONFIDENCE.has(v.confidence)) err(where, `bad verification.confidence "${v.confidence}"`);
    if (v.confidence === 'low') warn(where, 'confidence is "low" — record will be excluded from the build');
  }

  if (!Array.isArray(book.sparks)) return err(where, 'missing sparks');
  if (book.sparks.length < 10 || book.sparks.length > 12) err(where, `has ${book.sparks.length} sparks, need 10-12`);

  const sparkIds = new Set();
  let carousels = 0;
  book.sparks.forEach((s, k) => {
    const sw = `${where} spark ${k + 1}`;
    if (!s || typeof s !== 'object') return err(sw, 'not an object');
    if (typeof s.id !== 'string' || !/^[a-z0-9-]+-s(0[1-9]|1[0-2])$/.test(s.id)) err(sw, `bad spark id "${s.id}"`);
    else if (sparkIds.has(s.id)) err(sw, `duplicate spark id "${s.id}"`);
    else sparkIds.add(s.id);

    str(sw, s.hook, 'hook', 14, 90);
    str(sw, s.insight, 'insight', 260, 700);
    str(sw, s.why, 'why', 90, 300);
    str(sw, s.apply, 'apply', 60, 220);
    tagList(sw, s.tags, 'tags', 1, 5);

    if (s.format !== 'single' && s.format !== 'carousel') err(sw, `bad format "${s.format}"`);
    if (s.format === 'carousel') {
      carousels++;
      if (!Array.isArray(s.carousel) || s.carousel.length < 3 || s.carousel.length > 5)
        err(sw, 'carousel format needs 3-5 steps');
      else
        s.carousel.forEach((c, j) => {
          const cw = `${sw} step ${j + 1}`;
          if (c?.step !== j + 1) err(cw, `step should be ${j + 1}, got ${c?.step}`);
          str(cw, c?.title, 'title', 4, 48);
          str(cw, c?.body, 'body', 60, 260);
        });
    } else if (s.carousel !== undefined) {
      err(sw, 'carousel present on a "single" spark');
    }
  });
  if (carousels > 4) warn(where, `${carousels} carousels — aim for 2-3`);

  const blob = JSON.stringify(book).toLowerCase();
  for (const phrase of BANNED) if (blob.includes(phrase)) warn(where, `banned phrase "${phrase}"`);
  if (/"quotes?"\s*:/.test(JSON.stringify(book))) err(where, 'contains a quotes field — verbatim text is not allowed');
}

const args = process.argv.slice(2);
const quiet = args.includes('--quiet');
const files = args.filter((a) => !a.startsWith('--'));
const targets = files.length
  ? files
  : existsSync(RAW_DIR)
    ? readdirSync(RAW_DIR).filter((f) => f.endsWith('.json')).map((f) => join(RAW_DIR, f))
    : [];

let bookCount = 0;
let sparkCount = 0;
for (const file of targets) {
  let data;
  try {
    data = JSON.parse(readFileSync(file, 'utf8'));
  } catch (e) {
    err(basename(file), `unparseable JSON — ${e.message}`);
    continue;
  }
  if (!Array.isArray(data)) {
    err(basename(file), 'top level must be an array of books');
    continue;
  }
  data.forEach((b, i) => {
    validateBook(b, file, i);
    bookCount++;
    sparkCount += Array.isArray(b?.sparks) ? b.sparks.length : 0;
  });
}

if (!quiet || errors.length) {
  for (const w of warnings) console.log(`  warn  ${w}`);
  for (const e of errors) console.log(`  ERROR ${e}`);
}
console.log(
  `\n${targets.length} file(s) · ${bookCount} books · ${sparkCount} sparks · ${errors.length} errors · ${warnings.length} warnings`
);
process.exit(errors.length ? 1 : 0);
