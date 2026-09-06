# Dogear — Spark Notes Authoring Brief

You are writing the content library for **Dogear**, a micro-learning app. A user swipes
vertically through full-screen cards. Each card is one *spark* — one idea from one great
book, understandable in 15 seconds, useful in 15 minutes.

## Non-negotiable rules

1. **Every word is original.** Write abstractive summaries in your own prose. **Never**
   reproduce sentences, phrases, headings, chapter titles, list items, or quotations from
   the source book. No "quotes" field exists — do not add one. If you cannot express an
   idea without borrowing the author's wording, express a different idea.
2. **Only books you actually know.** If you are not confident the book exists with that
   author and approximate year, set `verification.confidence` to `"medium"` or drop the
   book entirely and replace it with one you know well. Never invent a book, an author, a
   subtitle, or a statistic. A short library of true records beats a long one with fiction in it.
3. **No fabricated specifics.** Do not invent study sample sizes, percentages, dates, or
   named experiments. If you know a finding is contested or failed replication (e.g. ego
   depletion, power posing, the marshmallow test), say so plainly inside `why` — that
   honesty is a feature of this app, not a flaw.
4. **Second person, present tense, plain words.** Write to one reader: "you". Short
   sentences. No "In this book, the author argues…" — state the idea directly as the app's
   own voice. No em-dash-heavy prose, no "delve", "unlock", "game-changer", "in today's
   fast-paced world".
5. **A spark is a claim, not a topic.** "Habits are important" is a topic. "You do not rise
   to your goals, you fall to the level of the systems you have built" is a claim. Always
   write the claim.

## Field-by-field

| Field | What it is |
|---|---|
| `id` | kebab-case slug of the title. Strip articles only if the title is unwieldy. Must be globally unique. |
| `title` / `subtitle` / `author` / `year` | Bibliographic truth. `year` = first publication. `subtitle` may be `null`. |
| `category` | Exactly the category slug you were assigned. |
| `subcategory` | A tighter 1–3 word grouping you choose, e.g. `habit-formation`, `behavioural-economics`. Reuse them consistently within your batch. |
| `tags` | 3–8 kebab-case topic tags. These drive interest-based feed curation, so use tags a *user* would pick, not academic ones. |
| `difficulty` | `easy` (anyone), `moderate` (some effort), `challenging` (dense/technical). |
| `read_time_min` | Honest minutes to read all sparks. 8–14 is typical. |
| `why_it_matters` | 1–2 sentences on why this book earns a place in a library of 500. What changed because of it. |
| `crux.headline` | ≤70 chars. The single biggest idea, as a punchy line. |
| `crux.body` | 40–75 words. The one thing to take away if you read nothing else. |
| `sparks` | Exactly 10 (11–12 allowed for unusually rich books). Ordered so spark 1 is the most arresting. |
| `sparks[].hook` | ≤90 chars. The scroll-stopper — a question, a reversal, a counter-intuitive statement. It must be *true*, not clickbait. Never end with "…here's why". |
| `sparks[].insight` | 55–100 words. The idea itself, explained so a smart 15-year-old gets it. Concrete over abstract. |
| `sparks[].why` | 20–40 words. Why it holds — the mechanism, the evidence, or the honest caveat. |
| `sparks[].apply` | 15–35 words. One thing to do, specific enough to do today. Starts with a verb. |
| `sparks[].format` | `carousel` when the idea is genuinely a sequence of 3–5 steps; otherwise `single`. **Aim for 2–3 carousels per book, no more.** A carousel that isn't really steps is worse than a single. |
| `sparks[].carousel` | Present *only* when `format` is `carousel`. 3–5 steps, each with a short imperative `title` and a 15–40 word `body`. The `insight` still stands alone above it. |
| `actions` | 3–4 concrete things to do after finishing the book, each a full instruction. |
| `if_you_liked` | 2–4 slugs of related books. Best-effort; broken links are pruned automatically later. |
| `not_for_you_if` | 10–30 words, honest. Who should skip this book. |
| `verification` | Your own confidence check. `notes` can flag a contested claim, a disputed authorship, or a later edition. |

## Selection standard

You are picking for a library of the **best books ever**, not a bestseller list. Balance:

- ~55% canonical, genuinely influential titles in the category
- ~25% excellent but less-obvious picks a well-read person would nod at
- ~20% modern (post-2015) work that has held up

Spread across decades and across the world — do not fill a category with 20 American
business books from the last ten years. Include women and non-Western authors because the
best-of list genuinely includes them, and never at the cost of the quality bar.
No duplicate titles inside your batch.

## Output

Write **one JSON file** to the exact path you were given: a top-level array of book objects.
Nothing else — no markdown fences, no commentary. Validate mentally against
`content/schema/book.schema.json`; string length limits are enforced by CI and a record that
busts them is dropped. Write the file in 2–4 appends if it is long; never truncate a record.
