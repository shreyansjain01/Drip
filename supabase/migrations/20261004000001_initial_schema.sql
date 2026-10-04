-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  avatar_url text,
  currency text not null default 'INR',
  timezone text not null default 'Asia/Kolkata',
  monthly_salary_paise bigint null check (monthly_salary_paise is null or monthly_salary_paise >= 0),
  salary_day smallint null check (salary_day is null or (salary_day >= 1 and salary_day <= 31)),
  onboarding_done boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- 2. CATEGORIES
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users on delete cascade,
  name text not null,
  icon text not null,
  color text not null default '#B8ACFA',
  keywords text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

create policy "Users can view system and their own categories"
  on public.categories for select
  using (user_id is null or auth.uid() = user_id);

create policy "Users can create custom categories"
  on public.categories for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own categories"
  on public.categories for update
  using (auth.uid() = user_id);

create policy "Users can delete their own categories"
  on public.categories for delete
  using (auth.uid() = user_id);

-- 3. GOALS
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  target_paise bigint not null check (target_paise > 0),
  deadline date null,
  icon text not null default 'target',
  color text not null default '#B8ACFA',
  created_at timestamptz not null default now(),
  archived_at timestamptz null
);

alter table public.goals enable row level security;

create policy "Users can view their own goals"
  on public.goals for select
  using (auth.uid() = user_id);

create policy "Users can manage their own goals"
  on public.goals for all
  using (auth.uid() = user_id);

-- 4. PLAN FIELDS (Expenses, Savings, Goals)
create table if not exists public.plan_fields (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  kind text not null check (kind in ('expenses', 'savings', 'goal')),
  goal_id uuid null references public.goals(id) on delete cascade,
  name text not null,
  planned_paise bigint not null default 0 check (planned_paise >= 0),
  sort_order integer not null default 1,
  locked boolean not null default false,
  archived_at timestamptz null,
  created_at timestamptz not null default now()
);

alter table public.plan_fields enable row level security;

create policy "Users can view their own plan fields"
  on public.plan_fields for select
  using (auth.uid() = user_id);

create policy "Users can manage their own plan fields"
  on public.plan_fields for all
  using (auth.uid() = user_id);

-- 5. INCOMES
create table if not exists public.incomes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  kind text not null check (kind in ('salary', 'extra')),
  amount_paise bigint not null check (amount_paise > 0),
  label text not null,
  received_at timestamptz not null default now(),
  effective_month date not null,
  source text not null check (source in ('onboarding', 'month_end_prompt', 'manual', 'voice', 'shortcut')),
  created_at timestamptz not null default now()
);

alter table public.incomes enable row level security;

create policy "Users can view and manage their own incomes"
  on public.incomes for all
  using (auth.uid() = user_id);

-- 6. EXPENSES
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  amount_paise bigint not null check (amount_paise > 0),
  category_id uuid not null references public.categories(id),
  label text not null,
  source text not null check (source in ('voice', 'manual', 'shortcut')),
  needs_review boolean not null default false,
  spent_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null
);

create index if not exists idx_expenses_user_spent_at on public.expenses(user_id, spent_at desc) where deleted_at is null;

alter table public.expenses enable row level security;

create policy "Users can view and manage their own expenses"
  on public.expenses for all
  using (auth.uid() = user_id);

-- 7. GOAL CONTRIBUTIONS
create table if not exists public.goal_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  goal_id uuid not null references public.goals(id) on delete cascade,
  field_id uuid null references public.plan_fields(id) on delete set null,
  amount_paise bigint not null,
  note text null,
  source text not null check (source in ('manual', 'voice', 'shortcut', 'extra_income_allocation')),
  contributed_at timestamptz not null default now()
);

create index if not exists idx_goal_contributions_user on public.goal_contributions(user_id, contributed_at desc);

alter table public.goal_contributions enable row level security;

create policy "Users can view and manage their own goal contributions"
  on public.goal_contributions for all
  using (auth.uid() = user_id);

-- 8. REMINDER SLOTS
create table if not exists public.reminder_slots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  local_time time not null,
  label text not null,
  enabled boolean not null default true,
  origin text not null check (origin in ('learned', 'default', 'user')),
  created_at timestamptz not null default now()
);

alter table public.reminder_slots enable row level security;

create policy "Users can manage their own reminder slots"
  on public.reminder_slots for all
  using (auth.uid() = user_id);

-- 9. PUSH SUBSCRIPTIONS
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

create policy "Users can manage their own push subscriptions"
  on public.push_subscriptions for all
  using (auth.uid() = user_id);

-- 10. NOTIFICATION LOG
create table if not exists public.notification_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  kind text not null check (kind in ('reminder', 'month_end_ask', 'month_end_congrats', 'system')),
  slot_id uuid null references public.reminder_slots(id) on delete set null,
  local_date date not null,
  title text not null,
  body text not null,
  read_at timestamptz null,
  created_at timestamptz not null default now(),
  constraint uq_notification_log_daily unique (user_id, kind, local_date, slot_id)
);

create index if not exists idx_notification_log_unread on public.notification_log(user_id, read_at);

alter table public.notification_log enable row level security;

create policy "Users can view and update their own notification log"
  on public.notification_log for all
  using (auth.uid() = user_id);

-- 11. API TOKENS (For Siri / Shortcuts quick-add)
create table if not exists public.api_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  token_hash text not null unique,
  scopes text[] not null default '{"expenses:create", "goals:contribute", "incomes:create"}',
  last_used_at timestamptz null,
  revoked_at timestamptz null,
  created_at timestamptz not null default now()
);

alter table public.api_tokens enable row level security;

create policy "Users can manage their own api tokens"
  on public.api_tokens for all
  using (auth.uid() = user_id);

-- 12. MONTHLY RESULTS
create table if not exists public.monthly_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  month date not null,
  income_paise bigint not null,
  plan_snapshot jsonb not null default '{}'::jsonb,
  total_spent_paise bigint not null default 0,
  total_saved_paise bigint not null default 0,
  expense_target_paise bigint not null default 0,
  savings_target_paise bigint not null default 0,
  expense_goal_met boolean not null default false,
  savings_goal_met boolean not null default false,
  notified_at timestamptz null,
  created_at timestamptz not null default now(),
  constraint uq_monthly_results_month unique (user_id, month)
);

alter table public.monthly_results enable row level security;

create policy "Users can view their own monthly results"
  on public.monthly_results for select
  using (auth.uid() = user_id);
