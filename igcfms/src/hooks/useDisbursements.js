import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Query keys for consistent cache management
export const DISBURSEMENTS_KEYS = {
  all: ['disbursements'],
  lists: () => [...DISBURSEMENTS_KEYS.all, 'list'],
  list: (filters) => [...DISBURSEMENTS_KEYS.lists(), { filters }],
  details: () => [...DISBURSEMENTS_KEYS.all, 'detail'],
  detail: (id) => [...DISBURSEMENTS_KEYS.details(), id],
};

// Fetch disbursements from transactions
const fetchDisbursements = async () => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No authentication token found');

  const headers = { Authorization: `Bearer ${token}` };
  
  // Fetch all transactions
  const response = await axios.get(`${API_BASE}/transactions`, { headers });
  const allTransactions = response.data || [];
  
  // Filter only disbursements and sort by date
  const disbursements = allTransactions
    .filter(tx => tx.type === 'Disbursement')
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  
  return disbursements;
};

// Fetch fund accounts
const fetchFundAccounts = async () => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No authentication token found');

  const headers = { Authorization: `Bearer ${token}` };
  const response = await axios.get(`${API_BASE}/fund-accounts`, { headers });
  return Array.isArray(response.data) ? response.data : (response.data?.data || []);
};

// Fetch recipient accounts
const fetchRecipientAccounts = async () => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No authentication token found');

  const headers = { Authorization: `Bearer ${token}` };
  const response = await axios.get(`${API_BASE}/recipient-accounts?status=active`, { headers });
  
  if (response.data?.success && Array.isArray(response.data.data)) {
    return response.data.data;
  } else if (Array.isArray(response.data)) {
    return response.data;
  } else if (response.data?.data && Array.isArray(response.data.data)) {
    return response.data.data;
  }
  return [];
};

// Hook to fetch disbursements
export const useDisbursements = (options = {}) => {
  const { 
    enabled = true,
    refetchInterval = 30000 // Refetch every 30 seconds
  } = options;

  return useQuery({
    queryKey: DISBURSEMENTS_KEYS.list({}),
    queryFn: fetchDisbursements,
    enabled,
    refetchInterval,
    staleTime: 10000, // Consider data stale after 10 seconds
    cacheTime: 300000, // Keep in cache for 5 minutes
  });
};

// Hook to fetch fund accounts
export const useFundAccountsForDisbursement = (options = {}) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['fundAccounts', 'disbursement'],
    queryFn: fetchFundAccounts,
    enabled,
    staleTime: 30000,
    cacheTime: 300000,
  });
};

// Hook to fetch recipient accounts
export const useRecipientAccountsForDisbursement = (options = {}) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['recipientAccounts', 'disbursement'],
    queryFn: fetchRecipientAccounts,
    enabled,
    staleTime: 30000,
    cacheTime: 300000,
  });
};

// Hook to create disbursement
export const useCreateDisbursement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (disbursementData) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const headers = { Authorization: `Bearer ${token}` };
      
      // Create transaction first
      const transactionRes = await axios.post(
        `${API_BASE}/transactions`,
        disbursementData.transaction,
        { headers }
      );

      const transactionId = transactionRes.data.id || transactionRes.data.data?.id;

      // Create disbursement record
      const disbursementPayload = {
        ...disbursementData.disbursement,
        transaction_id: transactionId,
      };

      await axios.post(
        `${API_BASE}/disbursements`,
        disbursementPayload,
        { headers }
      );

      return { transactionId, ...transactionRes.data };
    },
    onSuccess: () => {
      // Invalidate and refetch disbursements
      queryClient.invalidateQueries({ queryKey: DISBURSEMENTS_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['fundAccounts'] });
    },
  });
};

export default useDisbursements;
