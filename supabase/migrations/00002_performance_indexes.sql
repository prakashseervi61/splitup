-- SplitUP Performance Indexes
-- Migration 00002: Add indexes for common query patterns

CREATE INDEX IF NOT EXISTS idx_recurring_templates_group ON recurring_templates(group_id);
CREATE INDEX IF NOT EXISTS idx_invites_to_phone ON invites(to_phone);
CREATE INDEX IF NOT EXISTS idx_invites_from_user ON invites(from_user_id);
CREATE INDEX IF NOT EXISTS idx_groups_created_by ON groups(created_by);
