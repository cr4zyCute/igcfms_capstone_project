import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getFundAccounts, 
  createFundAccount, 
  updateFundAccount, 
  deleteFundAccount,
  getTransactions 
} from '../services/api';

// Query keys for consistent cache management
export const FUND_ACCOUNTS_KEYS = {
  all: ['fundAccounts'],
  lists: () => [...FUND_ACCOUNTS_KEYS.all, 'list'],
  list: (filters) => [...FUND_ACCOUNTS_KEYS.lists(), { filters }],
  details: () => [...FUND_ACCOUNTS_KEYS.all, 'detail'],
  detail: (id) => [...FUND_ACCOUNTS_KEYS.details(), id],
  transactions: (id) => [...FUND_ACCOUNTS_KEYS.detail(id), 'transactions'],
};

// Hook to fetch paginated fund accounts
export const useFundAccounts = (options = {}) => {
  const { 
    page = 1, 
    limit = 20, 
    search = '', 
    enabled = true,
    refetchInterval = 10000 // Refetch every 10 seconds to reduce load
  } = options;

  return useQuery({
    queryKey: FUND_ACCOUNTS_KEYS.list({ page, limit, search }),
    queryFn: async () => {
      const accounts = await getFundAccounts();
      
      // Client-side filtering and pagination for now
      // In a real app, this would be handled by the API
      let filteredAccounts = accounts;
      
      if (search) {
        const searchLower = search.toLowerCase();
        filteredAccounts = accounts.filter(account => 
          account.name?.toLowerCase().includes(searchLower) ||
          account.code?.toLowerCase().includes(searchLower) ||
          account.description?.toLowerCase().includes(searchLower) ||
          account.account_type?.toLowerCase().includes(searchLower)
        );
      }
      
      // Add basic graph data for each account (last 20 transactions)
      const accountsWithGraphData = await Promise.all(
        filteredAccounts.map(async (account) => {
          try {
            // Fetch recent transactions for graph data
            const transactions = await getTransactions({ 
              fund_account_id: account.id,
              limit: 20 
            });
            
            // Ensure we only get transactions for this specific account
            const accountTransactions = Array.isArray(transactions) 
              ? transactions.filter(tx => 
                  parseInt(tx.fund_account_id, 10) === parseInt(account.id, 10)
                )
              : [];
            
            const graphData = accountTransactions
              .filter(tx => tx.type !== 'INITIAL_BALANCE')
              .sort((a, b) => new Date(a.created_at) - new Date(b.created_at)) // Sort chronologically
              .slice(-20) // Get last 20 transactions
              .map(t => ({
                    date: t.created_at,
                    balance: t.balance_after_transaction ?? account.current_balance,
                    amount: parseFloat(t.amount) || 0,
                    type: t.type || 'Unknown',
                    recipient: t.recipient || t.payee_name || null,
                    payer_name: t.payer_name || null,
                    payee_name: t.payee_name || t.recipient || null,
                    description: t.description || '',
                    reference: t.reference || t.reference_no || '',
                  }));
            
            return {
              ...account,
              graphData,
              transactionCount: accountTransactions.length
            };
          } catch (error) {
            console.warn(`Failed to fetch graph data for account ${account.id}:`, error);
            return {
              ...account,
              graphData: [],
              transactionCount: 0
            };
          }
        })
      );
      
      // Simulate pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedAccounts = accountsWithGraphData.slice(startIndex, endIndex);
      
      return {
        data: paginatedAccounts,
        total: filteredAccounts.length,
        page,
        limit,
        totalPages: Math.ceil(filteredAccounts.length / limit)
      };
    },
    enabled,
    refetchInterval,
    staleTime: 30 * 1000, // Consider data stale after 30 seconds
    cacheTime: 2 * 60 * 1000, // Keep in cache for 2 minutes
  });
};

// Hook to create a new fund account
export const useCreateFundAccount = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createFundAccount,
    onSuccess: (newAccount) => {
      // Simple cache invalidation - let React Query handle the rest
      queryClient.invalidateQueries({ queryKey: FUND_ACCOUNTS_KEYS.all });
      
      console.log('✅ Fund account created successfully');
    },
    onError: (error) => {
      console.error('❌ Failed to create fund account:', error);
    },
  });
};

// Hook to update a fund account
export const useUpdateFundAccount = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => updateFundAccount(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: FUND_ACCOUNTS_KEYS.all });

      // Snapshot the previous value
      const previousAccounts = queryClient.getQueriesData({ queryKey: FUND_ACCOUNTS_KEYS.all });

      // Optimistically update the account in the cache
      queryClient.setQueriesData({ queryKey: FUND_ACCOUNTS_KEYS.all }, (old) => {
        if (!old?.data) return old;
        
        return {
          ...old,
          data: old.data.map(account => 
            account.id === id 
              ? { 
                  ...account, 
                  ...data,
                  current_balance: data.initial_balance || account.current_balance
                }
              : account
          )
        };
      });

      return { previousAccounts };
    },
    onSuccess: (data, variables) => {
      // Invalidate to get fresh data from server
      queryClient.invalidateQueries({ queryKey: FUND_ACCOUNTS_KEYS.all });
      
      console.log('✅ Fund account updated successfully, cache updated');
    },
    onError: (error, variables, context) => {
      // If the mutation fails, use the context to roll back
      if (context?.previousAccounts) {
        context.previousAccounts.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      console.error('❌ Failed to update fund account:', error);
    },
  });
};

// Hook to delete a fund account
export const useDeleteFundAccount = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteFundAccount,
    onSuccess: (data, accountId) => {
      // Simple cache invalidation
      queryClient.invalidateQueries({ queryKey: FUND_ACCOUNTS_KEYS.all });
      
      console.log('✅ Fund account deleted successfully');
    },
    onError: (error) => {
      console.error('❌ Failed to delete fund account:', error);
    },
  });
};
