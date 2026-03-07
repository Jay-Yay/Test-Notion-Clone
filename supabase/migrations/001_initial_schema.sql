-- supabase/migrations/001_initial_schema.sql

-- Pages
create table pages (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Untitled',
  icon text,
  cover_image text,
  type text not null check (type in ('note', 'kanban', 'table')),
  parent_id uuid references pages(id) on delete cascade,
  owner_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Note content
create table note_content (
  id uuid primary key default gen_random_uuid(),
  page_id uuid references pages(id) on delete cascade unique not null,
  content jsonb default '{}'::jsonb
);

-- Kanban columns
create table kanban_columns (
  id uuid primary key default gen_random_uuid(),
  page_id uuid references pages(id) on delete cascade not null,
  title text not null default 'New Column',
  position int not null default 0
);

-- Kanban cards
create table kanban_cards (
  id uuid primary key default gen_random_uuid(),
  column_id uuid references kanban_columns(id) on delete cascade not null,
  title text not null default 'Untitled Card',
  description text,
  position int not null default 0,
  assigned_to uuid references auth.users(id) on delete set null
);

-- Table columns
create table table_columns (
  id uuid primary key default gen_random_uuid(),
  page_id uuid references pages(id) on delete cascade not null,
  name text not null default 'Column',
  type text not null default 'text' check (type in ('text', 'number', 'date', 'checkbox', 'select')),
  position int not null default 0
);

-- Table rows
create table table_rows (
  id uuid primary key default gen_random_uuid(),
  page_id uuid references pages(id) on delete cascade not null,
  position int not null default 0
);

-- Table cells
create table table_cells (
  id uuid primary key default gen_random_uuid(),
  row_id uuid references table_rows(id) on delete cascade not null,
  column_id uuid references table_columns(id) on delete cascade not null,
  value text default '',
  unique(row_id, column_id)
);

-- User profiles
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- updated_at trigger for pages
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger pages_updated_at before update on pages
  for each row execute function update_updated_at();

-- RLS: enable on all tables
alter table pages enable row level security;
alter table note_content enable row level security;
alter table kanban_columns enable row level security;
alter table kanban_cards enable row level security;
alter table table_columns enable row level security;
alter table table_rows enable row level security;
alter table table_cells enable row level security;
alter table profiles enable row level security;

-- RLS policies: authenticated users can do everything
create policy "auth_all" on pages for all to authenticated using (true) with check (true);
create policy "auth_all" on note_content for all to authenticated using (true) with check (true);
create policy "auth_all" on kanban_columns for all to authenticated using (true) with check (true);
create policy "auth_all" on kanban_cards for all to authenticated using (true) with check (true);
create policy "auth_all" on table_columns for all to authenticated using (true) with check (true);
create policy "auth_all" on table_rows for all to authenticated using (true) with check (true);
create policy "auth_all" on table_cells for all to authenticated using (true) with check (true);
create policy "auth_all" on profiles for all to authenticated using (true) with check (true);
