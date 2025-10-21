import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCheques,
  createCheque,
  getDisbursementTransactions,
  getFundAccounts,
} from '../services/api';

export const CHEQUE_KEYS = {
  all: ['cheques'],
  lists: () => [...CHEQUE_KEYS.all, 'list'],
  list: (filters = {}) => [...CHEQUE_KEYS.lists(), { filters }],
  details: () => [...CHEQUE_KEYS.all, 'detail'],
  detail: (id) => [...CHEQUE_KEYS.details(), id],
  disbursementTransactionsRoot: () => [...CHEQUE_KEYS.all, 'disbursement-transactions'],
  disbursementTransactions: (params = {}) => [...CHEQUE_KEYS.disbursementTransactionsRoot(), { params }],
  fundAccountsRoot: () => [...CHEQUE_KEYS.all, 'fund-accounts'],
  fundAccounts: (params = {}) => [...CHEQUE_KEYS.fundAccountsRoot(), { params }],
};

export const useCheques = (options = {}) => {
  const { filters = {}, enabled = true, ...queryOptions } = options;

  return useQuery({
    queryKey: CHEQUE_KEYS.list(filters),
    queryFn: () => getCheques(filters),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes - increased for better performance
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchInterval: queryOptions.refetchInterval ?? false, // Disable auto-refresh for faster load
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    ...queryOptions,
  });
};

export const useDisbursementTransactions = (options = {}) => {
  const { params = {}, enabled = true, ...queryOptions } = options;

  return useQuery({
    queryKey: CHEQUE_KEYS.disbursementTransactions(params),
    queryFn: () => getDisbursementTransactions(params),
    enabled,
    staleTime: 60 * 1000, // 1 minute
    cacheTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    ...queryOptions,
  });
};

export const useFundAccounts = (options = {}) => {
  const { params = {}, enabled = true, ...queryOptions } = options;

  return useQuery({
    queryKey: CHEQUE_KEYS.fundAccounts(params),
    queryFn: () => getFundAccounts(params),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes (fund accounts don't change often)
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    ...queryOptions,
  });
};

export const useCreateCheque = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCheque,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHEQUE_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CHEQUE_KEYS.disbursementTransactionsRoot() });
    },
  });
};
