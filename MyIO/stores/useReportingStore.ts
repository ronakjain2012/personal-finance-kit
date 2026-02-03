// stores/useReportingStore.ts — Reporting: top categories/accounts, balances, category spending; fetch from Supabase, reset on logout.

import dayjs from "dayjs"
import { create } from "zustand"

import { listTransactions } from "@/lib/db"
import { useCategoriesStore } from "@/stores/useCategoriesStore"
import type { Account, Category, Transaction } from "@/types/database"
import { useAccountsStore } from "./useAccountsStore"

export type CategorySpendingItem = {
  category: Category
  expenseTotal: number
  transactionCount: number
  percentageShare: number
  trendPercentage: number
}

export type CategoryIncomeItem = {
  category: Category
  incomeTotal: number
  transactionCount: number
  percentageShare: number
  trendPercentage: number
}

type ReportingState = {
  // state
  topCategories: Category[]
  topAccounts: Account[]
  commonAmounts: number[]
  categoriesBalance: Record<string, number>
  accountsBalance: Record<string, number>
  totalBalance: number
  incomeTotal: number
  expenseTotal: number
  recentTransactions: Transaction[]
  categorySpendingSummary: CategorySpendingItem[]
  categoryIncomeSummary: CategoryIncomeItem[]
  periodLabel: string

  // getters
  getTopCategories: () => Category[]
  getTopAccounts: () => Account[]
  getCommonAmounts: () => number[]
  getCategoriesBalance: () => Record<string, number>
  getAccountsBalance: () => Record<string, number>
  getTotalBalance: () => number
  getIncomeTotal: () => number
  getExpenseTotal: () => number
  getRecentTransactions: () => Transaction[]
  getCategorySpendingSummary: () => CategorySpendingItem[]
  getCategoryIncomeSummary: () => CategoryIncomeItem[]
  getPeriodLabel: () => string

  // setters
  setTopCategories: (categories: Category[]) => void
  setTopAccounts: (accounts: Account[]) => void
  setCommonAmounts: (amounts: number[]) => void
  setCategoriesBalance: (balance: Record<string, number>) => void
  setAccountsBalance: (balance: Record<string, number>) => void
  setTotalBalance: (balance: number) => void
  setIncomeTotal: (total: number) => void
  setExpenseTotal: (total: number) => void
  setRecentTransactions: (transactions: Transaction[]) => void
  setCategorySpendingSummary: (summary: CategorySpendingItem[]) => void
  setCategoryIncomeSummary: (summary: CategoryIncomeItem[]) => void
  setPeriodLabel: (label: string) => void

  // fetch
  fetch: (userId: string) => Promise<void>

  // reset
  reset: () => void
}

const initialState = {
  topCategories: [] as Category[],
  topAccounts: [] as Account[],
  commonAmounts: [] as number[],
  categoriesBalance: {} as Record<string, number>,
  accountsBalance: {} as Record<string, number>,
  totalBalance: 0,
  incomeTotal: 0,
  expenseTotal: 0,
  recentTransactions: [] as Transaction[],
  categorySpendingSummary: [] as CategorySpendingItem[],
  categoryIncomeSummary: [] as CategoryIncomeItem[],
  periodLabel: "",
}

