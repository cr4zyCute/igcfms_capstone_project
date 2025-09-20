import React, { useState, useEffect } from 'react';
import notificationService from '../../services/notificationService';
import './css/NotificationPanel.css';

const NotificationPanel = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Load initial notifications
    const initialNotifications = notificationService.getNotifications();
    setNotifications(initialNotifications);
    updateUnreadCount(initialNotifications);

    // Listen for new notifications
    const handleNotificationUpdate = (updatedNotifications) => {
      setNotifications(updatedNotifications);
      updateUnreadCount(updatedNotifications);
    };

    notificationService.addListener(handleNotificationUpdate);

    return () => {
      notificationService.removeListener(handleNotificationUpdate);
    };
  }, []);

  const updateUnreadCount = (notificationList) => {
    const unread = notificationList.filter(n => !n.read).length;
    setUnreadCount(unread);
  };

  const handleMarkAsRead = (notificationId) => {
    notificationService.markAsRead(notificationId);
  };

  const handleClearAll = () => {
    notificationService.clearAll();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success': return 'fas fa-check-circle';
      case 'warning': return 'fas fa-exclamation-triangle';
      case 'error': return 'fas fa-times-circle';
      case 'info': 
      default: return 'fas fa-info-circle';
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="notification-panel-overlay" onClick={onClose}>
      <div className="notification-panel" onClick={(e) => e.stopPropagation()}>
        <div className="notification-header">
          <div className="notification-title">
            <i className="fas fa-bell"></i>
            <span>Notifications</span>
            {unreadCount > 0 && (
              <span className="unread-badge">{unreadCount}</span>
            )}
          </div>
          <div className="notification-actions">
            {notifications.length > 0 && (
              <button 
                className="clear-all-btn"
                onClick={handleClearAll}
                title="Clear all notifications"
              >
                <i className="fas fa-trash"></i>
              </button>
            )}
            <button 
              className="close-btn"
              onClick={onClose}
              title="Close notifications"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        <div className="notification-list">
          {notifications.length === 0 ? (
            <div className="no-notifications">
              <i className="fas fa-bell-slash"></i>
              <p>No notifications yet</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div 
                key={notification.id}
                className={`notification-item ${notification.read ? 'read' : 'unread'} ${notification.type}`}
                onClick={() => handleMarkAsRead(notification.id)}
              >
                <div className="notification-icon">
                  <i className={getNotificationIcon(notification.type)}></i>
                </div>
                <div className="notification-content">
                  <div className="notification-title-text">{notification.title}</div>
                  <div className="notification-message">{notification.message}</div>
                  {notification.amount && (
                    <div className="notification-amount">
                      Amount: ₱{parseFloat(notification.amount).toLocaleString()}
                    </div>
                  )}
                  <div className="notification-time">
                    {formatTime(notification.created_at)}
                  </div>
                </div>
                {!notification.read && (
                  <div className="unread-indicator"></div>
                )}
              </div>
            ))
          )}
        </div>

        {notifications.length > 0 && (
          <div className="notification-footer">
            <small>{notifications.length} total notification{notifications.length !== 1 ? 's' : ''}</small>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
