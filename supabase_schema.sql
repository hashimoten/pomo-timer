-- Enable Row Level Security (RLS) on all tables is recommended, but we start simple.
-- Users are managed by Supabase Auth (auth.users).

-- 1. PROFILES
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone
);
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone." on public.profiles
  for select using (true);

create policy "Users can insert their own profile." on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on public.profiles
  for update using (auth.uid() = id);

-- 2. USER SETTINGS
create table public.user_settings (
    user_id uuid references auth.users not null primary key,
    work_duration integer default 25,
    break_duration integer default 5,
    long_break_duration integer default 15,
    sessions_until_long_break integer default 4,
    theme text default 'light',
    sound_type text default 'bell',
    categories text[] default array['General', 'Coding', 'English', 'Reading', 'Work'],
    auto_start boolean default false,
    updated_at timestamp with time zone default timezone('utc'::text, now())
);
alter table public.user_settings enable row level security;

create policy "Users can view own settings" on public.user_settings
    for select using (auth.uid() = user_id);

create policy "Users can insert own settings" on public.user_settings
    for insert with check (auth.uid() = user_id);

create policy "Users can update own settings" on public.user_settings
    for update using (auth.uid() = user_id);


-- 3. TASKS
create table public.tasks (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users not null,
    title text not null,
    completed boolean default false,
    completed_pomodoros integer default 0,
    is_active boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now())
);
alter table public.tasks enable row level security;

create policy "Users can view own tasks" on public.tasks
    for select using (auth.uid() = user_id);

create policy "Users can insert own tasks" on public.tasks
    for insert with check (auth.uid() = user_id);

create policy "Users can update own tasks" on public.tasks
    for update using (auth.uid() = user_id);

create policy "Users can delete own tasks" on public.tasks
    for delete using (auth.uid() = user_id);

-- 4. FOCUS SESSIONS (History)
create table public.focus_sessions (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users not null,
    start_time timestamp with time zone not null,
    end_time timestamp with time zone not null,
    duration_minutes integer not null,
    category text,
    connected_task_id uuid references public.tasks(id),
    iso_date text, -- redundant but useful for grouping if needed, or generated col
    created_at timestamp with time zone default timezone('utc'::text, now())
);
alter table public.focus_sessions enable row level security;

create policy "Users can view own sessions" on public.focus_sessions
    for select using (auth.uid() = user_id);

create policy "Users can insert own sessions" on public.focus_sessions
    for insert with check (auth.uid() = user_id);

-- Trigger to create profile on signup (optional but good practice)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);

  insert into public.user_settings (user_id)
  values (new.id);

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
