// lib/login-check.ts — Ensures default accounts and categories exist; runs migration when migration_completed is false.
// Uses SDK only (lib/db). Called after session is established.

import {
  createAccount,
  createCategory,
  findUserPreference,
  listAccounts,
  listCategories,
  updateUserPreference
} from '@/lib/db';
import { Account, Category, UserPreference } from '@/types/database';

const DEFAULT_CURRENCY = 'USD';

const DEFAULT_CATEGORIES: Array<{
  name: string;
  type: 'EXPENSE' | 'INCOME';
  icon: string | null;
  color: string;
}> = [
  // Expenses
  { name: 'Food', type: 'EXPENSE', icon: 'utensils', color: '#6b7280' },
  { name: 'Groceries', type: 'EXPENSE', icon: 'shopping-bag', color: '#16a34a' },
  { name: 'Transport', type: 'EXPENSE', icon: 'car', color: '#3b82f6' },
  { name: 'Fuel', type: 'EXPENSE', icon: 'fuel', color: '#f59e42' },
  { name: 'Shopping', type: 'EXPENSE', icon: 'shopping-cart', color: '#8b5cf6' },
  { name: 'Health', type: 'EXPENSE', icon: 'heart-pulse', color: '#ef4444' },
  { name: 'Bills', type: 'EXPENSE', icon: 'file-text', color: '#ef4444' },
  { name: 'Subscriptions', type: 'EXPENSE', icon: 'repeat', color: '#6366f1' },
  { name: 'Education', type: 'EXPENSE', icon: 'graduation-cap', color: '#3b82f6' },
  { name: 'Family', type: 'EXPENSE', icon: 'users', color: '#eab308' },
  { name: 'Travel', type: 'EXPENSE', icon: 'plane', color: '#0ea5e9' },
  { name: 'Entertainment', type: 'EXPENSE', icon: 'music', color: '#f472b6' },
  { name: 'Gifts', type: 'EXPENSE', icon: 'gift', color: '#fde68a' },
  { name: 'Personal Care', type: 'EXPENSE', icon: 'scissors', color: '#fb7185' },
  { name: 'Rent', type: 'EXPENSE', icon: 'home', color: '#7f1d1d' },
  { name: 'Other', type: 'EXPENSE', icon: 'circle-dot', color: '#6b7280' },
  // Income
  { name: 'Salary', type: 'INCOME', icon: 'briefcase', color: '#10b981' },
  { name: 'Freelance', type: 'INCOME', icon: 'laptop', color: '#3b82f6' },
  { name: 'Investments', type: 'INCOME', icon: 'line-chart', color: '#eab308' },
  { name: 'Business', type: 'INCOME', icon: 'building', color: '#8b5cf6' },
  { name: 'Refund', type: 'INCOME', icon: 'rotate-ccw', color: '#f59e42' },
  { name: 'Gift', type: 'INCOME', icon: 'gift', color: '#fde68a' },
  { name: 'Rental Income', type: 'INCOME', icon: 'home', color: '#7f1d1d' },
  { name: 'Interest', type: 'INCOME', icon: 'dollar-sign', color: '#22d3ee' },
  { name: 'Rewards', type: 'INCOME', icon: 'star', color: '#fbbf24' },
  { name: 'Other', type: 'INCOME', icon: 'circle-dot', color: '#6b7280' },
];

export type LoginCheckResult =
  | { ok: true; preference: UserPreference; accounts: Account[]; categories: Category[] }
  | { ok: false; error: Error };

async function refetch(
  userId: string
): Promise<{ preference: UserPreference; accounts: Account[]; categories: Category[] } | { error: Error }> {
  const [prefRes, accRes, catRes] = await Promise.all([
    findUserPreference(userId),
    listAccounts(userId),
    listCategories(userId),
  ]);
  if (prefRes.error || !prefRes.data) return { error: prefRes.error ? new Error('No preference') : new Error('No preference') };
  if (accRes.error) return { error: accRes.error };
  if (catRes.error) return { error: catRes.error };
  return {
    preference: prefRes.data,
    accounts: accRes.data ?? [],
    categories: catRes.data ?? [],
  };
}

/**
 * Ensures default Income and Expense accounts exist; if migration_completed is false,
 * creates default accounts, 6–8 default categories, and sets migration_completed true.
 * Re fetches preference, accounts, categories and returns them. SDK only.
 */
export async function runLoginCheck(userId: string): Promise<LoginCheckResult> {
  const prefRes = await findUserPreference(userId);
  if (prefRes.error) return { ok: false, error: prefRes.error };
  // if (!prefRes.data) return { ok: false, error: new Error('No preference') };
  const preference = prefRes.data ?? null;
  if (!preference || !preference.migration_completed) {
    // migration_completed === false: create default accounts and categories
  const { data: incomeAccount } = await createAccount(userId, {
    user_id: userId,
    name: 'Income',
    type: 'CASH',
    currency_code: DEFAULT_CURRENCY,
    opening_balance: 0,
    balance: 0,
    is_active: true,
    allow_delete: false,
  });
  const { data: expenseAccount } = await createAccount(userId, {
    user_id: userId,
    name: 'Expense',
    type: 'CASH',
    currency_code: DEFAULT_CURRENCY,
    opening_balance: 0,
    balance: 0,
    is_active: true,
    allow_delete: false,
  });
  const { data: cashAccount } = await createAccount(userId, {
    user_id: userId,
    name: 'Cash',
    type: 'CASH',
    currency_code: DEFAULT_CURRENCY,
    opening_balance: 0,
    balance: 0,
    is_active: true,
    allow_delete: false,
  });
  const { data: bankAccount } = await createAccount(userId, {
    user_id: userId,
    name: 'Bank',
    type: 'BANK',
    currency_code: DEFAULT_CURRENCY,
    opening_balance: 0,
    balance: 0,
    is_active: true,
    allow_delete: false,
  });
  if (!incomeAccount || !expenseAccount || !cashAccount || !bankAccount) {
    return { ok: false, error: new Error('Failed to create default accounts') };
  }

  for (const c of DEFAULT_CATEGORIES) {
    await createCategory(userId, {
      user_id: userId,
      parent_id: null,
      name: c.name,
      type: c.type,
      icon: c.icon,
      color: c.color,
      opening_balance: 0,
    });
  }

  const updateRes = await updateUserPreference(userId, {
    default_income_account_id: incomeAccount.id,
    default_expense_account_id: expenseAccount.id,
    migration_completed: true,
  });
  if (updateRes.error) return { ok: false, error: updateRes.error };

  const data = await refetch(userId);
  if ('error' in data) return { ok: false, error: data.error };
  return { ok: true, ...data }; 
  }
  return { ok: true, preference: preference, accounts: [], categories: [] };
}
