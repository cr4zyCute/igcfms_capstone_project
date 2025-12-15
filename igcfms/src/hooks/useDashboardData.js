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
  transactions: (year) => [...DASHBOARD_KEYS.all, 'transactions', year],
  overrides: (year) => [...DASHBOARD_KEYS.all, 'overrides', year],
  cheques: (year) => [...DASHBOARD_KEYS.all, 'cheques', year],
  collection: (year) => [...DASHBOARD_KEYS.all, 'collection', year],
  disburse: (year) => [...DASHBOARD_KEYS.all, 'disburse', year],
  topAccounts: (year) => [...DASHBOARD_KEYS.all, 'topAccounts', year],
  activityByRole: (year) => [...DASHBOARD_KEYS.all, 'activityByRole', year],
};

// Helper to check if date is in selected year
const isInYear = (dateStr, year) => {
  if (!year) return true;
  const date = new Date(dateStr);
  return date.getFullYear() === parseInt(year, 10);
};

// Helper to check if date is today AND in selected year
const isTodayInYear = (dateStr, year) => {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  
  const isToday = date.getTime() === today.getTime();
  const yearMatches = !year || date.getFullYear() === parseInt(year, 10);
  
  return isToday && yearMatches;
};

// API functions
const getRecentTransactions = async (year) => {
  const response = await api.get('/transactions', { params: { limit: 100 } });
  let transactions = Array.isArray(response.data) ? response.data : response.data.data || [];
  
  // Filter by year if provided
  if (year) {
    transactions = transactions.filter(t => isInYear(t.created_at, year));
  }
  
  // Return only the 10 most recent after filtering
  return transactions.slice(0, 10);
};

const getOverrideRequests = async (year) => {
  const response = await api.get('/override_requests');
  let requests = Array.isArray(response.data) ? response.data : response.data.data || [];
  
  // Filter by year if provided
  if (year) {
    requests = requests.filter(r => isInYear(r.created_at, year));
  }
  
  return {
    pending: requests.filter(r => r.status && r.status.toLowerCase() === 'pending').length,
    approve: requests.filter(r => r.status && r.status.toLowerCase() === 'approved').length,
    reject: requests.filter(r => r.status && r.status.toLowerCase() === 'rejected').length
  };
};

const getChequesAndReceipts = async (year) => {
  const [receiptResponse, chequeResponse] = await Promise.all([
    api.get('/receipts'),
    api.get('/cheques')
  ]);
  
  let receipts = Array.isArray(receiptResponse.data) ? receiptResponse.data : receiptResponse.data.data || [];
  let cheques = Array.isArray(chequeResponse.data) ? chequeResponse.data : chequeResponse.data.data || [];
  
  // Filter by year if provided
  if (year) {
    receipts = receipts.filter(r => isInYear(r.created_at || r.date, year));
    cheques = cheques.filter(c => isInYear(c.created_at || c.issue_date, year));
  }
  
  return {
    cheque: cheques.length,
    receipt: receipts.length
  };
};

const getTodaysCollection = async (year) => {
  const response = await api.get('/transactions');
  const transactions = Array.isArray(response.data) ? response.data : response.data.data || [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Only show today's data if selected year matches current year (or no year filter)
  const currentYear = today.getFullYear();
  if (year && parseInt(year, 10) !== currentYear) {
    return { count: 0, amount: 0 };
  }

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

const getTodaysDisburse = async (year) => {
  const response = await api.get('/transactions');
  const transactions = Array.isArray(response.data) ? response.data : response.data.data || [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Only show today's data if selected year matches current year (or no year filter)
  const currentYear = today.getFullYear();
  if (year && parseInt(year, 10) !== currentYear) {
    return { count: 0, amount: 0 };
  }

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

const getTopFundedAccounts = async (year) => {
  const [accountsResponse, transactionsResponse] = await Promise.all([
    api.get('/fund-accounts'),
    api.get('/transactions')
  ]);

  let fundAccounts = Array.isArray(accountsResponse.data) ? accountsResponse.data : [];
  let transactions = Array.isArray(transactionsResponse.data) ? transactionsResponse.data : transactionsResponse.data.data || [];

  // Filter transactions by year if provided
  if (year) {
    transactions = transactions.filter(t => isInYear(t.created_at, year));
  }

  // Calculate transaction counts and amounts per account for the filtered year
  const accountStats = {};
  transactions.forEach(t => {
    const accountId = t.fund_account_id;
    if (accountId) {
      if (!accountStats[accountId]) {
        accountStats[accountId] = { count: 0, amount: 0 };
      }
      accountStats[accountId].count += 1;
      accountStats[accountId].amount += parseFloat(t.amount || 0);
    }
  });

  // Map accounts with their year-filtered stats
  const accountsWithStats = fundAccounts.map(account => ({
    id: account.id,
    name: account.name || `Account ${account.id}`,
    totalAmount: accountStats[account.id]?.amount || 0,
    transactionCount: accountStats[account.id]?.count || 0
  }));

  // Sort by total amount for the year and get top 4
  const topAccounts = accountsWithStats
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 4);

  return topAccounts;
};

const getActivityByRole = async (year) => {
  const response = await api.get('/activity-logs/recent', { params: { limit: 1000 } });
  let activities = Array.isArray(response.data) ? response.data : response.data.data || [];

  // Filter activities by year if provided
  if (year) {
    activities = activities.filter(a => isInYear(a.created_at, year));
  }

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
export const useRecentTransactions = (year, options = {}) => {
  return useQuery({
    queryKey: DASHBOARD_KEYS.transactions(year),
    queryFn: () => getRecentTransactions(year),
    staleTime: Infinity, // Never stale - WebSocket keeps it fresh
    gcTime: 30 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
    refetchInterval: false, // NO auto-refresh - WebSocket only
    ...options,
  });
};

export const useOverrideRequests = (year, options = {}) => {
  return useQuery({
    queryKey: DASHBOARD_KEYS.overrides(year),
    queryFn: () => getOverrideRequests(year),
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    ...options,
  });
};

export const useChequesAndReceipts = (year, options = {}) => {
  return useQuery({
    queryKey: DASHBOARD_KEYS.cheques(year),
    queryFn: () => getChequesAndReceipts(year),
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    ...options,
  });
};

export const useTodaysCollection = (year, options = {}) => {
  return useQuery({
    queryKey: DASHBOARD_KEYS.collection(year),
    queryFn: () => getTodaysCollection(year),
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    ...options,
  });
};

export const useTodaysDisburse = (year, options = {}) => {
  return useQuery({
    queryKey: DASHBOARD_KEYS.disburse(year),
    queryFn: () => getTodaysDisburse(year),
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    ...options,
  });
};

export const useTopFundedAccounts = (year, options = {}) => {
  return useQuery({
    queryKey: DASHBOARD_KEYS.topAccounts(year),
    queryFn: () => getTopFundedAccounts(year),
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    ...options,
  });
};

export const useActivityByRole = (year, options = {}) => {
  return useQuery({
    queryKey: DASHBOARD_KEYS.activityByRole(year),
    queryFn: () => getActivityByRole(year),
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    ...options,
  });
};
