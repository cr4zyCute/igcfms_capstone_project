import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getReports,
  getTransactions,
  getOverrideRequests,
  generateReport,
  deleteReport as deleteReportAPI,
} from '../services/api';

// Query key factory
export const REPORT_KEYS = {
  all: ['reports'],
  lists: () => [...REPORT_KEYS.all, 'list'],
  list: (filters = {}) => [...REPORT_KEYS.lists(), { filters }],
  details: () => [...REPORT_KEYS.all, 'detail'],
  detail: (id) => [...REPORT_KEYS.details(), id],
  transactionsRoot: () => [...REPORT_KEYS.all, 'transactions'],
  transactions: (filters = {}) => [...REPORT_KEYS.transactionsRoot(), { filters }],
  overridesRoot: () => [...REPORT_KEYS.all, 'overrides'],
  overrides: (filters = {}) => [...REPORT_KEYS.overridesRoot(), { filters }],
};

// Hooks
export const useReports = (options = {}) => {
  const { filters = {}, enabled = true, ...queryOptions } = options;

  return useQuery({
    queryKey: REPORT_KEYS.list(filters),
    queryFn: () => getReports(filters),
    enabled,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
    ...queryOptions,
  });
};

export const useTransactions = (options = {}) => {
  const { filters = {}, enabled = true, ...queryOptions } = options;

  return useQuery({
    queryKey: REPORT_KEYS.transactions(filters),
    queryFn: () => getTransactions(filters),
    enabled,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
    ...queryOptions,
  });
};

export const useOverrideRequests = (options = {}) => {
  const { filters = {}, isAdmin = true, enabled = true, ...queryOptions } = options;

  return useQuery({
    queryKey: REPORT_KEYS.overrides(filters),
    queryFn: () => getOverrideRequests(filters),
    enabled,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
    ...queryOptions,
  });
};

export const useCreateReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: generateReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REPORT_KEYS.all });
      queryClient.invalidateQueries({ queryKey: REPORT_KEYS.transactionsRoot() });
      queryClient.invalidateQueries({ queryKey: REPORT_KEYS.overridesRoot() });
    },
  });
};

export const useDeleteReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteReportAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REPORT_KEYS.all });
    },
  });
};
