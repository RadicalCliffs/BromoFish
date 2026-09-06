-- Row level security.
--
-- The rule is simple and worth stating once: the library is world-readable, and every row that
-- belongs to a person is readable and writable only by that person. Nothing here grants a
-- client the ability to write library content — that is the seed script's job, run with the
-- service role.

alter table public.categories  enable row level security;
alter table public.books       enable row level security;
alter table public.sparks      enable row level security;
alter table public.profiles    enable row level security;
alter table public.saved_sparks enable row level security;
alter table public.spark_views enable row level security;

-- --- Library: readable by anyone, including signed-out browsing ---------------

drop policy if exists "categories are public" on public.categories;
create policy "categories are public"
  on public.categories for select
  to anon, authenticated
  using (true);

drop policy if exists "books are public" on public.books;
create policy "books are public"
  on public.books for select
  to anon, authenticated
  using (true);

drop policy if exists "sparks are public" on public.sparks;
create policy "sparks are public"
  on public.sparks for select
  to anon, authenticated
  using (true);

-- --- Profiles ----------------------------------------------------------------

-- Handles and display names are meant to be discoverable; email never lives in this table, so
-- a public select here exposes nothing private.
drop policy if exists "profiles are readable" on public.profiles;
create policy "profiles are readable"
  on public.profiles for select
  to anon, authenticated
  using (true);

drop policy if exists "own profile is writable" on public.profiles;
create policy "own profile is writable"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Insert is normally handled by the sign-up trigger; this covers a client that gets ahead of it.
drop policy if exists "own profile can be created" on public.profiles;
create policy "own profile can be created"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- --- Saves and views: strictly private ---------------------------------------

drop policy if exists "own saves are readable" on public.saved_sparks;
create policy "own saves are readable"
  on public.saved_sparks for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "own saves are writable" on public.saved_sparks;
create policy "own saves are writable"
  on public.saved_sparks for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "own saves are updatable" on public.saved_sparks;
create policy "own saves are updatable"
  on public.saved_sparks for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "own saves are deletable" on public.saved_sparks;
create policy "own saves are deletable"
  on public.saved_sparks for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "own views are readable" on public.spark_views;
create policy "own views are readable"
  on public.spark_views for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "own views are writable" on public.spark_views;
create policy "own views are writable"
  on public.spark_views for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "own views are updatable" on public.spark_views;
create policy "own views are updatable"
  on public.spark_views for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
