import React, { useState, useEffect, useRef } from 'react';
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '../../hooks/useNotifications';
import '../admin/css/notificationbar.css';

const NotificationsPage = () => {
  const token = localStorage.getItem("token");
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const filterDropdownRef = useRef(null);
  const hasProcessedLocalStorage = useRef(false);
  const lastProcessedIdRef = useRef(null);

  // TanStack Query hooks
  const {
    data: notifications = [],
    isLoading: notificationsLoading,
    refetch: refetchNotifications
  } = useNotifications({ enabled: !!token, limit: 100 });

  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();

  // Process localStorage selection when notifications are loaded
  useEffect(() => {
    const selectedNotificationId = localStorage.getItem('igcfms_selectedNotificationId');
    
    if (notifications.length > 0 && selectedNotificationId && selectedNotificationId !== lastProcessedIdRef.current) {
      hasProcessedLocalStorage.current = false;
      lastProcessedIdRef.current = selectedNotificationId;
      processNotificationSelection(notifications);
    } else if (notifications.length > 0 && !selectedNotification && !hasProcessedLocalStorage.current) {
      processNotificationSelection(notifications);
    }
  }, [notifications, selectedNotification]);

  // Listen for notification selection events from the bell
  useEffect(() => {
    const handleNotificationSelected = (event) => {
      const notificationId = event.detail.notificationId;
      lastProcessedIdRef.current = null;
      hasProcessedLocalStorage.current = false;
      
      if (notifications.length > 0) {
        processNotificationSelection(notifications);
      }
    };

    window.addEventListener('notificationSelected', handleNotificationSelected);
    return () => {
      window.removeEventListener('notificationSelected', handleNotificationSelected);
    };
  }, [notifications]);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target)) {
        setShowFilterDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const processNotificationSelection = (notificationData) => {
    const selectedNotificationId = localStorage.getItem('igcfms_selectedNotificationId');
    
    if (selectedNotificationId && !hasProcessedLocalStorage.current) {
      hasProcessedLocalStorage.current = true;
      
      const clickedNotification = notificationData.find(
        n => n.id.toString() === selectedNotificationId || n.id === parseInt(selectedNotificationId)
      );
      
      if (clickedNotification) {
        setSelectedNotification(clickedNotification);
        localStorage.removeItem('igcfms_selectedNotificationId');
        
        if (!clickedNotification.is_read) {
          markNotificationAsRead(clickedNotification.id);
        }
      } else if (notificationData.length > 0) {
        setSelectedNotification(notificationData[0]);
      }
    } else if (notificationData.length > 0 && !selectedNotification && !hasProcessedLocalStorage.current) {
      hasProcessedLocalStorage.current = true;
      setSelectedNotification(notificationData[0]);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await markAsReadMutation.mutateAsync(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await markAllAsReadMutation.mutateAsync();
      refetchNotifications();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getFilteredNotifications = () => {
    let filtered = notifications;

    // Apply filter
    switch (filter) {
      case 'unread':
        filtered = notifications.filter(n => !n.is_read);
        break;
      case 'read':
        filtered = notifications.filter(n => n.is_read);
        break;
      case 'override':
        filtered = notifications.filter(n => 
          n.type === 'override' || 
          n.type === 'override_request' ||
          n.type === 'override_reviewed' ||
          n.title?.toLowerCase().includes('override') ||
          n.message?.toLowerCase().includes('override')
        );
        break;
      default:
        filtered = notifications;
    }

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(n => 
        n.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.type?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
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
      case 'override_reviewed':
        return 'fas fa-edit';
      default:
        return 'fas fa-bell';
    }
  };

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter(n => !n.is_read).length;
  const filterOptions = [
    { value: 'all', label: 'All Notifications' },
    { value: 'unread', label: 'Unread' },
    { value: 'read', label: 'Read' },
    { value: 'override', label: 'Override Requests' }
  ];

  return (
    <div className="notification-bar-page">
      <div className="notification-header">
        <h2 className="page-title">
          <i className="fas fa-bell"></i>
          Notifications
        </h2>
        <div className="header-actions">
          {unreadCount > 0 && (
            <button className="mark-all-read-btn" onClick={markAllAsRead}>
              <i className="fas fa-check-double"></i>
              Mark all as read
            </button>
          )}
        </div>
      </div>

      <div className="notification-content">
        {/* Left Sidebar - Notification List */}
        <div className="notification-sidebar">
          <div className="notifications-list">
            <div className="search-section">
              <div className="search-input-container">
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                <i className="fas fa-search search-icon"></i>
              </div>
              <div className="search-filter-group" ref={filterDropdownRef}>
                <button
                  className={`filter-btn search-filter-btn ${showFilterDropdown ? 'active' : ''}`}
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                >
                  <i className="fas fa-filter"></i>
                </button>
                {showFilterDropdown && (
                  <div className="notifications-filter-dropdown">
                    {filterOptions.map((option) => (
                      <button
                        key={option.value}
                        className={`filter-option ${filter === option.value ? 'active' : ''}`}
                        onClick={() => {
                          setFilter(option.value);
                          setShowFilterDropdown(false);
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="notification-items-container">
              {notificationsLoading ? (
                <div className="notification-loading">
                  <i className="fas fa-spinner fa-spin"></i>
                  <span>Loading...</span>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="notification-empty">
                  <i className="fas fa-inbox"></i>
                  <p>No notifications</p>
                </div>
              ) : (
                filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    data-notification-id={notification.id}
                    className={`notification-card ${selectedNotification?.id === notification.id ? 'selected' : ''} ${!notification.is_read ? 'unread' : ''}`}
                    onClick={() => {
                      setSelectedNotification(notification);
                      if (!notification.is_read) {
                        markNotificationAsRead(notification.id);
                      }
                    }}
                  >
                    <div className="notification-card-icon">
                      <i className={getNotificationIcon(notification.type)}></i>
                    </div>
                    <div className="notification-card-content">
                      <div className="notification-card-title">
                        {notification.title}
                      </div>
                      <div className="notification-card-message">
                        {notification.message}
                      </div>
                      <div className="notification-card-time">
                        {formatTimeAgo(notification.created_at)}
                      </div>
                    </div>
                    {!notification.is_read && (
                      <div className="notification-card-unread"></div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Notification Details */}
        <div className="notification-details-panel">
          {selectedNotification ? (
            <div className="notification-details">
              <div className="details-header">
                <h3>{selectedNotification.title}</h3>
                <span className="details-time">
                  {formatTimeAgo(selectedNotification.created_at)}
                </span>
              </div>
              <div className="details-message">
                {selectedNotification.message}
              </div>
              {selectedNotification.data && (
                <div className="details-data">
                  <h4>Details</h4>
                  <div className="data-content">
                    {Object.entries(selectedNotification.data).map(([key, value]) => (
                      <div key={key} className="data-item">
                        <span className="data-key">{key}:</span>
                        <span className="data-value">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="notification-no-selection">
              <i className="fas fa-inbox"></i>
              <p>Select a notification to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
