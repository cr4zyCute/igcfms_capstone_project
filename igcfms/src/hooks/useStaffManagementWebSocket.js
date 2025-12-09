import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { STAFF_KEYS } from './useStaffManagement';

const WS_BASE_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8000';

export const useStaffManagementWebSocket = () => {
  const wsRef = useRef(null);
  const queryClient = useQueryClient();
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      if (!token) return;

      const wsUrl = `${WS_BASE_URL}/staff?token=${token}`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('🔴 Staff Management WebSocket connected - Real-time updates ACTIVE (NO auto-refresh)');
        reconnectAttemptsRef.current = 0;
        
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'subscribe',
            channels: ['staff', 'users', 'staff_status_changes']
          }));
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          // Direct cache updates - instant UI update without refetch
          if (message.type === 'staff_created' && message.data) {
            queryClient.setQueryData(
              STAFF_KEYS.lists(),
              (oldData) => {
                if (!oldData) return [message.data];
                return Array.isArray(oldData) 
                  ? [message.data, ...oldData]
                  : [message.data, ...(oldData.data || [])];
              }
            );
          } else if (message.type === 'staff_updated' && message.data) {
            queryClient.setQueryData(
              STAFF_KEYS.lists(),
              (oldData) => {
                if (!oldData) return [message.data];
                const updateData = (items) => items.map(staff =>
                  staff.id === message.data.id ? { ...staff, ...message.data } : staff
                );
                return Array.isArray(oldData) 
                  ? updateData(oldData)
                  : { ...oldData, data: updateData(oldData.data || []) };
              }
            );
            // Also update detail cache if exists
            if (message.data.id) {
              queryClient.setQueryData(
                STAFF_KEYS.detail(message.data.id),
                (oldData) => oldData ? { ...oldData, ...message.data } : message.data
              );
            }
          } else if (message.type === 'staff_status_changed' && message.data) {
            // Update staff status
            queryClient.setQueryData(
              STAFF_KEYS.lists(),
              (oldData) => {
                if (!oldData) return [message.data];
                const updateData = (items) => items.map(staff =>
                  staff.id === message.data.id ? { ...staff, ...message.data } : staff
                );
                return Array.isArray(oldData) 
                  ? updateData(oldData)
                  : { ...oldData, data: updateData(oldData.data || []) };
              }
            );
            // Also update detail cache if exists
            if (message.data.id) {
              queryClient.setQueryData(
                STAFF_KEYS.detail(message.data.id),
                (oldData) => oldData ? { ...oldData, ...message.data } : message.data
              );
            }
          } else if (message.type === 'staff_deleted' && message.data?.id) {
            queryClient.setQueryData(
              STAFF_KEYS.lists(),
              (oldData) => {
                if (!oldData) return [];
                const filterData = (items) => items.filter(staff => staff.id !== message.data.id);
                return Array.isArray(oldData) 
                  ? filterData(oldData)
                  : { ...oldData, data: filterData(oldData.data || []) };
              }
            );
            // Clear detail cache if exists
            if (message.data.id) {
              queryClient.removeQueries({ queryKey: STAFF_KEYS.detail(message.data.id) });
            }
          } else if (message.type === 'user_created' && message.data) {
            // New user created
            queryClient.setQueryData(
              STAFF_KEYS.lists(),
              (oldData) => {
                if (!oldData) return [message.data];
                return Array.isArray(oldData) 
                  ? [message.data, ...oldData]
                  : [message.data, ...(oldData.data || [])];
              }
            );
          } else if (message.type === 'user_updated' && message.data) {
            queryClient.setQueryData(
              STAFF_KEYS.lists(),
              (oldData) => {
                if (!oldData) return [message.data];
                const updateData = (items) => items.map(user =>
                  user.id === message.data.id ? { ...user, ...message.data } : user
                );
                return Array.isArray(oldData) 
                  ? updateData(oldData)
                  : { ...oldData, data: updateData(oldData.data || []) };
              }
            );
          }
        } catch (error) {
          console.error('Error parsing Staff Management WebSocket message:', error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('Staff Management WebSocket error:', error);
      };

      wsRef.current.onclose = () => {
        console.log('⚪ Staff Management WebSocket disconnected - attempting to reconnect...');
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };
    } catch (error) {
      console.error('Error creating Staff Management WebSocket:', error);
    }
  }, [queryClient]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return wsRef.current;
};
