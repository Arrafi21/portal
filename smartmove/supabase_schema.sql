-- ═══════════════════════════════════════════════════════════════
-- SMARTMOVE EDUCATION GROUP — Supabase Database Schema
-- Run this entire file in: Supabase Dashboard → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════

-- 1. PROFILES table (extends Supabase auth.users)
create table public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  full_name   text not null,
  role        text not null default 'agent', -- 'agent' or 'manager'
  created_at  timestamptz default now()
);

-- 2. DAILY REPORTS table
create table public.daily_reports (
  id                      bigserial primary key,
  agent_id                uuid references public.profiles(id) on delete cascade not null,
  agent_name              text not null,
  date                    date not null,
  channel                 text not null,
  lead_source             text,
  leads_allocated         int default 20,
  calls_made              int default 0,
  hours_spent             numeric(4,1),
  uni_apps                jsonb default '[]',
  applications_submitted  int default 0,
  lead_outcomes           jsonb default '[]',
  outcome_summary         jsonb default '{}',
  blockers                text,
  follow_ups              text,
  notes                   text,
  submitted_at            timestamptz default now(),
  created_at              timestamptz default now()
);

-- 3. Row Level Security — agents see only their own reports; managers see all
alter table public.profiles      enable row level security;
alter table public.daily_reports enable row level security;

-- Profiles: users can read all profiles (for manager dropdown), edit only their own
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select using (auth.role() = 'authenticated');

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Reports: agents can insert/read their own; managers can read all
create policy "Agents can insert own reports"
  on public.daily_reports for insert with check (auth.uid() = agent_id);

create policy "Agents can view own reports"
  on public.daily_reports for select using (
    auth.uid() = agent_id
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'manager'
    )
  );

create policy "Managers can delete reports"
  on public.daily_reports for delete using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'manager'
    )
  );

-- 4. Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'agent')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. Enable Realtime on daily_reports
alter publication supabase_realtime add table public.daily_reports;

-- ═══════════════════════════════════════════════════════════════
-- DONE. Your database is ready.
-- ═══════════════════════════════════════════════════════════════
