import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ACTIVITY_KEYS } from './useActivityDashboard';

const WS_BASE_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8000';

export const useActivityWebSocket = (filters = {}) => {
  const wsRef = useRef(null);
  const queryClient = useQueryClient();
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      if (!token) return;

      const wsUrl = `${WS_BASE_URL}/activity-logs?token=${token}`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('🔴 WebSocket connected - Real-time activity updates ACTIVE');
        reconnectAttemptsRef.current = 0;
        
        // Send filter subscription
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'subscribe',
            filters: filters
          }));
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === 'activity_update' && message.data) {
            // Direct cache update - instant UI update without refetch
            queryClient.setQueryData(
              ACTIVITY_KEYS.list(filters),
              (oldData) => {
                if (!oldData) return [message.data];
                
                // Add new activity to the beginning of the list
                const newActivities = Array.isArray(oldData) 
                  ? [message.data, ...oldData]
                  : [message.data];
                
                return newActivities;
              }
            );

            // Update statistics cache directly without refetch
            queryClient.setQueryData(
              ACTIVITY_KEYS.stats(filters),
              (oldStats) => {
                if (!oldStats) return oldStats;
                
                return {
                  ...oldStats,
                  statistics: {
                    ...oldStats.statistics,
                    total_activities: (oldStats.statistics?.total_activities || 0) + 1
                  }
                };
              }
            );
          } else if (message.type === 'statistics_update' && message.data) {
            // Direct statistics update
            queryClient.setQueryData(
              ACTIVITY_KEYS.stats(filters),
              message.data
            );
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      wsRef.current.onclose = () => {
        console.log('⚪ WebSocket disconnected - attempting to reconnect...');
        // Attempt to reconnect
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
    }
  }, [filters, queryClient]);

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
