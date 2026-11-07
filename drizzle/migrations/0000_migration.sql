
create or replace function public.set_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile select" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id);
create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin insert into public.profiles (id, display_name) values (new.id, split_part(new.email,'@',1)) on conflict do nothing; return new; end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.modules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  title text not null check (char_length(title) between 1 and 200),
  description text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index modules_user_idx on public.modules(user_id, position);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  description text,
  youtube_url text,
  quick_notes text,
  position integer not null default 0,
  status text not null default 'not_started' check (status in ('not_started','in_progress','completed')),
  duration_minutes integer check (duration_minutes is null or duration_minutes >= 0),
  needs_review boolean not null default false,
  review_status text check (review_status in ('later','pending','reviewed')),
  next_review_at date,
  review_note text,
  last_reviewed_at timestamptz,
  last_accessed_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index lessons_module_idx on public.lessons(module_id, position);
create index lessons_user_idx on public.lessons(user_id);

create table public.lesson_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  lesson_id uuid not null unique references public.lessons(id) on delete cascade,
  free_notes text not null default '',
  summary text not null default '',
  doubts_text text not null default '',
  practical text not null default '',
  important boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index lesson_notes_user_idx on public.lesson_notes(user_id, updated_at desc);

create table public.doubts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  lesson_id uuid references public.lessons(id) on delete cascade,
  question text not null check (char_length(question) between 1 and 2000),
  status text not null default 'pending' check (status in ('pending','researching','resolved')),
  answer text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index doubts_user_idx on public.doubts(user_id, status);

create table public.review_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  reviewed_at timestamptz not null default now(),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index review_logs_user_idx on public.review_logs(user_id, reviewed_at desc);

create table public.chart_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  lesson_id uuid references public.lessons(id) on delete set null,
  module_id uuid references public.modules(id) on delete set null,
  title text not null check (char_length(title) between 1 and 200),
  entry_date date not null default current_date,
  asset text, timeframe text, market_context text, concept text,
  observation text, conclusion text,
  image_path text,
  tags text[] not null default '{}',
  day_high_low text, poc text, adjustment text, support_resistance text,
  attention_zones text, macro_context text,
  risk_regime text check (risk_regime is null or risk_regime in ('risk_on','risk_off','neutral')),
  hypothesis text, outcome text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index chart_entries_user_idx on public.chart_entries(user_id, entry_date desc);

do $$ declare t text; begin
  foreach t in array array['modules','lessons','lesson_notes','doubts','review_logs','chart_entries'] loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "own select" on public.%I for select to authenticated using (auth.uid() = user_id)', t);
    execute format('create policy "own insert" on public.%I for insert to authenticated with check (auth.uid() = user_id)', t);
    execute format('create policy "own update" on public.%I for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
    execute format('create policy "own delete" on public.%I for delete to authenticated using (auth.uid() = user_id)', t);
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', t || '_updated', t);
  end loop;
end $$;
