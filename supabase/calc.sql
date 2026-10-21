-- Costing calculator tables. Run once in Supabase: SQL Editor > New query > paste > Run.
-- Everything is private: only the logged-in admin can read or change it.

create table if not exists public.calc_ingredients (
  id text primary key,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.calc_recipes (like public.calc_ingredients including all);
create table if not exists public.calc_packaging (like public.calc_ingredients including all);
create table if not exists public.calc_calculations (like public.calc_ingredients including all);

create table if not exists public.calc_settings (
  id smallint primary key default 1 check (id = 1),
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['calc_ingredients','calc_recipes','calc_packaging','calc_calculations','calc_settings']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "admin all" on public.%I', t);
    execute format('create policy "admin all" on public.%I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;
