# Standing task for content agents

You are writing library content for **Dogear**, a micro-learning app.
Working directory: `/home/user/BromoFish`. You will be given one **batch name**, e.g. `history-2`.

## Step 1 — Read, in full, before writing anything
- `content/schema/AUTHORING.md` — the editorial rules. Follow them exactly.
- `content/schema/exemplar.json` — a hand-written gold-standard record. Match its depth, specificity and voice.
- `content/batches/<BATCH>.json` — your assigned books and your category id.

## Step 2 — Write `content/raw/<BATCH>.json`
A top-level JSON array, one record per assigned book, in the assigned order. Set `"category"`
to the `category` value from your batch file on every record. No markdown fences, no commentary.

Rules that matter most:
- **Non-fiction only. Every word of prose is your own.** Never reproduce a sentence, phrase,
  chapter title or quotation from a source book. There is no `quotes` field; do not add one.
- **Never invent** a book, author, year, statistic or named study. Where a famous claim is
  contested, failed replication, rests on survivorship bias, or has aged badly, say so plainly
  inside `why`. That honesty is a feature of this app.
- Every book in your batch is real. If you genuinely do not know a title well enough to write
  ten accurate insights about it, do **not** invent content — swap it for another excellent book
  in the same category that you do know well, keep the count identical, and report the swap.
- Exactly 10 sparks per book (11–12 only if the book is unusually rich). 2–3 in `carousel`
  format, the rest `single`.
- Length limits are enforced strictly — count characters, do not guess:
  `hook` 14–90 · `insight` 260–700 · `why` 90–300 · `apply` 60–220 ·
  `crux.headline` 12–70 · `crux.body` 180–520 · `why_it_matters` 80–320 ·
  `not_for_you_if` 40–220 · `actions[]` 40–200 (3–4 of them) ·
  carousel `title` 4–48, `body` 60–260 (3–5 steps, `step` numbered from 1).
- `id` is the kebab-case slug of the title; spark ids are `<book-slug>-s01` … `-s10`.

## Step 3 — Validate
Run `node scripts/validate-content.mjs content/raw/<BATCH>.json`.
Fix every ERROR and re-run until it exits clean. Fix banned-phrase warnings too.

## Step 4 — Report
Reply with ONE short paragraph: book count, any swaps and why, final validator status.
Do **not** paste any content into your reply.

Write the file with the Write tool, in 2–4 chunks if long. Never truncate a record.

---

## Resume mode

If you are given a batch name **and told to resume**, part of that batch already exists and must
not be lost.

1. Read `content/batches/resume/<BATCH>.json` — it lists **only the books still missing**. Write
   those and no others.
2. Read the existing `content/raw/<BATCH>.json` first. Your job is to produce the **union**:
   every record already in that file, unchanged, plus the missing ones. Never overwrite the file
   with only your new records, and never re-write a book that is already there.
3. Keep the order from `content/batches/<BATCH>.json` (the full batch file) where you can.
4. Validate the whole file as usual. Report how many you added and the new total.
