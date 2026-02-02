// types/database.ts — Row and Insert types for MyIO Supabase tables.

export type Currency = {
  code: string;
  name: string;
  symbol: string;
  precision: number;
};

export type UserPreference = {
  user_id: string;
  default_currency: string;
  theme: string;
  language: string;
  default_income_account_id: string | null;
  default_expense_account_id: string | null;
  migration_completed: boolean;
  updated_at: string;
};

export type CategoryType = 'INCOME' | 'EXPENSE' | 'TRANSFER';
export type Category = {
  id: string;
  user_id: string;
  parent_id: string | null;
  name: string;
  opening_balance: number;
  icon: string | null;
  type: CategoryType;
  color: string;
  created_at: string;
};

export type AccountType = 'CASH' | 'BANK' | 'CREDIT' | 'INVESTMENT';
export type Account = {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  currency_code: string | null;
  opening_balance: number;
  balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type EntryType = 'INCOME' | 'EXPENSES' | 'ADJUST' | 'CONTRA';
export type AddedBy = 'MANUAL' | 'AI' | '3RDPARTY' | 'API' | 'IMPORT' | 'OTHER';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';
export type Transaction = {
  id: string;
  user_id: string;
  from_account_id: string | null;
  to_account_id: string | null;
  category_id: string | null;
  amount: number;
  description: string | null;
  attachments: string[];
  transaction_date: string;
  entry_type: EntryType;
  added_by: AddedBy;
  status: TransactionStatus;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type NotificationType = 'REMINDER' | 'ALERT' | 'SYSTEM';
export type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
};

export type ActivityLog = {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  message: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
};

export type DeletedRecord = {
  id: string;
  user_id: string;
  table_name: string;
  original_id: string;
  data: Record<string, unknown>;
  deleted_at: string;
};

// Insert types (omit auto-generated fields where applicable)
export type CurrencyInsert = Omit<Currency, never>;
export type UserPreferenceInsert = Omit<UserPreference, 'updated_at' | 'migration_completed'> & {
  updated_at?: string;
  migration_completed?: boolean;
};
export type CategoryInsert = Omit<Category, 'id' | 'created_at' | 'opening_balance'> & {
  id?: string;
  created_at?: string;
  opening_balance?: number;
};
export type AccountInsert = Omit<Account, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};
export type TransactionInsert = Omit<Transaction, 'id' | 'created_at' | 'attachments'> & {
  id?: string;
  created_at?: string;
  attachments?: string[];
};
export type NotificationInsert = Omit<Notification, 'id' | 'created_at'> & { id?: string; created_at?: string };

// Update types (partial, no id/user_id change for most)
export type UserPreferenceUpdate = Partial<Omit<UserPreference, 'user_id'>>;
export type CategoryUpdate = Partial<Omit<Category, 'id' | 'user_id' | 'created_at'>>;
export type AccountUpdate = Partial<Omit<Account, 'id' | 'user_id' | 'created_at'>>;
export type TransactionUpdate = Partial<Omit<Transaction, 'id' | 'user_id' | 'created_at'>>;
export type NotificationUpdate = Partial<Omit<Notification, 'id' | 'user_id' | 'created_at'>>;
