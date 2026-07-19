-- SplitUP Initial Schema
-- Migration 00001: Create all core tables

-- 1. Users
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  phone text unique not null,
  name text not null,
  default_vpa text not null default '',
  created_at timestamptz not null default now()
);

-- 2. Groups
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('pg', 'hostel', 'trip')),
  created_by uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- 3. Group Members
create table if not exists public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

-- 4. Expenses
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  paid_by uuid not null references public.users(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  description text not null,
  category text not null default 'other',
  created_at timestamptz not null default now(),
  is_recurring boolean not null default false,
  recurring_frequency text check (recurring_frequency in ('daily', 'weekly', 'monthly'))
);

-- 5. Expense Splits
create table if not exists public.expense_splits (
  expense_id uuid not null references public.expenses(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  share_amount numeric(12,2) not null check (share_amount > 0),
  primary key (expense_id, user_id)
);

-- 6. Settlements
create table if not exists public.settlements (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  from_user uuid not null references public.users(id) on delete cascade,
  to_user uuid not null references public.users(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'disputed')),
  note text not null default '',
  created_at timestamptz not null default now(),
  settled_at timestamptz
);

-- Indexes
create index if not exists idx_group_members_user on public.group_members(user_id);
create index if not exists idx_expenses_group on public.expenses(group_id);
create index if not exists idx_expenses_paid_by on public.expenses(paid_by);
create index if not exists idx_expense_splits_expense on public.expense_splits(expense_id);
create index if not exists idx_settlements_group on public.settlements(group_id);
create index if not exists idx_settlements_from on public.settlements(from_user);
create index if not exists idx_settlements_to on public.settlements(to_user);
create index if not exists idx_settlements_status on public.settlements(status);

-- Enable Row Level Security
alter table if exists public.users enable row level security;
alter table if exists public.groups enable row level security;
alter table if exists public.group_members enable row level security;
alter table if exists public.expenses enable row level security;
alter table if exists public.expense_splits enable row level security;
alter table if exists public.settlements enable row level security;

-- RLS Policies

-- Users: can read any user, only update self
drop policy if exists "users_read_all" on public.users;
create policy "users_read_all" on public.users for select using (true);
drop policy if exists "users_update_own" on public.users;
create policy "users_update_own" on public.users for update using (auth.uid() = id);

-- Groups: members can read, creator can update/delete
drop policy if exists "groups_read_members" on public.groups;
create policy "groups_read_members" on public.groups
  for select using (
    exists (select 1 from public.group_members where group_id = id and user_id = auth.uid())
  );
drop policy if exists "groups_insert_authenticated" on public.groups;
create policy "groups_insert_authenticated" on public.groups
  for insert with check (auth.uid() = created_by);
drop policy if exists "groups_update_creator" on public.groups;
create policy "groups_update_creator" on public.groups
  for update using (auth.uid() = created_by);

-- Group Members: visible to group members
drop policy if exists "group_members_read" on public.group_members;
create policy "group_members_read" on public.group_members
  for select using (
    exists (select 1 from public.group_members gm where gm.group_id = group_id and gm.user_id = auth.uid())
  );
drop policy if exists "group_members_insert" on public.group_members;
create policy "group_members_insert" on public.group_members
  for insert with check (
    exists (select 1 from public.groups where id = group_id and created_by = auth.uid())
  );

-- Expenses: visible to group members, insertable by group members
drop policy if exists "expenses_read_members" on public.expenses;
create policy "expenses_read_members" on public.expenses
  for select using (
    exists (select 1 from public.group_members where group_id = expenses.group_id and user_id = auth.uid())
  );
drop policy if exists "expenses_insert_members" on public.expenses;
create policy "expenses_insert_members" on public.expenses
  for insert with check (
    exists (select 1 from public.group_members where group_id = expenses.group_id and user_id = auth.uid())
  );

-- Expense Splits: visible to group members
drop policy if exists "expense_splits_read_members" on public.expense_splits;
create policy "expense_splits_read_members" on public.expense_splits
  for select using (
    exists (
      select 1 from public.expenses e
      join public.group_members gm on gm.group_id = e.group_id
      where e.id = expense_id and gm.user_id = auth.uid()
    )
  );
drop policy if exists "expense_splits_insert_members" on public.expense_splits;
create policy "expense_splits_insert_members" on public.expense_splits
  for insert with check (
    exists (
      select 1 from public.expenses e
      join public.group_members gm on gm.group_id = e.group_id
      where e.id = expense_id and gm.user_id = auth.uid()
    )
  );

-- Settlements: visible to group members
drop policy if exists "settlements_read_members" on public.settlements;
create policy "settlements_read_members" on public.settlements
  for select using (
    exists (select 1 from public.group_members where group_id = settlements.group_id and user_id = auth.uid())
  );
drop policy if exists "settlements_insert_members" on public.settlements;
create policy "settlements_insert_members" on public.settlements
  for insert with check (
    exists (select 1 from public.group_members where group_id = settlements.group_id and user_id = auth.uid())
  );

-- Grant API access
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
