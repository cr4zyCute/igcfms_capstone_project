import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { FUND_ACCOUNTS_KEYS } from './useFundAccounts';

const WS_BASE_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8000';

export const useFundsAccountsWebSocket = () => {
  const wsRef = useRef(null);
  const queryClient = useQueryClient();
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      if (!token) return;

      const wsUrl = `${WS_BASE_URL}/fund-accounts?token=${token}`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('🔴 Funds Accounts WebSocket connected - Real-time updates ACTIVE (NO auto-refresh)');
        reconnectAttemptsRef.current = 0;
        
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'subscribe',
            channels: ['fund_accounts', 'transactions', 'balance_updates']
          }));
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          // Direct cache updates - instant UI update without refetch
          if (message.type === 'fund_account_created' && message.data) {
            queryClient.setQueryData(
              FUND_ACCOUNTS_KEYS.lists(),
              (oldData) => {
                if (!oldData?.data) return oldData;
                return {
                  ...oldData,
                  data: [message.data, ...oldData.data],
                  total: (oldData.total || 0) + 1
                };
              }
            );
          } else if (message.type === 'fund_account_updated' && message.data) {
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
          } else if (message.type === 'fund_account_deleted' && message.data?.id) {
            queryClient.setQueryData(
              FUND_ACCOUNTS_KEYS.lists(),
              (oldData) => {
                if (!oldData?.data) return oldData;
                return {
                  ...oldData,
                  data: oldData.data.filter(account => account.id !== message.data.id),
                  total: Math.max(0, (oldData.total || 0) - 1)
                };
              }
            );
          } else if (message.type === 'balance_update' && message.data) {
            // Update account balance and graph data
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

            // Update transaction cache if viewing this account
            if (message.data.fund_account_id) {
              queryClient.setQueryData(
                FUND_ACCOUNTS_KEYS.transactions(message.data.fund_account_id),
                (oldData) => {
                  if (!oldData?.data) return oldData;
                  return {
                    ...oldData,
                    data: message.data.transaction 
                      ? [message.data.transaction, ...oldData.data]
                      : oldData.data
                  };
                }
              );
            }
          } else if (message.type === 'transaction_created' && message.data) {
            // Update transactions cache for the account
            if (message.data.fund_account_id) {
              queryClient.setQueryData(
                FUND_ACCOUNTS_KEYS.transactions(message.data.fund_account_id),
                (oldData) => {
                  if (!oldData?.data) return oldData;
                  return {
                    ...oldData,
                    data: [message.data, ...oldData.data]
                  };
                }
              );
            }
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('Funds Accounts WebSocket error:', error);
      };

      wsRef.current.onclose = () => {
        console.log('⚪ Funds Accounts WebSocket disconnected - attempting to reconnect...');
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };
    } catch (error) {
      console.error('Error creating Funds Accounts WebSocket:', error);
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
