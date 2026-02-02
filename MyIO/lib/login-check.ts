// lib/login-check.ts — Ensures default accounts and categories exist; runs migration when migration_completed is false.
// Uses SDK only (lib/db). Called after session is established.

import {
  createAccount,
  createCategory,
  findAccount,
  findUserPreference,
  listAccounts,
  listCategories,
  updateUserPreference,
} from '@/lib/db';
import type { Account, Category, UserPreference } from '@/types/database';

const DEFAULT_CURRENCY = 'USD';

const DEFAULT_CATEGORIES: Array<{
  name: string;
  type: 'EXPENSE' | 'INCOME';
  icon: string | null;
  color: string;
}> = [
  { name: 'Food', type: 'EXPENSE', icon: 'utensils', color: '#6b7280' },
  { name: 'Transport', type: 'EXPENSE', icon: 'car', color: '#3b82f6' },
  { name: 'Shopping', type: 'EXPENSE', icon: 'shopping-cart', color: '#8b5cf6' },
  { name: 'Bills', type: 'EXPENSE', icon: 'file-text', color: '#ef4444' },
  { name: 'Other', type: 'EXPENSE', icon: 'circle-dot', color: '#6b7280' },
  { name: 'Salary', type: 'INCOME', icon: 'briefcase', color: '#10b981' },
  { name: 'Freelance', type: 'INCOME', icon: 'laptop', color: '#3b82f6' },
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
  if (prefRes.error || !prefRes.data) return { error: prefRes.error ?? new Error('No preference') };
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
 * Refetches preference, accounts, categories and returns them. SDK only.
 */
export async function runLoginCheck(userId: string): Promise<LoginCheckResult> {
  const prefRes = await findUserPreference(userId);
  if (prefRes.error) return { ok: false, error: prefRes.error };
  if (!prefRes.data) return { ok: false, error: new Error('No preference') };

  const preference = prefRes.data;
  if (preference.migration_completed) {
    // Ensure default accounts exist (may have been deleted)
    let incomeId = preference.default_income_account_id;
    let expenseId = preference.default_expense_account_id;
    let updated = false;

    if (incomeId) {
      const { data: acc } = await findAccount(userId, incomeId);
      if (!acc) {
        const { data: newAcc } = await createAccount(userId, {
          user_id: userId,
          name: 'Income',
          type: 'CASH',
          currency_code: DEFAULT_CURRENCY,
          opening_balance: 0,
          balance: 0,
          is_active: true,
        });
        incomeId = newAcc?.id ?? null;
        updated = true;
      }
    }

    if (expenseId) {
      const { data: acc } = await findAccount(userId, expenseId);
      if (!acc) {
        const { data: newAcc } = await createAccount(userId, {
          user_id: userId,
          name: 'Cash',
          type: 'CASH',
          currency_code: DEFAULT_CURRENCY,
          opening_balance: 0,
          balance: 0,
          is_active: true,
        });
        expenseId = newAcc?.id ?? null;
        updated = true;
      }
    }

    if (updated && (incomeId !== preference.default_income_account_id || expenseId !== preference.default_expense_account_id)) {
      await updateUserPreference(userId, {
        default_income_account_id: incomeId,
        default_expense_account_id: expenseId,
      });
    }

    const data = await refetch(userId);
    if ('error' in data) return { ok: false, error: data.error };
    return { ok: true, ...data };
  }

  // migration_completed === false: create default accounts and categories
  const { data: incomeAccount } = await createAccount(userId, {
    user_id: userId,
    name: 'Income',
    type: 'CASH',
    currency_code: DEFAULT_CURRENCY,
    opening_balance: 0,
    balance: 0,
    is_active: true,
  });
  const { data: expenseAccount } = await createAccount(userId, {
    user_id: userId,
    name: 'Cash',
    type: 'CASH',
    currency_code: DEFAULT_CURRENCY,
    opening_balance: 0,
    balance: 0,
    is_active: true,
  });

  if (!incomeAccount || !expenseAccount) {
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
