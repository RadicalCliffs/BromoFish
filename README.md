<div align="center">

# Dogear

**Fold the bits worth keeping.**

The best books ever written, cut down to the ideas that actually change something.
One insight per screen. Swipe, save the ones that land, use them today.

</div>

---

## What this is

Dogear is a micro-learning app in the shape people already know how to use: a full-screen,
vertically-swiped feed. Every card is one **spark** — a single idea from a single book, written
to be understood in fifteen seconds and used in fifteen minutes.

It is a native mobile app (iOS and Android, via Expo) that also builds to the web from the same
codebase.

### How a spark is built

| Part | What it does |
|---|---|
| **Hook** | The scroll-stopper. True, not clickbait. |
| **Insight** | The idea itself, in about 80 words, concrete over abstract. |
| **Why it holds** | The mechanism, the evidence — or the honest caveat where a famous claim failed to replicate. |
| **Do this** | One specific thing, doable today. |
| **Steps** | Where an idea genuinely is a sequence, the card becomes a swipeable carousel. |

Books also carry a **crux** (the one idea if you read nothing else), three or four concrete
actions, related reading, and a plain statement of who should skip the book.

---

## The library

The content is not scraped and it is not quoted. Every word is written from scratch as an
abstractive summary — no sentence, phrase, chapter title or quotation is reproduced from any
source book. `content/schema/AUTHORING.md` is the editorial standard, and
`scripts/validate-content.mjs` enforces both the schema and the editorial rules in CI.

Two rules do most of the work:

- **Never invent.** No fabricated books, authors, years, statistics or studies.
- **Say when a claim is shaky.** Where a famous finding is contested, failed replication, or
  rests on survivorship bias, the card says so. That honesty is a feature.

Coverage spans 25 categories — self-help, psychology, business, entrepreneurship, leadership,
personal finance, investing, productivity, health, medicine, wellbeing, mindfulness, philosophy,
relationships, culture, politics, history, science, technology, creativity, learning, sport,
how-to, storytelling and biography.

```bash
npm run content:validate   # schema + editorial rules, with duplicate detection
npm run content:build      # compile content/raw/*.json into the shipped library
npm run content:sql        # generate an idempotent Supabase seed
npm run content:all        # all three
```

---

## Running it

```bash
npm install --legacy-peer-deps
npm start          # then press i / a, or scan the QR code with Expo Go
npm run web        # the same app in a browser
npm run build:web  # static export
```

**No configuration is needed.** With no backend set up, the app is fully usable: the whole
library ships in the bundle, and accounts, profiles, interests and saves live on the device.
The auth screens say so plainly rather than implying a security guarantee that does not exist.

### Connecting a real backend

1. Create a free project at [supabase.com](https://supabase.com).
2. Apply `supabase/migrations/*.sql` in filename order (`supabase db push`, or the SQL editor).
3. `npm run content:all`, then run the generated `supabase/seed.sql`.
4. Copy `.env.example` to `.env` and fill in the two `EXPO_PUBLIC_` values.

Nothing else changes. `src/lib/backend/` defines one interface with two implementations, and the
UI never branches on which is active — it only reads `backend.kind` to tell the user honestly
where their data lives.

The schema gives you Postgres tables for the library, `auth`-backed profiles created by trigger,
saved sparks, view history, full-text search, row level security on every user-owned table, and
an avatars storage bucket where writes are locked to each user's own folder.

---

## Accessibility

Treated as a constraint, not a pass at the end.

- Every foreground/background pair in the palette clears **WCAG AA (4.5:1)** for body text, and
  every interactive boundary clears 3:1. `scripts/check-contrast.mjs` asserts this in CI, and it
  has already caught two real regressions.
- All 25 category accents are **generated**, not eyeballed: `scripts/gen-categories.mjs` solves
  each hue's lightness until it passes, and fails the build if it cannot.
- Colour is never the only signal — selected states carry a check glyph, progress rings carry a
  number, carousel steps are numbered in their own text.
- Every control is at least 44×44pt, labelled for screen readers, and the save switch announces
  its state.
- The fold animation respects **reduce motion**; light, dark and system themes are all supported.

---

## Layout

```
app/                 expo-router routes (auth flow, tabs, book, category, reader)
src/components/      the design system and the feed card
src/lib/             types, library loading and feed ranking, session, backends
src/theme/           tokens and the theme provider
content/schema/      the record schema, editorial brief, taxonomy, curated booklist
content/raw/         library source, one file per authoring batch
scripts/             content pipeline, palette generation, contrast check, icon generation
supabase/            migrations and the generated seed
tests/               pipeline and design-system tests (node:test)
```

The app icon, adaptive icon, splash and favicon are **generated** by `scripts/gen-icons.mjs`
rather than checked in as opaque binaries, so the mark cannot drift from the brand.

---

## Roadmap

The feed is built so that the card is a slot. Today a spark renders as a single post or a step
carousel; the intended end state is a short generated video per spark, playing as you land on it,
with the text card as the fallback and the accessible transcript.

## Licence

MIT. See `LICENSE`.
