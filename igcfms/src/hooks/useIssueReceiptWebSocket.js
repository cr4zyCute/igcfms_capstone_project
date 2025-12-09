import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { RECEIPT_KEYS } from './useReceipts';

const WS_BASE_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8000';

export const useIssueReceiptWebSocket = () => {
  const wsRef = useRef(null);
  const queryClient = useQueryClient();
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      if (!token) return;

      const wsUrl = `${WS_BASE_URL}/receipts?token=${token}`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('🔴 Issue Receipt WebSocket connected - Real-time updates ACTIVE (NO auto-refresh)');
        reconnectAttemptsRef.current = 0;
        
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'subscribe',
            channels: ['receipts', 'collection_transactions']
          }));
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          // Direct cache updates - instant UI update without refetch
          if (message.type === 'receipt_created' && message.data) {
            queryClient.setQueryData(
              RECEIPT_KEYS.lists(),
              (oldData) => {
                if (!oldData) return [message.data];
                return Array.isArray(oldData) 
                  ? [message.data, ...oldData]
                  : [message.data, ...(oldData.data || [])];
              }
            );
          } else if (message.type === 'receipt_updated' && message.data) {
            queryClient.setQueryData(
              RECEIPT_KEYS.lists(),
              (oldData) => {
                if (!oldData) return [message.data];
                const updateData = (items) => items.map(receipt =>
                  receipt.id === message.data.id ? { ...receipt, ...message.data } : receipt
                );
                return Array.isArray(oldData) 
                  ? updateData(oldData)
                  : { ...oldData, data: updateData(oldData.data || []) };
              }
            );
          } else if (message.type === 'receipt_deleted' && message.data?.id) {
            queryClient.setQueryData(
              RECEIPT_KEYS.lists(),
              (oldData) => {
                if (!oldData) return [];
                const filterData = (items) => items.filter(receipt => receipt.id !== message.data.id);
                return Array.isArray(oldData) 
                  ? filterData(oldData)
                  : { ...oldData, data: filterData(oldData.data || []) };
              }
            );
          } else if (message.type === 'receipt_cancelled' && message.data?.id) {
            queryClient.setQueryData(
              RECEIPT_KEYS.lists(),
              (oldData) => {
                if (!oldData) return [];
                const updateData = (items) => items.map(receipt =>
                  receipt.id === message.data.id 
                    ? { ...receipt, status: 'cancelled', ...message.data } 
                    : receipt
                );
                return Array.isArray(oldData) 
                  ? updateData(oldData)
                  : { ...oldData, data: updateData(oldData.data || []) };
              }
            );
          } else if (message.type === 'collection_transaction_created' && message.data) {
            queryClient.setQueryData(
              RECEIPT_KEYS.collectionTransactionsRoot(),
              (oldData) => {
                if (!oldData) return [message.data];
                return Array.isArray(oldData) 
                  ? [message.data, ...oldData]
                  : [message.data, ...(oldData.data || [])];
              }
            );
          } else if (message.type === 'collection_transaction_updated' && message.data) {
            queryClient.setQueryData(
              RECEIPT_KEYS.collectionTransactionsRoot(),
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
          console.error('Error parsing Issue Receipt WebSocket message:', error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('Issue Receipt WebSocket error:', error);
      };

      wsRef.current.onclose = () => {
        console.log('⚪ Issue Receipt WebSocket disconnected - attempting to reconnect...');
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };
    } catch (error) {
      console.error('Error creating Issue Receipt WebSocket:', error);
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
