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
export const ACTIVITY_KEYS = {
  all: ['activities'],
  lists: () => [...ACTIVITY_KEYS.all, 'list'],
  list: (filters = {}) => [...ACTIVITY_KEYS.lists(), { filters }],
  statistics: () => [...ACTIVITY_KEYS.all, 'statistics'],
  stats: (filters = {}) => [...ACTIVITY_KEYS.statistics(), { filters }],
};

// API functions
const getRecentActivities = async (params = {}) => {
  try {
    const response = await api.get('/activity-logs/recent', { params: { limit: 20, ...params } });
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getActivityStatistics = async (params = {}) => {
  try {
    const response = await api.get('/activity-logs/statistics', { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Hooks
export const useRecentActivities = (options = {}) => {
  const { filters = {}, enabled = true, ...queryOptions } = options;

  return useQuery({
    queryKey: ACTIVITY_KEYS.list(filters),
    queryFn: () => getRecentActivities(filters),
    enabled,
    staleTime: Infinity, // Never stale - WebSocket keeps data fresh
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    refetchInterval: false, // NO auto-refresh - WebSocket only
    ...queryOptions,
  });
};

export const useActivityStatistics = (options = {}) => {
  const { filters = {}, enabled = true, ...queryOptions } = options;

  return useQuery({
    queryKey: ACTIVITY_KEYS.stats(filters),
    queryFn: () => getActivityStatistics(filters),
    enabled,
    staleTime: Infinity, // Never stale - WebSocket keeps data fresh
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    refetchInterval: false, // NO auto-refresh - WebSocket only
    ...queryOptions,
  });
};
