import raw from '../data/library.json';
import type { Book, Category, FeedItem, Spark } from './types';

interface Library {
  version: number;
  generated_at: string;
  counts: { books: number; sparks: number; carousels: number; categories: number };
  categories: Category[];
  books: Book[];
}

const library = raw as unknown as Library;

export const categories: Category[] = library.categories;
export const books: Book[] = library.books;
export const libraryCounts = library.counts;

const byId = new Map(books.map((b) => [b.id, b]));
const categoryById = new Map(categories.map((c) => [c.id, c]));

export const getBook = (id: string): Book | undefined => byId.get(id);
export const getCategory = (id: string): Category | undefined => categoryById.get(id);

/** Books, grouped by category, in taxonomy order. Empty categories are omitted. */
export function booksByCategory(): { category: Category; books: Book[] }[] {
  return categories
    .map((category) => ({ category, books: books.filter((b) => b.category === category.id) }))
    .filter((g) => g.books.length > 0);
}

export function toFeedItem(book: Book, spark: Spark, index: number): FeedItem {
  return {
    spark,
    bookId: book.id,
    title: book.title,
    author: book.author,
    year: book.year,
    category: book.category,
    difficulty: book.difficulty,
    crux: book.crux.headline,
    index: index + 1,
    total: book.sparks.length,
  };
}

export function bookFeed(book: Book): FeedItem[] {
  return book.sparks.map((s, i) => toFeedItem(book, s, i));
}

/** Deterministic 32-bit hash, so a given user sees a stable shuffle across sessions. */
function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32 — small, fast, good enough for shuffling a feed. */
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface FeedOptions {
  /** Category ids and tags the user picked at onboarding. */
  interests: string[];
  /** Stable per-user seed — the profile id, or a device id for signed-out browsing. */
  seed: string;
  /** Spark ids already seen; they sink to the end rather than disappearing. */
  seen?: string[];
  /** Restrict to a single category. */
  category?: string;
  limit?: number;
}

/**
 * Builds the vertical feed.
 *
 * Three things matter and they pull against each other: the feed should reflect what the user
 * said they care about, it should not be so narrow that they never discover anything, and two
 * adjacent cards should never come from the same book. So we score, shuffle within score bands,
 * then do a final pass that pushes same-book neighbours apart.
 */
export function buildFeed({ interests, seed, seen = [], category, limit = 400 }: FeedOptions): FeedItem[] {
  const interestSet = new Set(interests);
  const seenSet = new Set(seen);
  const random = rng(hash(seed));

  const pool = (category ? books.filter((b) => b.category === category) : books).flatMap((book) =>
    book.sparks.map((spark, i) => {
      const categoryMatch = interestSet.has(book.category) ? 3 : 0;
      const tagMatch = book.tags.reduce((n, t) => n + (interestSet.has(t) ? 1 : 0), 0);
      const sparkTagMatch = spark.tags.reduce((n, t) => n + (interestSet.has(t) ? 1 : 0), 0);
      // Opening sparks are the strongest, so they get a small lift — this is what makes the
      // first screens of a cold feed feel curated rather than random.
      const openerBonus = i === 0 ? 1.2 : i < 3 ? 0.5 : 0;
      const noise = random() * 1.5;
      const seenPenalty = seenSet.has(spark.id) ? -100 : 0;
      return {
        item: toFeedItem(book, spark, i),
        score: categoryMatch + tagMatch * 1.5 + sparkTagMatch * 1.2 + openerBonus + noise + seenPenalty,
      };
    })
  );

  pool.sort((a, b) => b.score - a.score);
  const ranked = pool.slice(0, limit).map((p) => p.item);

  // Spread same-book neighbours: walk forward and swap a colliding card with the next card
  // that comes from a different book. Bounded lookahead keeps this linear in practice.
  for (let i = 1; i < ranked.length; i++) {
    if (ranked[i].bookId !== ranked[i - 1].bookId) continue;
    for (let j = i + 1; j < Math.min(i + 8, ranked.length); j++) {
      if (ranked[j].bookId !== ranked[i - 1].bookId) {
        [ranked[i], ranked[j]] = [ranked[j], ranked[i]];
        break;
      }
    }
  }

  return ranked;
}

/** Free-text search over titles, authors, hooks and tags. */
export function search(query: string, limit = 40): Book[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const terms = q.split(/\s+/);
  const scored = books
    .map((book) => {
      const haystack = `${book.title} ${book.author} ${book.tags.join(' ')} ${book.crux.headline}`.toLowerCase();
      let score = 0;
      for (const t of terms) {
        if (book.title.toLowerCase().startsWith(t)) score += 6;
        else if (book.title.toLowerCase().includes(t)) score += 4;
        if (book.author.toLowerCase().includes(t)) score += 3;
        if (book.tags.some((tag) => tag.includes(t))) score += 2;
        else if (haystack.includes(t)) score += 1;
      }
      return { book, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.book);
}

/** Every distinct tag, most common first — used to build the interest picker. */
export function topTags(limit = 60): string[] {
  const counts = new Map<string, number>();
  for (const b of books) for (const t of b.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([t]) => t);
}
