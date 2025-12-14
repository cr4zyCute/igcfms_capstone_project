import React, { useState, useEffect, useRef } from "react";
import '../common/css/notificationbell.css';
import notificationService from '../../services/notificationService';
import { useNotifications, useUnreadCount, useMarkAsRead, useMarkAllAsRead } from '../../hooks/useNotifications';
import { useNotificationsWebSocket } from '../../hooks/useNotificationsWebSocket';

const NotificationBellCO = ({ onNavigate }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const bellRef = useRef(null);

  const token = localStorage.getItem("token");

  // WebSocket hook for real-time updates
  useNotificationsWebSocket();

  // TanStack Query hooks - fetches notifications for current user only
  const {
    data: notifications = [],
    isLoading: notificationsLoading,
    refetch: refetchNotifications
  } = useNotifications({ enabled: !!token, limit: 10 });

  const {
    data: unreadCount = 0,
    refetch: refetchUnreadCount
  } = useUnreadCount({ enabled: !!token });

  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();

  useEffect(() => {
    if (token) {
      // Listen to our notification service
      const handleNotificationUpdate = (serviceNotifications) => {
        // Refetch notifications and unread count when service updates
        refetchNotifications();
        refetchUnreadCount();
      };

      notificationService.addListener(handleNotificationUpdate);

      return () => {
        notificationService.removeListener(handleNotificationUpdate);
      };
    }
  }, [token, refetchNotifications, refetchUnreadCount]);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        !bellRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (notificationId) => {
    try {
      await markAsReadMutation.mutateAsync(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await markAllAsReadMutation.mutateAsync();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
    if (!showDropdown) {
      refetchNotifications();
    }
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'override_request':
        return 'fas fa-edit';
      case 'override_reviewed':
        return 'fas fa-check-circle';
      default:
        return 'fas fa-bell';
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    // Store selected notification ID
    localStorage.setItem('igcfms_selectedNotificationId', notification.id.toString());
    
    // Dispatch custom event to notify any listeners
    window.dispatchEvent(new CustomEvent('notificationSelected', { 
      detail: { notificationId: notification.id.toString() } 
    }));
    
    // Navigate to override transactions if it's an override_reviewed notification
    if (notification.type === 'override_reviewed' && onNavigate) {
      // Close dropdown first, then navigate
      setShowDropdown(false);
      // Use setTimeout to ensure dropdown closes before navigation
      setTimeout(() => {
        onNavigate('override-transactions');
      }, 100);
    } else {
      setShowDropdown(false);
    }
  };

  if (!token) return null;

  return (
    <div className="bell-container">
      <button 
        ref={bellRef}
        className={`bell-button ${showDropdown ? 'active' : ''}`}
        onClick={toggleDropdown}
        title="Notifications"
      >
        <i className="fas fa-bell"></i>
        {unreadCount > 0 && (
          <span className="bell-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div ref={dropdownRef} className="bell-dropdown">
          <div className="bell-dropdown-header">
            <h3>
              <i className="fas fa-bell"></i> Notifications
            </h3>
            {unreadCount > 0 && (
              <button 
                className="bell-mark-all-btn"
                onClick={markAllAsRead}
                title="Mark all as read"
              >
                <i className="fas fa-check-double"></i>
              </button>
            )}
          </div>

          <div className="bell-list">
            {notificationsLoading ? (
              <div className="bell-loading">
                <i className="fas fa-spinner fa-spin"></i>
                <span>Loading notifications...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="bell-no-notifications">
                <i className="fas fa-inbox"></i>
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`bell-item ${!notification.is_read ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="bell-item-icon">
                    <i className={getNotificationIcon(notification.type)}></i>
                  </div>
                  <div className="bell-item-content">
                    <div className="bell-item-title">
                      {notification.title}
                    </div>
                    <div className="bell-item-message">
                      {notification.message}
                    </div>
                    <div className="bell-item-time">
                      {formatTimeAgo(notification.created_at)}
                    </div>
                  </div>
                  {!notification.is_read && (
                    <div className="bell-unread-indicator"></div>
                  )}
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="bell-dropdown-footer">
              <button 
                className="bell-view-all-btn"
                onClick={() => {
                  setShowDropdown(false);
                  localStorage.removeItem('igcfms_selectedNotificationId');
                  if (onNavigate) {
                    onNavigate('notifications');
                  }
                }}
              >
                View All Notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBellCO;
