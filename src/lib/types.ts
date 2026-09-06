/** Shapes shared by the content pipeline, the local store and the Supabase schema. */

export type Difficulty = 'easy' | 'moderate' | 'challenging';
export type SparkFormat = 'single' | 'carousel';

export interface CarouselStep {
  step: number;
  title: string;
  body: string;
}

export interface Spark {
  id: string;
  hook: string;
  insight: string;
  why: string;
  apply: string;
  format: SparkFormat;
  carousel?: CarouselStep[];
  tags: string[];
}

export interface Book {
  id: string;
  title: string;
  subtitle?: string | null;
  author: string;
  year: number;
  category: string;
  subcategory?: string;
  tags: string[];
  difficulty: Difficulty;
  read_time_min?: number;
  why_it_matters: string;
  crux: { headline: string; body: string };
  sparks: Spark[];
  actions: string[];
  if_you_liked?: string[];
  not_for_you_if: string;
  verification: {
    author_verified: boolean;
    year_verified: boolean;
    confidence: 'high' | 'medium' | 'low';
    notes?: string | null;
  };
}

export interface Category {
  id: string;
  label: string;
  short: string;
  blurb: string;
  target: number;
  accent: string;
  accentHsl: string;
  foreground: string;
  contrast: number;
  onInkContrast: number;
  tint: string;
  tintDark: string;
}

/** A spark flattened with its book context — what the feed actually renders. */
export interface FeedItem {
  spark: Spark;
  bookId: string;
  title: string;
  author: string;
  year: number;
  category: string;
  difficulty: Difficulty;
  crux: string;
  /** Position of this spark within its book, 1-indexed. */
  index: number;
  total: number;
}

export interface Profile {
  id: string;
  handle: string;
  display_name: string;
  bio: string;
  avatar_url: string | null;
  interests: string[];
  created_at: string;
  /** Minutes per day the user said they want. Drives the daily goal ring. */
  daily_goal_min: number;
}

export interface SavedSpark {
  spark_id: string;
  book_id: string;
  saved_at: string;
  note?: string;
}
