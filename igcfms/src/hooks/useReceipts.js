import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getReceipts,
  createReceipt,
  updateReceipt,
  deleteReceipt,
  cancelReceipt,
  getCollectionTransactions,
} from '../services/api';

export const RECEIPT_KEYS = {
  all: ['receipts'],
  lists: () => [...RECEIPT_KEYS.all, 'list'],
  list: (filters = {}) => [...RECEIPT_KEYS.lists(), { filters }],
  details: () => [...RECEIPT_KEYS.all, 'detail'],
  detail: (id) => [...RECEIPT_KEYS.details(), id],
  collectionTransactionsRoot: () => [...RECEIPT_KEYS.all, 'collection-transactions'],
  collectionTransactions: (params = {}) => [...RECEIPT_KEYS.collectionTransactionsRoot(), { params }],
};

export const useReceipts = (options = {}) => {
  const { filters = {}, enabled = true, ...queryOptions } = options;

  return useQuery({
    queryKey: RECEIPT_KEYS.list(filters),
    queryFn: () => getReceipts(filters),
    enabled,
    staleTime: Infinity, // Never stale - WebSocket keeps data fresh
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchInterval: false, // NO auto-refresh - WebSocket only
    refetchOnWindowFocus: false,
    retry: 2,
    ...queryOptions,
  });
};

export const useCollectionTransactions = (options = {}) => {
  const { params = {}, enabled = true, ...queryOptions } = options;

  return useQuery({
    queryKey: RECEIPT_KEYS.collectionTransactions(params),
    queryFn: () => getCollectionTransactions(params),
    enabled,
    staleTime: Infinity, // Never stale - WebSocket keeps data fresh
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchInterval: false, // NO auto-refresh - WebSocket only
    refetchOnWindowFocus: false,
    retry: 2,
    ...queryOptions,
  });
};

export const useCreateReceipt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createReceipt,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECEIPT_KEYS.all });
      queryClient.invalidateQueries({ queryKey: RECEIPT_KEYS.collectionTransactionsRoot() });
    },
  });
};

export const useCancelReceipt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => cancelReceipt(id, data),
    onSuccess: (_, variables) => {
      if (variables?.id) {
        queryClient.invalidateQueries({ queryKey: RECEIPT_KEYS.detail(variables.id) });
      }
      queryClient.invalidateQueries({ queryKey: RECEIPT_KEYS.all });
      queryClient.invalidateQueries({ queryKey: RECEIPT_KEYS.collectionTransactionsRoot() });
    },
  });
};

export const useUpdateReceipt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateReceipt(id, data),
    onSuccess: (_, variables) => {
      if (variables?.id) {
        queryClient.invalidateQueries({ queryKey: RECEIPT_KEYS.detail(variables.id) });
      }
      queryClient.invalidateQueries({ queryKey: RECEIPT_KEYS.all });
      queryClient.invalidateQueries({ queryKey: RECEIPT_KEYS.collectionTransactionsRoot() });
    },
  });
};

export const useDeleteReceipt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteReceipt,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECEIPT_KEYS.all });
      queryClient.invalidateQueries({ queryKey: RECEIPT_KEYS.collectionTransactionsRoot() });
    },
  });
};
