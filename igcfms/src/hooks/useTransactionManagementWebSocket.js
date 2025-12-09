import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { TRANSACTION_MANAGEMENT_KEYS } from './useTransactionManagement';

const WS_BASE_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8000';

export const useTransactionManagementWebSocket = () => {
  const wsRef = useRef(null);
  const queryClient = useQueryClient();
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      if (!token) return;

      const wsUrl = `${WS_BASE_URL}/transactions?token=${token}`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('🔴 Transaction Management WebSocket connected - Real-time updates ACTIVE (NO auto-refresh)');
        reconnectAttemptsRef.current = 0;
        
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'subscribe',
            channels: ['transactions', 'override_requests', 'transaction_updates']
          }));
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          // Direct cache updates - instant UI update without refetch
          if (message.type === 'transaction_created' && message.data) {
            queryClient.setQueryData(
              TRANSACTION_MANAGEMENT_KEYS.transactions(),
              (oldData) => {
                if (!oldData) return [message.data];
                return Array.isArray(oldData) 
                  ? [message.data, ...oldData]
                  : [message.data, ...(oldData.data || [])];
              }
            );
          } else if (message.type === 'transaction_updated' && message.data) {
            queryClient.setQueryData(
              TRANSACTION_MANAGEMENT_KEYS.transactions(),
              (oldData) => {
                if (!oldData) return [message.data];
                const updateData = (items) => items.map(tx =>
                  tx.id === message.data.id ? { ...tx, ...message.data } : tx
                );
                return Array.isArray(oldData) 
                  ? updateData(oldData)
                  : { ...oldData, data: updateData(oldData.data || []) };
              }
            );
          } else if (message.type === 'transaction_deleted' && message.data?.id) {
            queryClient.setQueryData(
              TRANSACTION_MANAGEMENT_KEYS.transactions(),
              (oldData) => {
                if (!oldData) return [];
                const filterData = (items) => items.filter(tx => tx.id !== message.data.id);
                return Array.isArray(oldData) 
                  ? filterData(oldData)
                  : { ...oldData, data: filterData(oldData.data || []) };
              }
            );
          } else if (message.type === 'override_request_created' && message.data) {
            queryClient.setQueryData(
              TRANSACTION_MANAGEMENT_KEYS.overrideRequests(),
              (oldData) => {
                if (!oldData) return [message.data];
                return Array.isArray(oldData) 
                  ? [message.data, ...oldData]
                  : [message.data, ...(oldData.data || [])];
              }
            );
          } else if (message.type === 'override_request_updated' && message.data) {
            queryClient.setQueryData(
              TRANSACTION_MANAGEMENT_KEYS.overrideRequests(),
              (oldData) => {
                if (!oldData) return [message.data];
                const updateData = (items) => items.map(req =>
                  req.id === message.data.id ? { ...req, ...message.data } : req
                );
                return Array.isArray(oldData) 
                  ? updateData(oldData)
                  : { ...oldData, data: updateData(oldData.data || []) };
              }
            );
          } else if (message.type === 'override_request_reviewed' && message.data) {
            queryClient.setQueryData(
              TRANSACTION_MANAGEMENT_KEYS.overrideRequests(),
              (oldData) => {
                if (!oldData) return [message.data];
                const updateData = (items) => items.map(req =>
                  req.id === message.data.id ? { ...req, ...message.data } : req
                );
                return Array.isArray(oldData) 
                  ? updateData(oldData)
                  : { ...oldData, data: updateData(oldData.data || []) };
              }
            );
          } else if (message.type === 'override_request_deleted' && message.data?.id) {
            queryClient.setQueryData(
              TRANSACTION_MANAGEMENT_KEYS.overrideRequests(),
              (oldData) => {
                if (!oldData) return [];
                const filterData = (items) => items.filter(req => req.id !== message.data.id);
                return Array.isArray(oldData) 
                  ? filterData(oldData)
                  : { ...oldData, data: filterData(oldData.data || []) };
              }
            );
          }
        } catch (error) {
          console.error('Error parsing Transaction Management WebSocket message:', error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('Transaction Management WebSocket error:', error);
      };

      wsRef.current.onclose = () => {
        console.log('⚪ Transaction Management WebSocket disconnected - attempting to reconnect...');
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };
    } catch (error) {
      console.error('Error creating Transaction Management WebSocket:', error);
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
