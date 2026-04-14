alter table public.categories add column if not exists color text not null default '#6ff4ff';
alter table public.items add column if not exists price numeric(12,2);


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