export const useReportingStore = create<ReportingState>((set, get) => ({
  ...initialState,

  getTopCategories: () => get().topCategories,
  getTopAccounts: () => get().topAccounts,
  getCommonAmounts: () => get().commonAmounts,
  getCategoriesBalance: () => get().categoriesBalance,
  getAccountsBalance: () => get().accountsBalance,
  getTotalBalance: () => get().totalBalance,
  getIncomeTotal: () => get().incomeTotal,
  getExpenseTotal: () => get().expenseTotal,
  getRecentTransactions: () => get().recentTransactions,
  getCategorySpendingSummary: () => get().categorySpendingSummary,
  getCategoryIncomeSummary: () => get().categoryIncomeSummary,
  getPeriodLabel: () => get().periodLabel,

  setTopCategories: (categories: Category[]) => set({ topCategories: categories }),
  setTopAccounts: (accounts: Account[]) => set({ topAccounts: accounts }),
  setCommonAmounts: (amounts: number[]) => set({ commonAmounts: amounts }),
  setCategoriesBalance: (balance: Record<string, number>) => set({ categoriesBalance: balance }),
  setAccountsBalance: (balance: Record<string, number>) => set({ accountsBalance: balance }),
  setTotalBalance: (balance: number) => set({ totalBalance: balance }),
  setIncomeTotal: (total: number) => set({ incomeTotal: total }),
  setExpenseTotal: (total: number) => set({ expenseTotal: total }),
  setRecentTransactions: (transactions: Transaction[]) => set({ recentTransactions: transactions }),
  setCategorySpendingSummary: (summary: CategorySpendingItem[]) => set({ categorySpendingSummary: summary }),
  setCategoryIncomeSummary: (summary: CategoryIncomeItem[]) => set({ categoryIncomeSummary: summary }),
  setPeriodLabel: (label: string) => set({ periodLabel: label }),

  fetch: async (userId: string, fromDate?: string, toDate?: string) => {
    let transactions = await listTransactions(userId, {
      limit: 10000,
      fromDate,
      toDate,
    })
    if (transactions.error) {}
    if (!transactions.data) return;
    let topCategories = transactions.data?.reduce((acc, tx) => {
      acc[tx.category_id ?? ''] = (acc[tx.category_id ?? ''] || 0) + 1;
      return acc;
    }, {} as any) ?? {};
    const sortedCategoryIds = Object.entries(topCategories as Record<string, number>)
      .sort((a, b) => b[1] - a[1])
      .map(([categoryId]: [string, number]) => categoryId);

    const allCategories = useCategoriesStore.getState().getCategories() ?? [];
    topCategories = sortedCategoryIds
      .map((categoryId) => allCategories.find((c) => c.id === categoryId))
      .filter((c): c is Category => Boolean(c)) as Category[];

    let topAccounts = transactions.data?.reduce((acc, tx) => {
      acc[tx.to_account_id ?? ''] = (acc[tx.to_account_id ?? ''] || 0) + tx.amount;
      return acc;
    }, {} as any) ?? {};
    const sortedAccountIds = Object.entries(topAccounts as Record<string, number>)
      .sort((a, b) => b[1] - a[1])
      .map(([accountId]: [string, number]) => accountId);
    const allAccounts = useAccountsStore.getState().getAccounts() ?? [];
    topAccounts = sortedAccountIds
      .map((accountId) => allAccounts.find((a) => a.id === accountId))
      .filter((a): a is Account => Boolean(a)) as Account[];



    let commonAmounts = transactions.data?.reduce((acc, tx) => {
      acc[tx.amount] = (acc[tx.amount] || 0) + 1;
      return acc;
    }, {} as any) ?? {};
    const sortedAmounts = Object.entries(commonAmounts as Record<number, number>)
      .sort((a, b) => b[1] - a[1])
      .map(([amount]: [string, number]) => Number(amount));
    commonAmounts = sortedAmounts as number[];

    const categoriesBalance = topCategories.reduce((acc: Record<string, number>, category: Category) => {
      acc[category.id] = (acc[category.id] || 0) + category.opening_balance;
      return acc;
    }, {} as any) ?? {};
    let accountsBalance = topAccounts.reduce((acc: Record<string, number>, account: Account) => {
      acc[account.id] = (acc[account.id] || 0) + account.opening_balance;
      return acc;
    }, {} as any) ?? {};
    
    let totalBalance = transactions.data?.reduce((acc, tx) => {
      return acc + (tx.entry_type === "INCOME" ? tx.amount : -tx.amount);
    }, 0) ?? 0;

    let incomeTotal = transactions.data?.reduce((acc, tx) => {
      return acc + (tx.entry_type === "INCOME" ? tx.amount : 0);
    }, 0) ?? 0;
    let expenseTotal = transactions.data?.reduce((acc, tx) => {
      return acc + (tx.entry_type === "EXPENSES" ? tx.amount : 0);
    }, 0) ?? 0;

    let recentTransactions = transactions.data?.sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()).slice(0, 10) ?? [];

    const expenseTxs = transactions.data?.filter((tx) => tx.entry_type === "EXPENSES" && tx.category_id) ?? [];
    const byCategory: Record<string, { expenseTotal: number; transactionCount: number }> = {};
    for (const tx of expenseTxs) {
      const id = tx.category_id ?? "";
      if (!byCategory[id]) byCategory[id] = { expenseTotal: 0, transactionCount: 0 };
      byCategory[id].expenseTotal += Number(tx.amount);
      byCategory[id].transactionCount += 1;
    }
    const categorySpendingSummary: CategorySpendingItem[] = Object.entries(byCategory)
      .map(([categoryId, data]) => {
        const category = allCategories.find((c) => c.id === categoryId);
        if (!category) return null;
        const percentageShare = expenseTotal > 0 ? (data.expenseTotal / expenseTotal) * 100 : 0;
        return {
          category,
          expenseTotal: data.expenseTotal,
          transactionCount: data.transactionCount,
          percentageShare,
          trendPercentage: 0,
        };
      })
      .filter((x): x is CategorySpendingItem => x != null)
      .sort((a, b) => b.expenseTotal - a.expenseTotal);

    // category income summary (income only): per-category total, count, % share
    const incomeTxs = transactions.data?.filter((tx) => tx.entry_type === "INCOME" && tx.category_id) ?? [];
    const byCategoryIncome: Record<string, { incomeTotal: number; transactionCount: number }> = {};
    for (const tx of incomeTxs) {
      const id = tx.category_id ?? "";
      if (!byCategoryIncome[id]) byCategoryIncome[id] = { incomeTotal: 0, transactionCount: 0 };
      byCategoryIncome[id].incomeTotal += Number(tx.amount);
      byCategoryIncome[id].transactionCount += 1;
    }
    const categoryIncomeSummary: CategoryIncomeItem[] = Object.entries(byCategoryIncome)
      .map(([categoryId, data]) => {
        const category = allCategories.find((c) => c.id === categoryId);
        if (!category) return null;
        const percentageShare = incomeTotal > 0 ? (data.incomeTotal / incomeTotal) * 100 : 0;
        return {
          category,
          incomeTotal: data.incomeTotal,
          transactionCount: data.transactionCount,
          percentageShare,
          trendPercentage: 0,
        };
      })
      .filter((x): x is CategoryIncomeItem => x != null)
      .sort((a, b) => b.incomeTotal - a.incomeTotal);

    // period label from transaction date range or current month
    let periodLabel = "";
    if (transactions.data && transactions.data.length > 0) {
      const dates = transactions.data.map((t) => t.transaction_date.slice(0, 10));
      const min = dates.reduce((a, b) => (a < b ? a : b));
      const max = dates.reduce((a, b) => (a > b ? a : b));
      periodLabel = dayjs(max).format("MMMM YYYY");
    } else {
      periodLabel = dayjs().format("MMMM YYYY");
    }

    set({
      topCategories,
      topAccounts,
      commonAmounts,
      categoriesBalance,
      accountsBalance,
      totalBalance,
      incomeTotal,
      expenseTotal,
      recentTransactions,
      categorySpendingSummary,
      categoryIncomeSummary,
      periodLabel,
    })
  },

  reset: () => set(initialState),
}))
