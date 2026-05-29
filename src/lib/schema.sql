-- TikFlow Database Schema
-- Run this in your Supabase SQL editor

create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  full_name text,
  plan text default 'free',
  -- Email sender settings
  email_from_name text default '',
  email_from_address text default '',
  email_api_key text default '',
  email_provider text default 'resend',
  created_at timestamptz default now()
);

-- Add email columns if table already exists
alter table public.profiles add column if not exists email_from_name text default '';
alter table public.profiles add column if not exists email_from_address text default '';
alter table public.profiles add column if not exists email_api_key text default '';
alter table public.profiles add column if not exists email_provider text default 'resend';

create table if not exists public.tiktok_accounts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  username text not null,
  display_name text,
  followers_count int default 0,
  connected_at timestamptz default now()
);

create table if not exists public.automations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  trigger_type text not null,
  keywords text[] default '{}',
  dm_message text default '',
  email_enabled boolean default false,
  email_subject text default '',
  email_body text default '',
  status text default 'active',
  dms_sent int default 0,
  created_at timestamptz default now()
);

create table if not exists public.contacts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  tiktok_username text not null,
  display_name text,
  trigger_type text,
  automation_id uuid references public.automations(id) on delete set null,
  tags text[] default '{}',
  email text,
  phone text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.broadcasts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  message text,
  link_label text,
  link_url text,
  status text default 'draft',
  scheduled_at timestamptz,
  sent_at timestamptz,
  sent_count int default 0,
  created_at timestamptz default now()
);

create table if not exists public.sequences (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  status text default 'active',
  enrolled int default 0,
  steps jsonb default '[]',
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.tiktok_accounts enable row level security;
alter table public.automations enable row level security;
alter table public.contacts enable row level security;
alter table public.broadcasts enable row level security;
alter table public.sequences enable row level security;

-- Policies
drop policy if exists "profiles_all" on public.profiles;
create policy "profiles_all" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "tiktok_all" on public.tiktok_accounts;
create policy "tiktok_all" on public.tiktok_accounts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "automations_all" on public.automations;
create policy "automations_all" on public.automations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "contacts_all" on public.contacts;
create policy "contacts_all" on public.contacts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "broadcasts_all" on public.broadcasts;
create policy "broadcasts_all" on public.broadcasts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "sequences_all" on public.sequences;
create policy "sequences_all" on public.sequences for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
