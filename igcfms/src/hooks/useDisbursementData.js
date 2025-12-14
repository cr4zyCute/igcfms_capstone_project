import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Fetch disbursements
const fetchDisbursements = async () => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No authentication token found');

  const headers = { Authorization: `Bearer ${token}` };
  const response = await axios.get(`${API_BASE_URL}/transactions`, { headers });
  return response.data || [];
};

// Fetch fund accounts
const fetchFundAccounts = async () => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No authentication token found');

  const headers = { Authorization: `Bearer ${token}` };
  const response = await axios.get(`${API_BASE_URL}/fund-accounts`, { headers });
  return response.data || [];
};

// Hook to fetch disbursements
export const useDisbursements = (options = {}) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['disbursements'],
    queryFn: fetchDisbursements,
    enabled,
    staleTime: Infinity, // Never stale - WebSocket keeps data fresh
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchInterval: false, // NO auto-refresh - WebSocket only
    refetchOnWindowFocus: false,
    retry: 2,
  });
};

// Hook to fetch fund accounts
export const useFundAccountsForDisbursement = (options = {}) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['fundAccounts'],
    queryFn: fetchFundAccounts,
    enabled,
    staleTime: Infinity, // Never stale - WebSocket keeps data fresh
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchInterval: false, // NO auto-refresh - WebSocket only
    refetchOnWindowFocus: false,
    retry: 2,
  });
};
