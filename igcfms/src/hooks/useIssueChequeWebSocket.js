import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CHEQUE_KEYS } from './useCheques';

const WS_BASE_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8000';

export const useIssueChequeWebSocket = () => {
  const wsRef = useRef(null);
  const queryClient = useQueryClient();
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      if (!token) return;

      const wsUrl = `${WS_BASE_URL}/cheques?token=${token}`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('🔴 Issue Cheque WebSocket connected - Real-time updates ACTIVE (NO auto-refresh)');
        reconnectAttemptsRef.current = 0;
        
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'subscribe',
            channels: ['cheques', 'disbursement_transactions']
          }));
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          // Direct cache updates - instant UI update without refetch
          if (message.type === 'cheque_created' && message.data) {
            queryClient.setQueryData(
              CHEQUE_KEYS.lists(),
              (oldData) => {
                if (!oldData) return [message.data];
                return Array.isArray(oldData) 
                  ? [message.data, ...oldData]
                  : [message.data, ...(oldData.data || [])];
              }
            );
          } else if (message.type === 'cheque_updated' && message.data) {
            queryClient.setQueryData(
              CHEQUE_KEYS.lists(),
              (oldData) => {
                if (!oldData) return [message.data];
                const updateData = (items) => items.map(cheque =>
                  cheque.id === message.data.id ? { ...cheque, ...message.data } : cheque
                );
                return Array.isArray(oldData) 
                  ? updateData(oldData)
                  : { ...oldData, data: updateData(oldData.data || []) };
              }
            );
          } else if (message.type === 'cheque_deleted' && message.data?.id) {
            queryClient.setQueryData(
              CHEQUE_KEYS.lists(),
              (oldData) => {
                if (!oldData) return [];
                const filterData = (items) => items.filter(cheque => cheque.id !== message.data.id);
                return Array.isArray(oldData) 
                  ? filterData(oldData)
                  : { ...oldData, data: filterData(oldData.data || []) };
              }
            );
          } else if (message.type === 'cheque_cleared' && message.data?.id) {
            queryClient.setQueryData(
              CHEQUE_KEYS.lists(),
              (oldData) => {
                if (!oldData) return [];
                const updateData = (items) => items.map(cheque =>
                  cheque.id === message.data.id 
                    ? { ...cheque, status: 'cleared', ...message.data } 
                    : cheque
                );
                return Array.isArray(oldData) 
                  ? updateData(oldData)
                  : { ...oldData, data: updateData(oldData.data || []) };
              }
            );
          } else if (message.type === 'disbursement_transaction_created' && message.data) {
            queryClient.setQueryData(
              CHEQUE_KEYS.disbursementTransactionsRoot(),
              (oldData) => {
                if (!oldData) return [message.data];
                return Array.isArray(oldData) 
                  ? [message.data, ...oldData]
                  : [message.data, ...(oldData.data || [])];
              }
            );
          } else if (message.type === 'disbursement_transaction_updated' && message.data) {
            queryClient.setQueryData(
              CHEQUE_KEYS.disbursementTransactionsRoot(),
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
          }
        } catch (error) {
          console.error('Error parsing Issue Cheque WebSocket message:', error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('Issue Cheque WebSocket error:', error);
      };

      wsRef.current.onclose = () => {
        console.log('⚪ Issue Cheque WebSocket disconnected - attempting to reconnect...');
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };
    } catch (error) {
      console.error('Error creating Issue Cheque WebSocket:', error);
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
