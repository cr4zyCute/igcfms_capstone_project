import React, { useState, useEffect, useRef } from "react";
import "../admin/css/notificationbar.css";
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '../../hooks/useNotifications';
import { useAuth } from "../../contexts/AuthContext";

const NotificationsPage = () => {
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [filter, setFilter] = useState("all");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const filterDropdownRef = useRef(null);
  const hasProcessedLocalStorage = useRef(false);
  const [searchTerm, setSearchTerm] = useState("");

  const token = localStorage.getItem("token");
  const { user } = useAuth();

  // TanStack Query hooks
  const {
    data: notifications = [],
    isLoading: notificationsLoading,
    isFetching: notificationsFetching,
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

  const showLoading = notificationsLoading && filteredNotifications.length === 0;

  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();

  const lastProcessedIdRef = useRef(null);

  useEffect(() => {
    const selectedNotificationId = localStorage.getItem('igcfms_selectedNotificationId');
    
    if (filteredNotifications.length > 0 && selectedNotificationId && selectedNotificationId !== lastProcessedIdRef.current) {
      hasProcessedLocalStorage.current = false;
      lastProcessedIdRef.current = selectedNotificationId;
      processNotificationSelection(filteredNotifications);
    } else if (filteredNotifications.length > 0 && !selectedNotification && !hasProcessedLocalStorage.current) {
      processNotificationSelection(filteredNotifications);
    }
  }, [filteredNotifications, selectedNotification]);

  useEffect(() => {
    const handleNotificationSelected = (event) => {
      const notificationId = event.detail.notificationId;
      lastProcessedIdRef.current = null;
      hasProcessedLocalStorage.current = false;
      
      if (filteredNotifications.length > 0) {
        processNotificationSelection(filteredNotifications);
      }
    };

    window.addEventListener('notificationSelected', handleNotificationSelected);
    return () => {
      window.removeEventListener('notificationSelected', handleNotificationSelected);
    };
  }, [filteredNotifications]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(event.target)
      ) {
        setShowFilterDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
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
        
        if (!clickedNotification.is_read && !clickedNotification.read) {
          markNotificationAsRead(clickedNotification.id);
        }
        
        setTimeout(() => {
          const notificationElement = document.querySelector(`[data-notification-id="${clickedNotification.id}"]`);
          if (notificationElement) {
            notificationElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }, 100);
      }
    } else if (!selectedNotificationId && notificationData.length > 0) {
      setSelectedNotification(notificationData[0]);
      if (!notificationData[0].is_read && !notificationData[0].read) {
        markNotificationAsRead(notificationData[0].id);
      }
    }
  };

  const markNotificationAsRead = (notificationId) => {
    markAsReadMutation.mutate({ notificationId });
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
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

  const renderWithIcons = (text) => {
    if (!text) return '';
    return text.replace(/\[icon:(.*?)\]/g, (match, iconName) => {
      return `<i class="fas fa-${iconName}"></i>`;
    });
  };

  const getFilteredNotifications = () => {
    let result = filteredNotifications;

    if (filter !== "all") {
      result = result.filter(n => {
        const status = n.is_read || n.read ? "read" : "unread";
        return status === filter;
      });
    }

    if (searchTerm) {
      result = result.filter(n =>
        (n.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (n.message || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return result;
  };

  const displayedNotifications = getFilteredNotifications();
  const unreadCount = filteredNotifications.filter(n => !n.is_read && !n.read).length;

  return (
    <div className="notifications-page">
      <div className="notifications-container">
        <div className="notifications-header">
          <h1>Notifications</h1>
          <div className="header-actions">
            <button 
              className="mark-all-read-btn"
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
            >
              <i className="fas fa-check-double"></i>
              Mark all as read
            </button>
          </div>
        </div>

        <div className="notifications-content">
          <div className="notifications-list-section">
            <div className="list-header">
              <div className="search-bar">
                <i className="fas fa-search"></i>
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="filter-section" ref={filterDropdownRef}>
                <button
                  className="filter-btn"
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                >
                  <i className="fas fa-filter"></i>
                  {filter === "all" ? "All" : filter === "read" ? "Read" : "Unread"}
                </button>

                {showFilterDropdown && (
                  <div className="filter-dropdown">
                    <button
                      className={filter === "all" ? "active" : ""}
                      onClick={() => {
                        setFilter("all");
                        setShowFilterDropdown(false);
                      }}
                    >
                      All Notifications
                    </button>
                    <button
                      className={filter === "unread" ? "active" : ""}
                      onClick={() => {
                        setFilter("unread");
                        setShowFilterDropdown(false);
                      }}
                    >
                      Unread
                    </button>
                    <button
                      className={filter === "read" ? "active" : ""}
                      onClick={() => {
                        setFilter("read");
                        setShowFilterDropdown(false);
                      }}
                    >
                      Read
                    </button>
                  </div>
                )}
              </div>
            </div>

            {showLoading ? (
              <div className="loading-state">
                <i className="fas fa-spinner fa-spin"></i>
                <p>Loading notifications...</p>
              </div>
            ) : displayedNotifications.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-inbox"></i>
                <p>No notifications</p>
              </div>
            ) : (
              <div className="notifications-list">
                {displayedNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    data-notification-id={notification.id}
                    className={`notification-item ${
                      selectedNotification?.id === notification.id ? "active" : ""
                    } ${notification.is_read || notification.read ? "read" : "unread"}`}
                    onClick={() => {
                      setSelectedNotification(notification);
                      if (!notification.is_read && !notification.read) {
                        markNotificationAsRead(notification.id);
                      }
                    }}
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

          <div className="notification-preview-section">
            {selectedNotification ? (
              <div className="preview-container">
                <div className="preview-header">
                  <div className="preview-title">
                    <h2>{selectedNotification.title || 'Notification'}</h2>
                    <span className="preview-category">
                      • {selectedNotification.category || selectedNotification.type || 'System'}
                    </span>
                  </div>
                </div>

                <div className="preview-body">
                  <div className="notification-highlight">
                    <div className="highlight-icon">
                      <i className={getNotificationIcon(selectedNotification.type)}></i>
                    </div>
                    <div className="highlight-content">
                      <h3>System Notification</h3>
                      <p>{renderWithIcons(selectedNotification.message || selectedNotification.data)}</p>
                    </div>
                  </div>

                  <div className="preview-details">
                    <div className="detail-item">
                      <span className="detail-label">Status:</span>
                      <span className={`detail-value ${selectedNotification.is_read || selectedNotification.read ? 'read' : 'unread'}`}>
                        {selectedNotification.is_read || selectedNotification.read ? 'Read' : 'Unread'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Date:</span>
                      <span className="detail-value">
                        {selectedNotification.created_at
                          ? new Date(selectedNotification.created_at).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : 'No date available'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-selection">
                <i className="fas fa-inbox"></i>
                <p>Select a notification to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
