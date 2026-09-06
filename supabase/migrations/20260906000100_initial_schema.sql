-- Dogear — initial schema
--
-- Two halves. The content library (categories, books, sparks) is public, read-only to every
-- client and written only by the seed script. Everything user-owned (profiles, saves, views)
-- is protected by row level security so a client key can never read another person's rows.
--
-- Apply with:  supabase db push     (or paste into the SQL editor, in filename order)

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Content library
-- ---------------------------------------------------------------------------

create table if not exists public.categories (
  id            text primary key,
  label         text        not null,
  short         text        not null,
  blurb         text        not null,
  accent        text        not null,
  foreground    text        not null,
  tint          text        not null,
  tint_dark     text        not null,
  sort_order    integer     not null default 0
);

create table if not exists public.books (
  id              text primary key,
  title           text        not null,
  subtitle        text,
  author          text        not null,
  year            integer     not null,
  category_id     text        not null references public.categories (id) on delete restrict,
  subcategory     text,
  tags            text[]      not null default '{}',
  difficulty      text        not null check (difficulty in ('easy', 'moderate', 'challenging')),
  read_time_min   integer     not null default 10,
  why_it_matters  text        not null,
  crux_headline   text        not null,
  crux_body       text        not null,
  actions         text[]      not null default '{}',
  if_you_liked    text[]      not null default '{}',
  not_for_you_if  text        not null,
  -- Kept so the app can show, and a reviewer can audit, how sure we are about a record.
  confidence      text        not null default 'high' check (confidence in ('high', 'medium', 'low')),
  verification_notes text,
  created_at      timestamptz not null default now()
);

create index if not exists books_category_idx on public.books (category_id);
create index if not exists books_tags_idx     on public.books using gin (tags);
create index if not exists books_year_idx     on public.books (year desc);

create table if not exists public.sparks (
  id          text primary key,
  book_id     text        not null references public.books (id) on delete cascade,
  position    integer     not null,
  hook        text        not null,
  insight     text        not null,
  why         text        not null,
  apply       text        not null,
  format      text        not null check (format in ('single', 'carousel')),
  -- [{ step, title, body }] for carousels, null otherwise.
  carousel    jsonb,
  tags        text[]      not null default '{}',
  unique (book_id, position)
);

create index if not exists sparks_book_idx on public.sparks (book_id);
create index if not exists sparks_tags_idx on public.sparks using gin (tags);

-- Full-text search across the whole library, so search does not have to ship to the client.
alter table public.books
  add column if not exists search_vector tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(author, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(crux_headline, '')), 'B') ||
    setweight(to_tsvector('english', array_to_string(tags, ' ')), 'C')
  ) stored;

create index if not exists books_search_idx on public.books using gin (search_vector);

-- ---------------------------------------------------------------------------
-- User data
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id             uuid        primary key references auth.users (id) on delete cascade,
  handle         text        not null unique check (handle ~ '^[a-z0-9_]{3,18}$'),
  display_name   text        not null check (char_length(display_name) between 2 and 40),
  bio            text        not null default '' check (char_length(bio) <= 160),
  avatar_url     text,
  interests      text[]      not null default '{}',
  daily_goal_min integer     not null default 10 check (daily_goal_min between 1 and 200),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists public.saved_sparks (
  user_id   uuid        not null references public.profiles (id) on delete cascade,
  spark_id  text        not null references public.sparks (id) on delete restrict,
  book_id   text        not null references public.books (id) on delete cascade,
  note      text        check (char_length(note) <= 500),
  saved_at  timestamptz not null default now(),
  primary key (user_id, spark_id)
);

create index if not exists saved_sparks_user_idx on public.saved_sparks (user_id, saved_at desc);

create table if not exists public.spark_views (
  user_id   uuid        not null references public.profiles (id) on delete cascade,
  spark_id  text        not null references public.sparks (id) on delete restrict,
  viewed_at timestamptz not null default now(),
  primary key (user_id, spark_id)
);

create index if not exists spark_views_user_idx on public.spark_views (user_id, viewed_at desc);

-- ---------------------------------------------------------------------------
-- Profile bootstrap
-- ---------------------------------------------------------------------------

-- Derives a unique handle from the display name or email, appending digits on collision so
-- sign-up never fails on a name someone else already took. Uses advisory locks to prevent
-- simultaneous sign-up race conditions.
create or replace function public.unique_handle(seed text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  base      text;
  candidate text;
  n         integer := 0;
  lock_id   integer;
begin
  base := regexp_replace(lower(coalesce(seed, '')), '[^a-z0-9]', '', 'g');
  if char_length(base) < 3 then
    base := 'reader';
  end if;
  base := left(base, 14);

  -- Use an advisory lock to serialize concurrent handle generation attempts
  lock_id := ('x' || md5(base))::bit(32)::integer;
  perform pg_advisory_lock(lock_id);

  begin
    candidate := base;
    while exists (select 1 from public.profiles p where p.handle = candidate) loop
      n := n + 1;
      candidate := left(base, 14) || n::text;
    end loop;
    return candidate;
  ensure
    perform pg_advisory_unlock(lock_id);
  end;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, handle, display_name)
  values (
    new.id,
    public.unique_handle(coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), 'Reader')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();
