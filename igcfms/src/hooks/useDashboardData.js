import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import API_BASE_URL from '../config/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Query key factory
export const DASHBOARD_KEYS = {
  all: ['dashboard'],
  transactions: () => [...DASHBOARD_KEYS.all, 'transactions'],
  overrides: () => [...DASHBOARD_KEYS.all, 'overrides'],
  cheques: () => [...DASHBOARD_KEYS.all, 'cheques'],
  collection: () => [...DASHBOARD_KEYS.all, 'collection'],
  disburse: () => [...DASHBOARD_KEYS.all, 'disburse'],
  topAccounts: () => [...DASHBOARD_KEYS.all, 'topAccounts'],
  activityByRole: () => [...DASHBOARD_KEYS.all, 'activityByRole'],
};

// API functions
const getRecentTransactions = async () => {
  const response = await api.get('/transactions', { params: { limit: 10 } });
  return Array.isArray(response.data) ? response.data : response.data.data || [];
};

const getOverrideRequests = async () => {
  const response = await api.get('/override_requests');
  const requests = Array.isArray(response.data) ? response.data : response.data.data || [];
  
  return {
    pending: requests.filter(r => r.status && r.status.toLowerCase() === 'pending').length,
    approve: requests.filter(r => r.status && r.status.toLowerCase() === 'approved').length,
    reject: requests.filter(r => r.status && r.status.toLowerCase() === 'rejected').length
  };
};

const getChequesAndReceipts = async () => {
  const [receiptResponse, chequeResponse] = await Promise.all([
    api.get('/receipts'),
    api.get('/cheques')
  ]);
  
  const receipts = Array.isArray(receiptResponse.data) ? receiptResponse.data : receiptResponse.data.data || [];
  const cheques = Array.isArray(chequeResponse.data) ? chequeResponse.data : chequeResponse.data.data || [];
  
  return {
    cheque: cheques.length,
    receipt: receipts.length
  };
};

const getTodaysCollection = async () => {
  const response = await api.get('/transactions');
  const transactions = Array.isArray(response.data) ? response.data : response.data.data || [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayCollections = transactions.filter(t => {
    const transactionDate = new Date(t.created_at);
    transactionDate.setHours(0, 0, 0, 0);
    return t.type === 'Collection' && transactionDate.getTime() === today.getTime();
  });

  const totalAmount = todayCollections.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  return {
    count: todayCollections.length,
    amount: totalAmount
  };
};

const getTodaysDisburse = async () => {
  const response = await api.get('/transactions');
  const transactions = Array.isArray(response.data) ? response.data : response.data.data || [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayDisbursements = transactions.filter(t => {
    const transactionDate = new Date(t.created_at);
    transactionDate.setHours(0, 0, 0, 0);
    return t.type === 'Disbursement' && transactionDate.getTime() === today.getTime();
  });

  const totalAmount = todayDisbursements.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  return {
    count: todayDisbursements.length,
    amount: totalAmount
  };
};

const getTopFundedAccounts = async () => {
  const [accountsResponse, transactionsResponse] = await Promise.all([
    api.get('/fund-accounts'),
    api.get('/transactions')
  ]);

  let fundAccounts = Array.isArray(accountsResponse.data) ? accountsResponse.data : [];
  const transactions = Array.isArray(transactionsResponse.data) ? transactionsResponse.data : transactionsResponse.data.data || [];

  const transactionCounts = {};
  transactions.forEach(t => {
    const accountId = t.fund_account_id;
    if (accountId) {
      transactionCounts[accountId] = (transactionCounts[accountId] || 0) + 1;
    }
  });

  const topAccounts = fundAccounts
    .sort((a, b) => parseFloat(b.current_balance || 0) - parseFloat(a.current_balance || 0))
    .slice(0, 4)
    .map(account => ({
      id: account.id,
      name: account.name || `Account ${account.id}`,
      totalAmount: parseFloat(account.current_balance || 0),
      transactionCount: transactionCounts[account.id] || 0
    }));

  return topAccounts;
};

const getActivityByRole = async () => {
  const response = await api.get('/activity-logs/recent', { params: { limit: 500 } });
  const activities = Array.isArray(response.data) ? response.data : response.data.data || [];

  const roleMap = {};
  activities.forEach(activity => {
    const role = activity.user?.role || activity.role;
    if (role && role.toLowerCase() !== 'unknown') {
      if (!roleMap[role]) {
        roleMap[role] = 0;
      }
      roleMap[role] += 1;
    }
  });

  const roleData = Object.entries(roleMap)
    .map(([role, count]) => ({
      role,
      count,
      percentage: 0
    }))
    .sort((a, b) => b.count - a.count);

  const maxCount = roleData.length > 0 ? roleData[0].count : 1;
  roleData.forEach(item => {
    item.percentage = Math.round((item.count / maxCount) * 100);
  });

  return roleData;
};

// Hooks
export const useRecentTransactions = (options = {}) => {
  return useQuery({
    queryKey: DASHBOARD_KEYS.transactions(),
    queryFn: getRecentTransactions,
    staleTime: Infinity, // Never stale - WebSocket keeps it fresh
    gcTime: 30 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
    refetchInterval: false, // NO auto-refresh - WebSocket only
    ...options,
  });
};

export const useOverrideRequests = (options = {}) => {
  return useQuery({
    queryKey: DASHBOARD_KEYS.overrides(),
    queryFn: getOverrideRequests,
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    ...options,
  });
};

export const useChequesAndReceipts = (options = {}) => {
  return useQuery({
    queryKey: DASHBOARD_KEYS.cheques(),
    queryFn: getChequesAndReceipts,
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    ...options,
  });
};

export const useTodaysCollection = (options = {}) => {
  return useQuery({
    queryKey: DASHBOARD_KEYS.collection(),
    queryFn: getTodaysCollection,
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    ...options,
  });
};

export const useTodaysDisburse = (options = {}) => {
  return useQuery({
    queryKey: DASHBOARD_KEYS.disburse(),
    queryFn: getTodaysDisburse,
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    ...options,
  });
};

export const useTopFundedAccounts = (options = {}) => {
  return useQuery({
    queryKey: DASHBOARD_KEYS.topAccounts(),
    queryFn: getTopFundedAccounts,
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    ...options,
  });
};

export const useActivityByRole = (options = {}) => {
  return useQuery({
    queryKey: DASHBOARD_KEYS.activityByRole(),
    queryFn: getActivityByRole,
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    ...options,
  });
};
