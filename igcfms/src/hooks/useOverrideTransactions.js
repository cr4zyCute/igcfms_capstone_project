import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import API_BASE_URL from '../config/api';

const API_BASE = API_BASE_URL;

// Query keys for consistent cache management
export const OVERRIDE_TRANSACTIONS_KEYS = {
  all: ['overrideTransactions'],
  lists: () => [...OVERRIDE_TRANSACTIONS_KEYS.all, 'list'],
  list: (filters) => [...OVERRIDE_TRANSACTIONS_KEYS.lists(), { filters }],
  details: () => [...OVERRIDE_TRANSACTIONS_KEYS.all, 'detail'],
  detail: (id) => [...OVERRIDE_TRANSACTIONS_KEYS.details(), id],
  transactions: () => ['transactions', 'override'],
  myRequests: () => [...OVERRIDE_TRANSACTIONS_KEYS.all, 'myRequests'],
};

// Fetch all transactions
const fetchTransactions = async () => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No authentication token found');

  const headers = { Authorization: `Bearer ${token}` };
  const response = await axios.get(`${API_BASE}/transactions`, { headers });
  return response.data || [];
};

// Fetch override requests (Admin)
const fetchOverrideRequests = async () => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No authentication token found');

  const headers = { Authorization: `Bearer ${token}` };
  const response = await axios.get(`${API_BASE}/override_requests`, { headers });
  return response.data || [];
};

// Fetch my override requests (Cashier)
const fetchMyOverrideRequests = async () => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No authentication token found');

  const headers = { Authorization: `Bearer ${token}` };
  const response = await axios.get(`${API_BASE}/override_requests/my_requests`, { headers });
  return response.data || [];
};

// Hook to fetch transactions
export const useTransactions = (options = {}) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: OVERRIDE_TRANSACTIONS_KEYS.transactions(),
    queryFn: fetchTransactions,
    enabled,
    staleTime: Infinity, // Never stale - WebSocket keeps data fresh
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchInterval: false, // NO auto-refresh - WebSocket only
    refetchOnWindowFocus: false,
    retry: 2,
  });
};

// Hook to fetch override requests (Admin)
export const useOverrideRequests = (options = {}) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: OVERRIDE_TRANSACTIONS_KEYS.list({}),
    queryFn: fetchOverrideRequests,
    enabled,
    staleTime: Infinity, // Never stale - WebSocket keeps data fresh
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchInterval: false, // NO auto-refresh - WebSocket only
    refetchOnWindowFocus: false,
    retry: 2,
  });
};

// Hook to fetch my override requests (Cashier)
export const useMyOverrideRequests = (options = {}) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: OVERRIDE_TRANSACTIONS_KEYS.myRequests(),
    queryFn: fetchMyOverrideRequests,
    enabled,
    staleTime: Infinity, // Never stale - WebSocket keeps data fresh
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchInterval: false, // NO auto-refresh - WebSocket only
    refetchOnWindowFocus: false,
    retry: 2,
  });
};

// Hook to create override request
export const useCreateOverrideRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestData) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const headers = { Authorization: `Bearer ${token}` };
      
      const response = await axios.post(
        `${API_BASE}/transactions/override`,
        requestData,
        { headers }
      );

      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch override requests
      queryClient.invalidateQueries({ queryKey: OVERRIDE_TRANSACTIONS_KEYS.all });
      queryClient.invalidateQueries({ queryKey: OVERRIDE_TRANSACTIONS_KEYS.transactions() });
    },
  });
};

// Hook to review override request (Admin)
export const useReviewOverrideRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, status, review_notes }) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const headers = { Authorization: `Bearer ${token}` };
      
      const response = await axios.put(
        `${API_BASE}/override_requests/${requestId}/review`,
        { status, review_notes },
        { headers }
      );

      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch override requests
      queryClient.invalidateQueries({ queryKey: OVERRIDE_TRANSACTIONS_KEYS.all });
    },
  });
};

export default useOverrideRequests;
