-- SplitUP Database Schema (Reference)
-- This file documents the intended Supabase/PostgreSQL schema.
-- The in-memory store (store.ts) mirrors this structure for development.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone       TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  default_vpa TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_phone ON users (phone);

-- ============================================================
-- GROUPS
-- ============================================================
CREATE TABLE groups (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  type       TEXT NOT NULL CHECK (type IN ('pg', 'hostel', 'trip')),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_groups_created_by ON groups (created_by);

-- ============================================================
-- GROUP MEMBERS
-- ============================================================
CREATE TABLE group_members (
  group_id  UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

CREATE INDEX idx_group_members_user_id ON group_members (user_id);

-- ============================================================
-- EXPENSES
-- ============================================================
CREATE TABLE expenses (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id           UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  paid_by            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount             NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  description        TEXT NOT NULL DEFAULT '',
  category           TEXT NOT NULL DEFAULT '',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_recurring       BOOLEAN NOT NULL DEFAULT FALSE,
  recurring_frequency TEXT CHECK (recurring_frequency IN ('monthly', 'weekly', 'daily'))
);

CREATE INDEX idx_expenses_group_id ON expenses (group_id);
CREATE INDEX idx_expenses_paid_by ON expenses (paid_by);

-- ============================================================
-- EXPENSE SPLITS
-- ============================================================
CREATE TABLE expense_splits (
  expense_id   UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  share_amount NUMERIC(12,2) NOT NULL CHECK (share_amount > 0),
  PRIMARY KEY (expense_id, user_id)
);

CREATE INDEX idx_expense_splits_user_id ON expense_splits (user_id);

-- ============================================================
-- SETTLEMENTS
-- ============================================================
CREATE TABLE settlements (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id   UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  from_user  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount     NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  status     TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'disputed')),
  note       TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  settled_at TIMESTAMPTZ
);

CREATE INDEX idx_settlements_group_id ON settlements (group_id);
CREATE INDEX idx_settlements_from_user ON settlements (from_user);
CREATE INDEX idx_settlements_to_user   ON settlements (to_user);

-- ============================================================
-- ROW LEVEL SECURITY (Placeholder — enable when Supabase is connected)
-- ============================================================
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
-- CREATE POLICY "Users can read own data" ON users
--   FOR SELECT USING (id = auth.uid());

-- Users can read groups they belong to
-- CREATE POLICY "Members can read their groups" ON groups
--   FOR SELECT USING (
--     id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
--   );

-- Users can create groups
-- CREATE POLICY "Users can create groups" ON groups
--   FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Group members can read expenses in the group
-- CREATE POLICY "Members can read expenses" ON expenses
--   FOR SELECT USING (
--     group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
--   );

-- Group members can create expenses (as payer)
-- CREATE POLICY "Members can create expenses" ON expenses
--   FOR INSERT WITH CHECK (
--     group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
--     AND paid_by = auth.uid()
--   );

-- Similar policies for expense_splits, settlements, etc.
