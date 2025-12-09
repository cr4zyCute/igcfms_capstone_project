import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import API_BASE_URL from '../config/api';

const API_BASE = API_BASE_URL;

// Query keys for consistent cache management
export const TRANSACTION_MANAGEMENT_KEYS = {
  all: ['transactionManagement'],
  lists: () => [...TRANSACTION_MANAGEMENT_KEYS.all, 'list'],
  list: (filters = {}) => [...TRANSACTION_MANAGEMENT_KEYS.lists(), { filters }],
  transactions: () => [...TRANSACTION_MANAGEMENT_KEYS.all, 'transactions'],
  overrideRequests: () => [...TRANSACTION_MANAGEMENT_KEYS.all, 'overrideRequests'],
};

// Fetch transactions
const fetchTransactions = async () => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No authentication token found');

  const headers = { Authorization: `Bearer ${token}` };
  const response = await axios.get(`${API_BASE}/transactions`, { headers });
  return response.data || [];
};

// Fetch override requests
const fetchOverrideRequests = async () => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No authentication token found');

  const headers = { Authorization: `Bearer ${token}` };
  try {
    const response = await axios.get(`${API_BASE}/override-requests`, { headers });
    return response.data || [];
  } catch (error) {
    // If override requests endpoint fails, return empty array
    return [];
  }
};

// Hook to fetch transactions
export const useTransactionManagementTransactions = (options = {}) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: TRANSACTION_MANAGEMENT_KEYS.transactions(),
    queryFn: fetchTransactions,
    enabled,
    staleTime: Infinity, // Never stale - WebSocket keeps data fresh
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchInterval: false, // NO auto-refresh - WebSocket only
    refetchOnWindowFocus: false,
    retry: 2,
  });
};

// Hook to fetch override requests
export const useTransactionManagementOverrideRequests = (options = {}) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: TRANSACTION_MANAGEMENT_KEYS.overrideRequests(),
    queryFn: fetchOverrideRequests,
    enabled,
    staleTime: Infinity, // Never stale - WebSocket keeps data fresh
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchInterval: false, // NO auto-refresh - WebSocket only
    refetchOnWindowFocus: false,
    retry: 2,
  });
};
