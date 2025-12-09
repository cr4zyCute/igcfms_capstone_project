import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import API_BASE_URL from '../config/api';

const API_BASE = API_BASE_URL;

// Query keys for consistent cache management
export const KPI_KEYS = {
  all: ['kpiData'],
  transactions: () => [...KPI_KEYS.all, 'transactions'],
  reports: () => [...KPI_KEYS.all, 'reports'],
};

// Fetch transactions
const fetchTransactions = async () => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No authentication token found');

  const headers = { Authorization: `Bearer ${token}` };
  const response = await axios.get(`${API_BASE}/transactions`, { headers });
  return Array.isArray(response.data) ? response.data : response.data?.data || [];
};

// Fetch reports
const fetchReports = async () => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No authentication token found');

  const headers = { Authorization: `Bearer ${token}` };
  try {
    const response = await axios.get(`${API_BASE}/reports`, { headers });
    return Array.isArray(response.data) ? response.data : response.data?.data || [];
  } catch (error) {
    // If reports endpoint fails, return empty array
    return [];
  }
};

// Hook to fetch transactions for KPI
export const useKPITransactions = (options = {}) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: KPI_KEYS.transactions(),
    queryFn: fetchTransactions,
    enabled,
    staleTime: Infinity, // Never stale - WebSocket keeps data fresh
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchInterval: false, // NO auto-refresh - WebSocket only
    refetchOnWindowFocus: false,
    retry: 2,
  });
};

// Hook to fetch reports for KPI
export const useKPIReports = (options = {}) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: KPI_KEYS.reports(),
    queryFn: fetchReports,
    enabled,
    staleTime: Infinity, // Never stale - WebSocket keeps data fresh
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchInterval: false, // NO auto-refresh - WebSocket only
    refetchOnWindowFocus: false,
    retry: 2,
  });
};
