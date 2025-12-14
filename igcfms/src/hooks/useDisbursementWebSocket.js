import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export const useDisbursementWebSocket = () => {
  const queryClient = useQueryClient();
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 5;
  const reconnectDelay = 1000; // Start with 1 second

  useEffect(() => {
    const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8000';
    let ws = null;
    let reconnectTimeout = null;

    const connect = () => {
      try {
        ws = new WebSocket(`${wsUrl}/disbursements`);

        ws.onopen = () => {
          console.log('🔴 Disbursement WebSocket connected - Real-time updates ACTIVE (NO auto-refresh)');
          reconnectAttempts = 0;
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            const { type, data } = message;

            // Handle disbursement events
            if (type === 'disbursement_created' || type === 'disbursement_updated' || type === 'disbursement_deleted') {
              // Invalidate disbursement-related queries to trigger refetch
              queryClient.invalidateQueries({ queryKey: ['disbursements'] });
            }

            // Handle override request events
            if (type === 'override_request_created' || type === 'override_request_updated' || type === 'override_request_reviewed' || type === 'override_request_deleted') {
              // Invalidate override request queries
              queryClient.invalidateQueries({ queryKey: ['overrideTransactions', 'myRequests'] });
            }

            // Handle cheque events
            if (type === 'cheque_created' || type === 'cheque_updated' || type === 'cheque_deleted' || type === 'cheque_cleared') {
              // Invalidate cheque queries
              queryClient.invalidateQueries({ queryKey: ['cheques'] });
            }

            // Handle transaction events
            if (type === 'transaction_created' || type === 'transaction_updated' || type === 'transaction_deleted') {
              // Invalidate transaction queries
              queryClient.invalidateQueries({ queryKey: ['transactions'] });
            }

            // Handle fund account events
            if (type === 'fund_account_updated' || type === 'balance_update') {
              // Invalidate fund account queries
              queryClient.invalidateQueries({ queryKey: ['fundAccounts'] });
            }
          } catch (error) {
            console.error('Error processing WebSocket message:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('Disbursement WebSocket error:', error);
        };

        ws.onclose = () => {
          console.log('⚪ Disbursement WebSocket disconnected - attempting to reconnect...');
          attemptReconnect();
        };
      } catch (error) {
        console.error('Failed to create WebSocket:', error);
        attemptReconnect();
      }
    };

    const attemptReconnect = () => {
      if (reconnectAttempts < maxReconnectAttempts) {
        reconnectAttempts++;
        const delay = reconnectDelay * Math.pow(2, reconnectAttempts - 1); // Exponential backoff
        console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts}/${maxReconnectAttempts})`);
        reconnectTimeout = setTimeout(connect, delay);
      } else {
        console.error('Max reconnection attempts reached. WebSocket will not reconnect.');
      }
    };

    connect();

    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (ws) {
        ws.close();
      }
    };
  }, [queryClient]);
};
