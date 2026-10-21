-- Run this once in Supabase: SQL Editor > New query > paste > Run.

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  tab text not null check (tab in ('cakes', 'muffins', 'breads', 'specials')),
  name text not null,
  description text not null default '',
  price text not null default '',
  image_url text not null,
  image2_url text,
  aspect text,
  object_position text,
  position integer not null default 0,
  visible boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.menu_items enable row level security;

-- Everyone can read visible items; only the logged-in admin can read hidden ones and change anything.
create policy "public read visible" on public.menu_items
  for select using (visible = true);
create policy "admin read all" on public.menu_items
  for select to authenticated using (true);
create policy "admin insert" on public.menu_items
  for insert to authenticated with check (true);
create policy "admin update" on public.menu_items
  for update to authenticated using (true) with check (true);
create policy "admin delete" on public.menu_items
  for delete to authenticated using (true);

-- Photo storage bucket (public so the website can show the photos).
insert into storage.buckets (id, name, public)
values ('menu-images', 'menu-images', true)
on conflict (id) do nothing;

create policy "public read photos" on storage.objects
  for select using (bucket_id = 'menu-images');
create policy "admin upload photos" on storage.objects
  for insert to authenticated with check (bucket_id = 'menu-images');
create policy "admin update photos" on storage.objects
  for update to authenticated using (bucket_id = 'menu-images');
create policy "admin delete photos" on storage.objects
  for delete to authenticated using (bucket_id = 'menu-images');
