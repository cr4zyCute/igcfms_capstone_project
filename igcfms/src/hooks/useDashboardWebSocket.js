import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { DASHBOARD_KEYS } from './useDashboardData';

const WS_BASE_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8000';

export const useDashboardWebSocket = () => {
  const wsRef = useRef(null);
  const queryClient = useQueryClient();
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      if (!token) return;

      const wsUrl = `${WS_BASE_URL}/dashboard?token=${token}`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('🔴 Dashboard WebSocket connected - Real-time updates ACTIVE (NO auto-refresh)');
        reconnectAttemptsRef.current = 0;
        
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'subscribe',
            channels: ['transactions', 'overrides', 'cheques', 'collection', 'disburse', 'accounts', 'activity']
          }));
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          // Direct cache updates - instant UI update without refetch
          if (message.type === 'transaction_update' && message.data) {
            queryClient.setQueryData(DASHBOARD_KEYS.transactions(), (oldData) => {
              if (!oldData) return [message.data];
              return [message.data, ...oldData.slice(0, 9)];
            });
          } else if (message.type === 'override_update' && message.data) {
            queryClient.setQueryData(DASHBOARD_KEYS.overrides(), message.data);
          } else if ((message.type === 'cheque_update' || message.type === 'receipt_update') && message.data) {
            queryClient.setQueryData(DASHBOARD_KEYS.cheques(), message.data);
          } else if (message.type === 'collection_update' && message.data) {
            queryClient.setQueryData(DASHBOARD_KEYS.collection(), message.data);
          } else if (message.type === 'disburse_update' && message.data) {
            queryClient.setQueryData(DASHBOARD_KEYS.disburse(), message.data);
          } else if (message.type === 'account_update' && message.data) {
            queryClient.setQueryData(DASHBOARD_KEYS.topAccounts(), message.data);
          } else if (message.type === 'activity_update' && message.data) {
            queryClient.setQueryData(DASHBOARD_KEYS.activityByRole(), message.data);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('Dashboard WebSocket error:', error);
      };

      wsRef.current.onclose = () => {
        console.log('⚪ Dashboard WebSocket disconnected - attempting to reconnect...');
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };
    } catch (error) {
      console.error('Error creating Dashboard WebSocket:', error);
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
