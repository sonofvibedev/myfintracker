import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  accountBalances,
  archiveAccount,
  deleteAccount,
  deleteCategory,
  listAccounts,
  listCategories,
  listTransactions,
  saveAccount,
  saveCategory,
  saveTransaction,
  deleteTransaction,
} from './repo'
import { getSettings, saveSettings } from './db'

/** Every write touches balances, so mutations refresh the lot. The dataset is
 *  a personal ledger on one device — refetching it all is cheaper than
 *  tracking which query each write invalidated. */
function useWrite<TArgs extends unknown[], TResult>(fn: (...args: TArgs) => Promise<TResult>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: TArgs) => fn(...args),
    onSuccess: () => qc.invalidateQueries(),
  })
}

export function useAccounts(includeArchived = false) {
  return useQuery({
    queryKey: ['accounts', includeArchived],
    queryFn: () => listAccounts(includeArchived),
  })
}

export function useBalances() {
  return useQuery({ queryKey: ['balances'], queryFn: accountBalances })
}

export function useCategories(kind?: 'expense' | 'income') {
  return useQuery({ queryKey: ['categories', kind], queryFn: () => listCategories(kind) })
}

export function useTransactions() {
  return useQuery({ queryKey: ['transactions'], queryFn: listTransactions })
}

export function useSettings() {
  return useQuery({ queryKey: ['settings'], queryFn: getSettings })
}

export const useSaveAccount = () => useWrite(saveAccount)
export const useArchiveAccount = () => useWrite(archiveAccount)
export const useDeleteAccount = () => useWrite(deleteAccount)
export const useSaveCategory = () => useWrite(saveCategory)
export const useDeleteCategory = () => useWrite(deleteCategory)
export const useSaveTransaction = () => useWrite(saveTransaction)
export const useDeleteTransaction = () => useWrite(deleteTransaction)
export const useSaveSettings = () => useWrite(saveSettings)
