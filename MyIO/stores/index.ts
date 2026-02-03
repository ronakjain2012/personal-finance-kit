// stores/index.ts — Single entry for all stores; app imports from '@/stores'.

export { useAccountsStore } from "./useAccountsStore"
export { useAppStore } from "./useAppStore"
export { useAuthStore, useAuthUser, type LoginCredentials } from "./useAuthStore"
export { useCategoriesStore } from "./useCategoriesStore"
export { useDefaultAccountsStore } from "./useDefaultAccountsStore"
export { usePreferencesStore } from "./usePreferencesStore"
export { useProfileStore } from "./useProfileStore"
export {
  useReportingStore,
  type CategoryIncomeItem,
  type CategorySpendingItem
} from "./useReportingStore"
export { useTransactionsStore } from "./useTransactionsStore"

