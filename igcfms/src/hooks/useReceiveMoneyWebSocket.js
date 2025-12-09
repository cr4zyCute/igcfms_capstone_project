import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { RECIPIENT_ACCOUNTS_KEYS } from './useRecipientAccounts';
import { FUND_ACCOUNTS_KEYS } from './useFundAccounts';

const WS_BASE_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8000';

export const useReceiveMoneyWebSocket = () => {
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
        console.log('🔴 Receive Money WebSocket connected - Real-time updates ACTIVE (NO auto-refresh)');
        reconnectAttemptsRef.current = 0;
        
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'subscribe',
            channels: ['receipts', 'collection_transactions', 'recipient_accounts', 'fund_accounts']
          }));
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          // Direct cache updates - instant UI update without refetch
          if (message.type === 'receipt_created' && message.data) {
            // Update receipts cache
            queryClient.setQueryData(
              RECIPIENT_ACCOUNTS_KEYS.lists(),
              (oldData) => {
                if (!oldData) return [message.data];
                return Array.isArray(oldData) 
                  ? [message.data, ...oldData]
                  : [message.data, ...(oldData.data || [])];
              }
            );
          } else if (message.type === 'receipt_updated' && message.data) {
            queryClient.setQueryData(
              RECIPIENT_ACCOUNTS_KEYS.lists(),
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
          } else if (message.type === 'receipt_cancelled' && message.data) {
            queryClient.setQueryData(
              RECIPIENT_ACCOUNTS_KEYS.lists(),
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
          } else if (message.type === 'collection_transaction_created' && message.data) {
            // Update recipient accounts cache
            queryClient.setQueryData(
              RECIPIENT_ACCOUNTS_KEYS.lists(),
              (oldData) => {
                if (!oldData) return [message.data];
                return Array.isArray(oldData) 
                  ? [message.data, ...oldData]
                  : [message.data, ...(oldData.data || [])];
              }
            );
          } else if (message.type === 'collection_transaction_updated' && message.data) {
            queryClient.setQueryData(
              RECIPIENT_ACCOUNTS_KEYS.lists(),
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
          } else if (message.type === 'recipient_account_created' && message.data) {
            queryClient.setQueryData(
              RECIPIENT_ACCOUNTS_KEYS.lists(),
              (oldData) => {
                if (!oldData) return [message.data];
                return Array.isArray(oldData) 
                  ? [message.data, ...oldData]
                  : [message.data, ...(oldData.data || [])];
              }
            );
          } else if (message.type === 'recipient_account_updated' && message.data) {
            queryClient.setQueryData(
              RECIPIENT_ACCOUNTS_KEYS.lists(),
              (oldData) => {
                if (!oldData) return [message.data];
                const updateData = (items) => items.map(account =>
                  account.id === message.data.id ? { ...account, ...message.data } : account
                );
                return Array.isArray(oldData) 
                  ? updateData(oldData)
                  : { ...oldData, data: updateData(oldData.data || []) };
              }
            );
          } else if (message.type === 'fund_account_updated' && message.data) {
            // Update fund accounts cache
            queryClient.setQueryData(
              FUND_ACCOUNTS_KEYS.lists(),
              (oldData) => {
                if (!oldData?.data) return oldData;
                return {
                  ...oldData,
                  data: oldData.data.map(account =>
                    account.id === message.data.id ? { ...account, ...message.data } : account
                  )
                };
              }
            );
          } else if (message.type === 'balance_update' && message.data) {
            // Update fund account balance
            queryClient.setQueryData(
              FUND_ACCOUNTS_KEYS.lists(),
              (oldData) => {
                if (!oldData?.data) return oldData;
                return {
                  ...oldData,
                  data: oldData.data.map(account => {
                    if (account.id === message.data.fund_account_id) {
                      return {
                        ...account,
                        current_balance: message.data.newBalance,
                        graphData: message.data.graphData 
                          ? [...(account.graphData || []).slice(-19), message.data.graphData]
                          : account.graphData
                      };
                    }
                    return account;
                  })
                };
              }
            );
          }
        } catch (error) {
          console.error('Error parsing Receive Money WebSocket message:', error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('Receive Money WebSocket error:', error);
      };

      wsRef.current.onclose = () => {
        console.log('⚪ Receive Money WebSocket disconnected - attempting to reconnect...');
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };
    } catch (error) {
      console.error('Error creating Receive Money WebSocket:', error);
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
