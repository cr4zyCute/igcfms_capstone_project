import React, { useState, useEffect, useRef } from "react";
import { useNotifications, useMarkAsRead } from "../../hooks/useNotifications";
import { useNotificationsWebSocket } from "../../hooks/useNotificationsWebSocket";
import { useAuth } from "../../contexts/AuthContext";
import "../admin/css/notificationbar.css";

const NotificationBell = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [hoveredNotification, setHoveredNotification] = useState(null);
  const dropdownRef = useRef(null);
  const bellRef = useRef(null);

  const token = localStorage.getItem("token");
  const { user } = useAuth();

  // WebSocket for real-time updates
  useNotificationsWebSocket();

  // TanStack Query hooks
  const {
    data: notifications = [],
    isLoading: notificationsLoading,
    error: notificationsError
  } = useNotifications({ enabled: !!token });

  // Filter notifications to show ONLY current user's notifications
  const filteredNotifications = notifications.filter(notification => {
    const notificationUserId = notification.user_id || notification.recipient_id || notification.userId;
    const currentUserId = user?.id;
    
    // Only show if notification belongs to current user
    if (currentUserId && notificationUserId) {
      return notificationUserId.toString() === currentUserId.toString();
    }
    return false;
  });

  const markAsReadMutation = useMarkAsRead();

  const unreadCount = filteredNotifications.filter(n => !n.is_read && !n.read).length;

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !bellRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const handleNotificationClick = (notification) => {
    if (!notification.is_read && !notification.read) {
      markAsReadMutation.mutate({ notificationId: notification.id });
    }

    // Store notification ID in localStorage for NotificationsPage to pick up
    localStorage.setItem('igcfms_selectedNotificationId', notification.id);

    // Dispatch custom event to notify NotificationsPage
    window.dispatchEvent(
      new CustomEvent('notificationSelected', {
        detail: { notificationId: notification.id }
      })
    );

    // Navigate to notifications page
    window.location.href = '/cashier/notifications';
  };

  const getNotificationIcon = (type) => {
    const typeStr = (type || '').toLowerCase();
    if (typeStr.includes('override')) return 'fas fa-exclamation-triangle';
    if (typeStr.includes('cheque')) return 'fas fa-money-check';
    if (typeStr.includes('transaction')) return 'fas fa-exchange-alt';
    if (typeStr.includes('collection')) return 'fas fa-money-bill-wave';
    if (typeStr.includes('disbursement')) return 'fas fa-hand-holding-usd';
    return 'fas fa-bell';
  };

  return (
    <div className="notification-bell-container">
      <button
        ref={bellRef}
        className="notification-bell"
        onClick={() => setShowDropdown(!showDropdown)}
        title="Notifications"
      >
        <i className="fas fa-bell"></i>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {showDropdown && (
        <div ref={dropdownRef} className="notification-dropdown">
          <div className="dropdown-header">
            <h3>Notifications</h3>
            <button
              className="close-btn"
              onClick={() => setShowDropdown(false)}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          <div className="dropdown-content">
            {notificationsLoading ? (
              <div className="loading-state">
                <i className="fas fa-spinner fa-spin"></i>
                <p>Loading...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-inbox"></i>
                <p>No notifications</p>
              </div>
            ) : (
              <div className="notification-list">
                {filteredNotifications.slice(0, 5).map((notification) => (
                  <div
                    key={notification.id}
                    className={`notification-item ${notification.is_read || notification.read ? 'read' : 'unread'}`}
                    onMouseEnter={() => setHoveredNotification(notification.id)}
                    onMouseLeave={() => setHoveredNotification(null)}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="notification-icon">
                      <i className={getNotificationIcon(notification.type)}></i>
                    </div>
                    <div className="notification-content">
                      <h4>{notification.title || 'Notification'}</h4>
                      <p>{notification.message || notification.data}</p>
                      <span className="notification-time">
                        {notification.created_at
                          ? new Date(notification.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : 'No date'}
                      </span>
                    </div>
                    {!notification.is_read && !notification.read && (
                      <div className="unread-indicator"></div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {filteredNotifications.length > 0 && (
            <div className="dropdown-footer">
              <a href="/cashier/notifications" className="view-all-btn">
                View All Notifications
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
