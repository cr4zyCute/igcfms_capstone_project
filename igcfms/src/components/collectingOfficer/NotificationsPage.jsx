import React, { useState, useEffect, useRef } from "react";
import "../admin/css/notificationbar.css";
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '../../hooks/useNotifications';
import { useNotificationsWebSocket } from '../../hooks/useNotificationsWebSocket';

const NotificationsPage = () => {
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [filter, setFilter] = useState("all");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const filterDropdownRef = useRef(null);
  const hasProcessedLocalStorage = useRef(false);

  const [searchTerm, setSearchTerm] = useState("");

  const token = localStorage.getItem("token");

  // WebSocket hook for real-time updates
  useNotificationsWebSocket();

  // TanStack Query hooks
  const {
    data: notifications = [],
    isLoading: notificationsLoading,
    isFetching: notificationsFetching,
    error: notificationsError
  } = useNotifications({ enabled: !!token });

  // Only show loading if we have no data AND we're loading
  const showLoading = notificationsLoading && notifications.length === 0;

  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();

  // Track the last processed notification ID to avoid re-processing
  const lastProcessedIdRef = useRef(null);

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
            notificationElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      } else {
        if (notificationData.length > 0) {
          setSelectedNotification(notificationData[0]);
        }
      }
    } else if (notificationData.length > 0 && !selectedNotification && !hasProcessedLocalStorage.current) {
      hasProcessedLocalStorage.current = true;
      setSelectedNotification(notificationData[0]);
    }
  };

  const filterOptions = [
    { value: "all", label: "View all", icon: "fas fa-stream" },
    { value: "logins", label: "Log ins", icon: "fas fa-sign-in-alt" },
    { value: "transactions", label: "Transactions", icon: "fas fa-exchange-alt" },
    { value: "override", label: "Override Request", icon: "fas fa-edit" }
  ];

  const getFilteredNotifications = () => {
    let filtered = notifications;

    switch (filter) {
      case "logins":
        filtered = notifications.filter(n => 
          n.type === "login" || 
          n.type === "logout" || 
          n.title?.toLowerCase().includes("log") ||
          n.message?.toLowerCase().includes("logged")
        );
        break;
      case "transactions":
        filtered = notifications.filter(n => 
          n.type === "transaction" || 
          n.type === "receipt" || 
          n.type === "disbursement" ||
          n.type === "collection" ||
          n.title?.toLowerCase().includes("transaction") ||
          n.message?.toLowerCase().includes("transaction")
        );
        break;
      case "override":
        filtered = notifications.filter(n => 
          n.type === "override" || 
          n.type === "override_request" ||
          n.title?.toLowerCase().includes("override") ||
          n.message?.toLowerCase().includes("override")
        );
        break;
      default:
        filtered = notifications;
    }

    if (searchTerm.trim()) {
      filtered = filtered.filter(n => 
        n.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.type?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await markAsReadMutation.mutateAsync(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    setSelectedNotification(notification);
    if (!notification.read && !notification.is_read) {
      markNotificationAsRead(notification.id);
    }
  };

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return "No date";
    
    try {
      const now = new Date();
      const notificationDate = new Date(timestamp);
      
      if (isNaN(notificationDate.getTime())) return "Invalid date";
      
      const diff = now - notificationDate;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      if (days > 0) {
        return days === 1 ? "Yesterday" : `${days} days ago`;
      } else if (hours > 0) {
        return `${hours}h ago`;
      } else {
        return "Just now";
      }
    } catch (error) {
      return "No date";
    }
  };

  const emojiIconMap = {
    "🔒": "fas fa-lock",
    "🔔": "fas fa-bell",
    "🔐": "fas fa-lock",
    "💸": "fas fa-money-bill-wave",
    "⚠️": "fas fa-exclamation-triangle",
    "⚠": "fas fa-exclamation-triangle"
  };

  const renderWithIcons = (text) => {
    if (!text || typeof text !== "string") return text;

    const parts = text.split(/(🔒|🔔|🔐|💸|⚠️|⚠)/);

    return parts.filter(Boolean).map((part, index) => {
      const iconClass = emojiIconMap[part];
      if (iconClass) {
        return <i key={`icon-${index}`} className={iconClass}></i>;
      }
      return <React.Fragment key={`text-${index}`}>{part}</React.Fragment>;
    });
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "transaction":
        return "fas fa-exchange-alt";
      case "receipt":
        return "fas fa-receipt";
      case "fund":
        return "fas fa-wallet";
      case "disbursement":
        return "fas fa-money-bill-wave";
      case "system":
        return "fas fa-cog";
      case "alert":
        return "fas fa-exclamation-triangle";
      case "report":
        return "fas fa-chart-bar";
      case "login":
      case "logout":
        return "fas fa-sign-in-alt";
      case "override":
      case "override_request":
        return "fas fa-edit";
      case "collection":
        return "fas fa-coins";
      default:
        return "fas fa-bell";
    }
  };

  const toggleFilterDropdown = () => {
    setShowFilterDropdown(prev => !prev);
  };

  const handleFilterChange = (value) => {
    setFilter(value);
    setShowFilterDropdown(false);
  };

  const selectedFilterLabel = filterOptions.find(option => option.value === filter)?.label || "Filter notifications";

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsReadMutation.mutateAsync();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  if (!token) return null;

  return (
    <div className="notification-bar-page">
      <div className="notification-header">
        <h2 className="page-title">
          <i className="fas fa-bell"></i>
          Notifications
          {notificationsFetching && notifications.length > 0 && (
            <span style={{ marginLeft: '10px', fontSize: '12px', color: '#64748b' }}>
              <i className="fas fa-sync fa-spin" style={{ fontSize: '10px' }}></i> Updating...
            </span>
          )}
        </h2>
        <div className="header-actions">
          <button className="mark-all-read-btn" onClick={handleMarkAllAsRead}>
            <i className="fas fa-check-double"></i>
            Mark all as read
          </button>
          {/* <button className="settings-btn">
            <i className="fas fa-cog"></i>
          </button> */}
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
                  className={`filter-btn search-filter-btn ${showFilterDropdown ? "active" : ""}`}
                  onClick={toggleFilterDropdown}
                >
                  <i className="fas fa-filter"></i>
                </button>
                {showFilterDropdown && (
                  <div className="notifications-filter-dropdown">
                    {filterOptions.map((option) => (
                      <button
                        key={option.value}
                        className={`notifications-filter-option ${filter === option.value ? "active" : ""}`}
                        onClick={() => handleFilterChange(option.value)}
                      >
                        <div className="filter-option-main">
                          <i className={option.icon}></i>
                          <span>{option.label}</span>
                        </div>
                        {filter === option.value && <i className="fas fa-check filter-check"></i>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="list-header">
              <h3> {selectedFilterLabel}</h3>
            </div>

            <div className="notification-items">
              {showLoading ? (
                <div className="loading-state">
                  <i className="fas fa-spinner fa-spin"></i>
                  <p>Loading notifications...</p>
                </div>
              ) : getFilteredNotifications().length > 0 ? (
                getFilteredNotifications().map((notification) => (
                  <div
                    key={notification.id}
                    data-notification-id={notification.id}
                    className={`notification-item ${
                      selectedNotification?.id === notification.id ? "selected" : ""
                    } ${!(notification.is_read || notification.read) ? "unread" : ""}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="notification-item-content">
                      <div className="notification-header-item">
                        <div className="notification-icon">
                          <i 
                            className={getNotificationIcon(notification.type)}
                          ></i>
                        </div>
                        <div className="notification-meta">
                          <span className="notification-time">
                            {getTimeAgo(notification.created_at || notification.timestamp)}
                          </span>
                          {!(notification.is_read || notification.read) && <div className="unread-dot"></div>}
                        </div>
                      </div>
                      <h4 className="notification-title">{renderWithIcons(notification.title || notification.type)}</h4>
                      <p className="notification-message">{renderWithIcons(notification.message || notification.data)}</p>
                      <div className="notification-tags">
                        <span className="category-tag">{notification.category || notification.type}</span>
                        {notification.type === 'login' && <span className="status-tag successful">Successful</span>}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-notifications">
                  <i className="fas fa-inbox"></i>
                  <p>No notifications found.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Notification Preview */}
        <div className="notification-preview">
          {selectedNotification ? (
            <div className="preview-content">
              <div className="preview-header">
                <div className="preview-title-section">
                  <h2 className="preview-title">{renderWithIcons(selectedNotification.title || selectedNotification.type)}</h2>
                  <div className="preview-meta">
                    <span className="preview-date">
                      {(selectedNotification.created_at || selectedNotification.timestamp) ? 
                        new Date(selectedNotification.created_at || selectedNotification.timestamp).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'No date available'
                      }
                    </span>
                    <span className="preview-category">• {selectedNotification.category || selectedNotification.type || 'System'}</span>
                  </div>
                </div>
                {/* <div className="preview-actions">
                  <button className="action-btn">
                    <i className="fas fa-bookmark"></i>
                  </button>
                  <button className="action-btn">
                    <i className="fas fa-trash"></i>
                  </button>
                  <button className="action-btn">
                    <i className="fas fa-ellipsis-h"></i>
                  </button>
                </div> */}
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

                <div className="notification-details">
                  <h4>Details</h4>
                  <p>{renderWithIcons(selectedNotification.details || selectedNotification.message || selectedNotification.data)}</p>

                  {selectedNotification.data && typeof selectedNotification.data === 'object' && (
                    <div className="related-data">
                      <h5>Related Information:</h5>
                      <ul>
                        {Object.entries(selectedNotification.data).map(([key, value]) => (
                          <li key={key}>
                            <strong>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</strong> {value}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {selectedNotification.user_id && (
                    <div className="related-data">
                      <h5>User Information:</h5>
                      <ul>
                        <li><strong>User ID:</strong> {selectedNotification.user_id}</li>
                        {selectedNotification.created_at && (
                          <li><strong>Timestamp:</strong> {new Date(selectedNotification.created_at).toLocaleString()}</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="notification-actions">
                  <button className="primary-action-btn">
                    <i className="fas fa-check"></i>
                    Mark as Handled
                  </button>
                  <button className="secondary-action-btn">
                    <i className="fas fa-external-link-alt"></i>
                    View Related Item
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-preview">
              <div className="empty-icon">
                <i className="fas fa-bell-slash"></i>
              </div>
              <h3>No notification selected</h3>
              <p>Choose a notification from the list to view its details and take actions.</p>
              <div className="empty-suggestions">
                <div className="suggestion-item">
                  <i className="fas fa-search"></i>
                  <span>Use the search bar to find specific notifications</span>
                </div>
                <div className="suggestion-item">
                  <i className="fas fa-filter"></i>
                  <span>Filter by type to narrow down results</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
