export interface User {
  id: string;
  phone: string;
  name: string;
  default_vpa: string;
  onboarding_completed: boolean;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  type: "pg" | "hostel" | "trip";
  created_by: string;
  created_at: string;
}

export interface GroupMember {
  group_id: string;
  user_id: string;
  joined_at: string;
}

export interface Expense {
  id: string;
  group_id: string;
  paid_by: string;
  amount: number;
  description: string;
  category: string;
  created_at: string;
  is_recurring: boolean;
  recurring_frequency?: "monthly" | "weekly" | "daily";
}

export interface ExpenseSplit {
  expense_id: string;
  user_id: string;
  share_amount: number;
}

export interface Settlement {
  id: string;
  group_id: string;
  from_user: string;
  to_user: string;
  amount: number;
  status: "pending" | "confirmed" | "disputed";
  note: string;
  created_at: string;
  settled_at?: string;
}

export interface RecurringTemplate {
  id: string;
  group_id: string;
  created_by: string;
  description: string;
  amount: number;
  category: string;
  split_type: "equal" | "custom" | "percentage";
  split_data: Record<string, number>;
  day_of_month: number;
  is_active: boolean;
  next_due: string | null;
  created_at: string;
}

export interface Invite {
  id: string;
  group_id: string;
  from_user_id: string;
  to_phone: string;
  to_user_id: string | null;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
}
