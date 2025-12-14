import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export const useNotificationsWebSocket = () => {
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
        ws = new WebSocket(`${wsUrl}/notifications`);

        ws.onopen = () => {
          console.log('🔴 Notifications WebSocket connected - Real-time updates ACTIVE (NO auto-refresh)');
          reconnectAttempts = 0;
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            const { type, data } = message;

            // Handle notification events
            if (type === 'notification_created' || type === 'notification_updated' || type === 'notification_deleted') {
              // Invalidate notifications cache to trigger refetch
              queryClient.invalidateQueries({ queryKey: ['notifications'] });
            }

            // Handle unread count updates
            if (type === 'unread_count_updated' || type === 'notification_read' || type === 'all_notifications_read') {
              // Invalidate unread count cache
              queryClient.invalidateQueries({ queryKey: ['notifications', 'unreadCount'] });
            }
          } catch (error) {
            console.error('Error processing WebSocket message:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('Notifications WebSocket error:', error);
        };

        ws.onclose = () => {
          console.log('⚪ Notifications WebSocket disconnected - attempting to reconnect...');
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
