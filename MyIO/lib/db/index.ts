// lib/db/index.ts — Single entry for all DB modules; app imports from '@/lib/db'.

export {
    createAccount, deleteAccount, findAccount, listAccounts, updateAccount
} from './accounts';
export { logActivity, type LogAction, type LogParams } from './activity-logs';
export {
    createCategory, deleteCategory, findCategory, listCategories, updateCategory
} from './categories';
export { findCurrency, listCurrencies } from './currencies';
export { createDeletedRecord, type DeletedRecordParams } from './deleted-records';
export {
    createNotification, deleteNotification, findNotification, listNotifications, updateNotification
} from './notifications';
export {
    createTransaction, deleteTransaction, findTransaction, listTransactions, updateTransaction, type ListTransactionsOptions
} from './transactions';
export { createUserPreference, findUserPreference, updateUserPreference } from './user-preferences';

