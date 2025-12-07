import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import API_BASE_URL from '../config/api';
import { useEffect } from 'react';
import { subscribeToFundTransactions } from '../services/fundTransactionChannel';

const API_BASE = API_BASE_URL;

// Query keys for consistent cache management
export const DISBURSEMENTS_KEYS = {
  all: ['disbursements'],
  lists: () => [...DISBURSEMENTS_KEYS.all, 'list'],
  list: (filters) => [...DISBURSEMENTS_KEYS.lists(), { filters }],
  details: () => [...DISBURSEMENTS_KEYS.all, 'detail'],
  detail: (id) => [...DISBURSEMENTS_KEYS.details(), id],
};

// Fetch disbursements by filtering transactions (ensures older records are included)
const fetchDisbursements = async () => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No authentication token found');

  const headers = { Authorization: `Bearer ${token}` };
  const response = await axios.get(`${API_BASE}/transactions`, { headers });
  const txs = Array.isArray(response.data) ? response.data : (response.data?.data || []);

  const mapped = txs
    .filter((tx) => (tx?.type || '').toLowerCase() === 'disbursement')
    .map((tx) => {
      const issuerIdRaw =
        tx.issued_by ??
        tx.issuedBy ??
        tx.user_id ??
        tx.userId ??
        tx.created_by ??
        tx.creator_id ??
        tx.disbursing_officer_id ??
        (tx.issued_by_user && tx.issued_by_user.id) ??
        (tx.user && tx.user.id) ??
        (tx.creator && tx.creator.id);

      const issuerNameRaw =
        (tx.issued_by_user && tx.issued_by_user.name) ??
        (tx.user && tx.user.name) ??
        (tx.creator && tx.creator.name) ??
        tx.issuer_name ??
        'N/A';

      return {
        id: tx.id,
        reference: tx.reference || tx.reference_no || tx.receipt_no || '',
        recipient: tx.recipient || 'N/A',
        amount: Math.abs(Number(tx.amount) || 0),
        mode_of_payment: tx.mode_of_payment || 'N/A',
        created_at: tx.created_at || tx.updated_at,
        issuer_id: issuerIdRaw != null ? Number(issuerIdRaw) : null,
        issuer_name: issuerNameRaw,
      };
    })
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

  return mapped;
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
    refetchInterval = false // Disable auto-refresh for faster load
  } = options;

  const queryClient = useQueryClient();

  // Real-time subscription: refresh disbursements (and fund accounts) when a disbursement event is broadcast
  useEffect(() => {
    const unsubscribe = subscribeToFundTransactions((event) => {
      if (!event) return;
      if (event.type === 'disbursement') {
        // Invalidate queries so React Query refetches latest data
        queryClient.invalidateQueries({ queryKey: DISBURSEMENTS_KEYS.all });
        queryClient.invalidateQueries({ queryKey: ['fundAccounts'] });
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [queryClient]);

  return useQuery({
    queryKey: DISBURSEMENTS_KEYS.list({}),
    queryFn: fetchDisbursements,
    enabled,
    refetchInterval,
    staleTime: 10 * 60 * 1000, // 10 minutes to avoid frequent refetches
    cacheTime: 15 * 60 * 1000, // 15 minutes cache
    refetchOnWindowFocus: false, // Do not refetch on focus to reduce load
    keepPreviousData: true,
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
