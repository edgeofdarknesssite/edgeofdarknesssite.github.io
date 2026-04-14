create extension if not exists pgcrypto;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text,
  created_at timestamptz not null default now()
);

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  title text not null,
  classname text not null,
  image_url text not null,
  price numeric(12,2),
  created_at timestamptz not null default now()
);

create index if not exists items_category_id_idx on public.items(category_id);
create index if not exists items_title_idx on public.items(title);
create index if not exists items_classname_idx on public.items(classname);

alter table public.categories enable row level security;
alter table public.items enable row level security;

drop policy if exists "Authenticated can read categories" on public.categories;
drop policy if exists "Authenticated can insert categories" on public.categories;
drop policy if exists "Authenticated can update categories" on public.categories;
drop policy if exists "Authenticated can delete categories" on public.categories;

drop policy if exists "Authenticated can read items" on public.items;
drop policy if exists "Authenticated can insert items" on public.items;
drop policy if exists "Authenticated can update items" on public.items;
drop policy if exists "Authenticated can delete items" on public.items;

create policy "Authenticated can read categories"
  on public.categories for select
  to authenticated
  using (true);

create policy "Authenticated can insert categories"
  on public.categories for insert
  to authenticated
  with check (true);

create policy "Authenticated can update categories"
  on public.categories for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated can delete categories"
  on public.categories for delete
  to authenticated
  using (true);

create policy "Authenticated can read items"
  on public.items for select
  to authenticated
  using (true);

create policy "Authenticated can insert items"
  on public.items for insert
  to authenticated
  with check (true);

create policy "Authenticated can update items"
  on public.items for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated can delete items"
  on public.items for delete
  to authenticated
  using (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'item-images',
  'item-images',
  true,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml']
)
on conflict (id) do nothing;

drop policy if exists "Authenticated can upload item images" on storage.objects;
drop policy if exists "Authenticated can read item images" on storage.objects;
drop policy if exists "Authenticated can update item images" on storage.objects;
drop policy if exists "Authenticated can delete item images" on storage.objects;

create policy "Authenticated can upload item images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'item-images');

create policy "Authenticated can read item images"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'item-images');

create policy "Authenticated can update item images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'item-images')
  with check (bucket_id = 'item-images');

create policy "Authenticated can delete item images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'item-images');


create table if not exists public.item_dependencies (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  dependency_item_id uuid not null references public.items(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint item_dependencies_unique unique (item_id, dependency_item_id),
  constraint item_dependencies_not_self check (item_id <> dependency_item_id)
);

create index if not exists item_dependencies_item_id_idx on public.item_dependencies(item_id);
create index if not exists item_dependencies_dependency_item_id_idx on public.item_dependencies(dependency_item_id);

alter table public.item_dependencies enable row level security;

drop policy if exists "Authenticated can read item dependencies" on public.item_dependencies;
drop policy if exists "Authenticated can insert item dependencies" on public.item_dependencies;
drop policy if exists "Authenticated can update item dependencies" on public.item_dependencies;
drop policy if exists "Authenticated can delete item dependencies" on public.item_dependencies;

create policy "Authenticated can read item dependencies"
  on public.item_dependencies for select
  to authenticated
  using (true);

create policy "Authenticated can insert item dependencies"
  on public.item_dependencies for insert
  to authenticated
  with check (true);

create policy "Authenticated can update item dependencies"
  on public.item_dependencies for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated can delete item dependencies"
  on public.item_dependencies for delete
  to authenticated
  using (true);
