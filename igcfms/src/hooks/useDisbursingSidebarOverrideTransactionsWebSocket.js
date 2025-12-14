import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export const useDisbursingSidebarOverrideTransactionsWebSocket = () => {
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
        ws = new WebSocket(`${wsUrl}/override-transactions`);

        ws.onopen = () => {
          console.log('🔴 Disbursing Override Transactions WebSocket connected - Real-time updates ACTIVE (NO auto-refresh)');
          reconnectAttempts = 0;
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            const { type, data } = message;

            // Handle override request events
            if (type === 'override_request_created' || type === 'override_request_updated' || type === 'override_request_reviewed' || type === 'override_request_deleted') {
              // Invalidate both override_requests and myRequests caches
              queryClient.invalidateQueries({ queryKey: ['overrideTransactions', 'list'] });
              queryClient.invalidateQueries({ queryKey: ['overrideTransactions', 'myRequests'] });
            }

            // Handle transaction events
            if (type === 'transaction_created' || type === 'transaction_updated' || type === 'transaction_deleted') {
              // Invalidate transaction queries
              queryClient.invalidateQueries({ queryKey: ['transactions', 'override'] });
            }
          } catch (error) {
            console.error('Error processing WebSocket message:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('Disbursing Override Transactions WebSocket error:', error);
        };

        ws.onclose = () => {
          console.log('⚪ Disbursing Override Transactions WebSocket disconnected - attempting to reconnect...');
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
