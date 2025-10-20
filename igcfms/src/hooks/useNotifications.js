import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import API_BASE_URL from '../config/api';

const API_BASE = API_BASE_URL;

// Query keys for consistent cache management
export const NOTIFICATION_KEYS = {
  all: ['notifications'],
  lists: () => [...NOTIFICATION_KEYS.all, 'list'],
  list: (filters) => [...NOTIFICATION_KEYS.lists(), { filters }],
  details: () => [...NOTIFICATION_KEYS.all, 'detail'],
  detail: (id) => [...NOTIFICATION_KEYS.details(), id],
  unreadCount: () => [...NOTIFICATION_KEYS.all, 'unreadCount'],
};

// Fetch all notifications
const fetchNotifications = async (params = {}) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No authentication token found');

  const headers = { Authorization: `Bearer ${token}` };
  const { limit } = params;
  
  const url = limit ? `${API_BASE}/notifications?limit=${limit}` : `${API_BASE}/notifications`;
  const response = await axios.get(url, { headers });
  
  return response.data.notifications || response.data || [];
};

// Fetch unread count
const fetchUnreadCount = async () => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No authentication token found');

  const headers = { Authorization: `Bearer ${token}` };
  const response = await axios.get(`${API_BASE}/notifications/unread-count`, { headers });
  
  return response.data.unread_count || 0;
};

// Mark notification as read
const markNotificationAsRead = async (notificationId) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No authentication token found');

  const headers = { Authorization: `Bearer ${token}` };
  const response = await axios.put(`${API_BASE}/notifications/${notificationId}/read`, {}, { headers });
  
  return response.data;
};

// Mark all notifications as read
const markAllNotificationsAsRead = async () => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No authentication token found');

  const headers = { Authorization: `Bearer ${token}` };
  const response = await axios.put(`${API_BASE}/notifications/mark-all-read`, {}, { headers });
  
  return response.data;
};

// Hook to fetch notifications
export const useNotifications = (options = {}) => {
  const { enabled = true, refetchInterval = 30000, limit } = options;

  return useQuery({
    // Always use same cache key regardless of limit (for shared cache)
    queryKey: NOTIFICATION_KEYS.list({}),
    queryFn: () => fetchNotifications({}), // Always fetch all notifications
    enabled,
    refetchInterval,
    staleTime: 10000, // 10 seconds
    cacheTime: 300000, // 5 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    // Transform data to apply limit on client side if needed
    select: (data) => limit ? data.slice(0, limit) : data,
  });
};

// Hook to fetch unread count
export const useUnreadCount = (options = {}) => {
  const { enabled = true, refetchInterval = 30000 } = options;

  return useQuery({
    queryKey: NOTIFICATION_KEYS.unreadCount(),
    queryFn: fetchUnreadCount,
    enabled,
    refetchInterval,
    staleTime: 10000,
    cacheTime: 300000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
};

// Hook to mark notification as read
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      // Invalidate and refetch notifications and unread count
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
    },
  });
};

// Hook to mark all notifications as read
export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      // Invalidate and refetch notifications and unread count
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
    },
  });
};

export default useNotifications;
