import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import API_BASE_URL from '../config/api';

const API_BASE = API_BASE_URL;

// Query keys for consistent cache management
export const NOTIFICATION_KEYS = {
  all: ['notifications'],
  lists: () => {
    // Include user token in cache key to ensure different users have separate caches
    const token = localStorage.getItem('token');
    return [...NOTIFICATION_KEYS.all, 'list', { token }];
  },
  list: (filters) => [...NOTIFICATION_KEYS.lists(), { filters }],
  details: () => [...NOTIFICATION_KEYS.all, 'detail'],
  detail: (id) => [...NOTIFICATION_KEYS.details(), id],
  unreadCount: () => {
    // Include user token in cache key to ensure different users have separate caches
    const token = localStorage.getItem('token');
    return [...NOTIFICATION_KEYS.all, 'unreadCount', { token }];
  },
};

// Fetch all notifications
const fetchNotifications = async (params = {}) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No authentication token found');

  const headers = { Authorization: `Bearer ${token}` };
  const { limit, fetchAll } = params;
  
  // If fetchAll is true, get all notifications for the NotificationBar page
  let url = `${API_BASE}/notifications`;
  if (fetchAll) {
    url = `${API_BASE}/notifications?all=true`;
  } else if (limit) {
    url = `${API_BASE}/notifications?limit=${limit}`;
  }
  
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
  const { enabled = true, limit, fetchAll = false } = options;

  return useQuery({
    // Use different cache key for fetchAll to separate full list from limited list
    queryKey: fetchAll ? NOTIFICATION_KEYS.list({ fetchAll: true }) : NOTIFICATION_KEYS.list({}),
    queryFn: () => fetchNotifications({ fetchAll }),
    enabled,
    staleTime: Infinity, // Never stale - WebSocket keeps data fresh
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchInterval: false, // NO auto-refresh - WebSocket only
    retry: 2,
    refetchOnWindowFocus: false,
    // Transform data to apply limit on client side if needed
    select: (data) => limit ? data.slice(0, limit) : data,
  });
};

// Hook to fetch unread count
export const useUnreadCount = (options = {}) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: NOTIFICATION_KEYS.unreadCount(),
    queryFn: fetchUnreadCount,
    enabled,
    staleTime: Infinity, // Never stale - WebSocket keeps data fresh
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchInterval: false, // NO auto-refresh - WebSocket only
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
