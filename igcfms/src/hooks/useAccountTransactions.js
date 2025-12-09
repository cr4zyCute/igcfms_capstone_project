import { useQuery } from '@tanstack/react-query';
import { getFundAccount, getTransactions } from '../services/api';
import { FUND_ACCOUNTS_KEYS } from './useFundAccounts';

// Hook to fetch transactions for a specific account
export const useAccountTransactions = (accountId, options = {}) => {
  const { 
    enabled = true,
    search = '',
    page = 1,
    limit = 50 
  } = options;

  return useQuery({
    queryKey: [...FUND_ACCOUNTS_KEYS.transactions(accountId), { search, page, limit }],
    queryFn: async () => {
      if (!accountId) return { data: [], total: 0, page, limit };

      try {
        // First try to get account with transactions
        const accountResponse = await getFundAccount(accountId);
        const accountData = Array.isArray(accountResponse)
          ? { transactions: accountResponse }
          : (accountResponse?.data || accountResponse);

        let transactions = [];

        // Filter transactions by account ID
        const filterByAccount = (txList = []) =>
          txList.filter(tx => parseInt(tx.fund_account_id, 10) === parseInt(accountId, 10));

        if (accountData?.transactions) {
          transactions = filterByAccount(accountData.transactions);
        }

        // If no transactions found, try direct API call
        if (transactions.length === 0) {
          try {
            const directResponse = await getTransactions({ fund_account_id: accountId });
            const fetchedTransactions = Array.isArray(directResponse)
              ? directResponse
              : (directResponse?.data || directResponse?.transactions || []);
            transactions = filterByAccount(fetchedTransactions);
          } catch (directApiError) {
            console.warn('Direct transactions API failed:', directApiError);
          }
        }

        // Apply search filter
        let filteredTransactions = transactions;
        if (search) {
          const searchLower = search.toLowerCase();
          filteredTransactions = transactions.filter(transaction =>
            transaction.description?.toLowerCase().includes(searchLower) ||
            transaction.type?.toLowerCase().includes(searchLower) ||
            transaction.recipient?.toLowerCase().includes(searchLower) ||
            transaction.payer_name?.toLowerCase().includes(searchLower) ||
            String(transaction.reference ?? '').toLowerCase().includes(searchLower) ||
            String(transaction.reference_no ?? '').toLowerCase().includes(searchLower) ||
            String(transaction.receipt_no ?? '').toLowerCase().includes(searchLower) ||
            transaction.amount?.toString().includes(search) ||
            new Date(transaction.created_at).toLocaleDateString().includes(search)
          );
        }

        // Sort by date (newest first)
        filteredTransactions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        // Apply pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

        return {
          data: paginatedTransactions,
          total: filteredTransactions.length,
          page,
          limit,
          totalPages: Math.ceil(filteredTransactions.length / limit),
          account: accountData
        };
      } catch (error) {
        console.error('Error fetching account transactions:', error);
        throw error;
      }
    },
    enabled: enabled && !!accountId,
    staleTime: Infinity, // Never stale - WebSocket keeps data fresh
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchInterval: false, // NO auto-refresh - WebSocket only
    refetchOnWindowFocus: false,
    retry: 2,
  });
};

// Hook to get the latest transaction for an account (for card display)
export const useLatestTransaction = (accountId, enabled = true) => {
  return useQuery({
    queryKey: [...FUND_ACCOUNTS_KEYS.detail(accountId), 'latest-transaction'],
    queryFn: async () => {
      if (!accountId) return null;

      try {
        const response = await getTransactions({ 
          fund_account_id: accountId,
          limit: 1,
          sort: 'created_at',
          order: 'desc'
        });
        
        const transactions = Array.isArray(response) ? response : (response?.data || []);
        return transactions.length > 0 ? transactions[0] : null;
      } catch (error) {
        console.warn(`Failed to fetch latest transaction for account ${accountId}:`, error);
        return null;
      }
    },
    enabled: enabled && !!accountId,
    staleTime: Infinity, // Never stale - WebSocket keeps data fresh
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchInterval: false, // NO auto-refresh - WebSocket only
    refetchOnWindowFocus: false,
  });
};
