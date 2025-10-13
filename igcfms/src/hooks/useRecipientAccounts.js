import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Query keys for recipients
export const RECIPIENT_ACCOUNTS_KEYS = {
  all: ['recipient-accounts'],
  lists: () => [...RECIPIENT_ACCOUNTS_KEYS.all, 'list'],
  list: (filters) => [...RECIPIENT_ACCOUNTS_KEYS.lists(), filters],
  details: () => [...RECIPIENT_ACCOUNTS_KEYS.all, 'detail'],
  detail: (id) => [...RECIPIENT_ACCOUNTS_KEYS.details(), id],
  transactions: (id) => [...RECIPIENT_ACCOUNTS_KEYS.detail(id), 'transactions'],
};

// API functions
const fetchRecipientAccounts = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/recipient-accounts', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  return data.success ? data.data : [];
};

const fetchRecipientTransactions = async (recipientId) => {
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch(`/api/recipient-accounts/${recipientId}/transactions`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      // If endpoint doesn't exist (404), return empty array instead of throwing error
      if (response.status === 404) {
        console.warn(`Transaction endpoint not implemented yet for recipient ${recipientId}`);
        return [];
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    // If network error or endpoint doesn't exist, return empty array
    console.warn(`Could not fetch transactions for recipient ${recipientId}:`, error.message);
    return [];
  }
};

const createRecipientAccount = async (recipientData) => {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/recipient-accounts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(recipientData)
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  return data;
};

const updateRecipientAccount = async ({ id, data: recipientData }) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`/api/recipient-accounts/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(recipientData)
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  return data;
};

const deleteRecipientAccount = async (id) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`/api/recipient-accounts/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  return data;
};

const toggleRecipientStatus = async (id) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`/api/recipient-accounts/${id}/toggle-status`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  return data;
};

// Custom hooks
export const useRecipientAccounts = (options = {}) => {
  return useQuery({
    queryKey: RECIPIENT_ACCOUNTS_KEYS.list(options),
    queryFn: fetchRecipientAccounts,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
    refetchOnWindowFocus: false,
    ...options
  });
};

export const useRecipientTransactions = (recipientId, options = {}) => {
  return useQuery({
    queryKey: RECIPIENT_ACCOUNTS_KEYS.transactions(recipientId),
    queryFn: () => fetchRecipientTransactions(recipientId),
    enabled: !!recipientId && options.enabled !== false,
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    ...options
  });
};

export const useCreateRecipientAccount = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createRecipientAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECIPIENT_ACCOUNTS_KEYS.all });
    },
  });
};

export const useUpdateRecipientAccount = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateRecipientAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECIPIENT_ACCOUNTS_KEYS.all });
    },
  });
};

export const useDeleteRecipientAccount = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteRecipientAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECIPIENT_ACCOUNTS_KEYS.all });
    },
  });
};

export const useToggleRecipientStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: toggleRecipientStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECIPIENT_ACCOUNTS_KEYS.all });
    },
  });
};
