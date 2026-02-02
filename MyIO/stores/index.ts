// stores/index.ts — Single entry for all stores; app imports from '@/stores'.

export { useAppStore } from './useAppStore';
export { useAuthStore, useAuthUser, type LoginCredentials } from './useAuthStore';
export { useDefaultAccountsStore } from './useDefaultAccountsStore';

