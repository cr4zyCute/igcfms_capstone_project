import React, { useState, useEffect } from "react";
import axios from "axios";
import "./css/notificationbar.css";

const NotificationBar = () => {
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const API_BASE = "http://localhost:8000/api";
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API_BASE}/notifications`, { headers });
      const notificationData = response.data.notifications || response.data || [];
      setNotifications(notificationData);
      
      // Auto-select first notification
      if (notificationData.length > 0) {
        setSelectedNotification(notificationData[0]);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Fallback to empty array if API fails
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredNotifications = () => {
    let filtered = notifications;

    // Apply filter
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

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
  };

  const handleNotificationClick = (notification) => {
    setSelectedNotification(notification);
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return "No date";
    
    try {
      const now = new Date();
      const notificationDate = new Date(timestamp);
      
      // Check if date is valid
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "#ef4444";
      case "medium":
        return "#f59e0b";
      case "low":
        return "#10b981";
      default:
        return "#6b7280";
    }
  };

  return (
    <div className="notification-bar-page">
      <div className="notification-header">
        <h2 className="page-title">
          <i className="fas fa-bell"></i>
          Notifications
        </h2>
        <div className="header-actions">
          <button className="mark-all-read-btn">
            <i className="fas fa-check-double"></i>
            Mark all as read
          </button>
          <button className="settings-btn">
            <i className="fas fa-cog"></i>
          </button>
        </div>
      </div>

      <div className="notification-content">
        {/* Left Sidebar - Notification List */}
        <div className="notification-sidebar">
          <div className="notification-filters">
            <div className="filter-tabs">
              <button 
                className={`filter-tab ${filter === "all" ? "active" : ""}`}
                onClick={() => setFilter("all")}
              >
                View all
              </button>
              <button 
                className={`filter-tab ${filter === "logins" ? "active" : ""}`}
                onClick={() => setFilter("logins")}
              >
                Log ins
              </button>
              <button 
                className={`filter-tab ${filter === "transactions" ? "active" : ""}`}
                onClick={() => setFilter("transactions")}
              >
                Transactions
              </button>
              <button 
                className={`filter-tab ${filter === "override" ? "active" : ""}`}
                onClick={() => setFilter("override")}
              >
                Override Request
              </button>
            </div>
          </div>

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
            </div>
            
            <div className="list-header">
              <h3>All Notifications</h3>
              <div className="list-actions">
                <button className="filter-btn">
                  <i className="fas fa-filter"></i>
                </button>
                <button className="more-btn">
                  <i className="fas fa-ellipsis-v"></i>
                </button>
              </div>
            </div>

            <div className="notification-items">
              {loading ? (
                <div className="loading-state">
                  <i className="fas fa-spinner fa-spin"></i>
                  <p>Loading notifications...</p>
                </div>
              ) : getFilteredNotifications().length > 0 ? (
                getFilteredNotifications().map((notification) => (
                  <div
                    key={notification.id}
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
                            style={{ color: getPriorityColor(notification.priority) }}
                          ></i>
                        </div>
                        <div className="notification-meta">
                          <span className="notification-time">
                            {getTimeAgo(notification.created_at || notification.timestamp)}
                          </span>
                          {!(notification.is_read || notification.read) && <div className="unread-dot"></div>}
                        </div>
                      </div>
                      <h4 className="notification-title">{notification.title || notification.type}</h4>
                      <p className="notification-message">{notification.message || notification.data}</p>
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
                  <h2 className="preview-title">{selectedNotification.title || selectedNotification.type}</h2>
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
                <div className="preview-actions">
                  <button className="action-btn">
                    <i className="fas fa-bookmark"></i>
                  </button>
                  <button className="action-btn">
                    <i className="fas fa-trash"></i>
                  </button>
                  <button className="action-btn">
                    <i className="fas fa-ellipsis-h"></i>
                  </button>
                </div>
              </div>

              <div className="preview-body">
                <div className="notification-highlight">
                  <div className="highlight-icon">
                    <i className={getNotificationIcon(selectedNotification.type)}></i>
                  </div>
                  <div className="highlight-content">
                    <h3>System Notification</h3>
                    <p>{selectedNotification.message || selectedNotification.data}</p>
                  </div>
                </div>

                <div className="notification-details">
                  <h4>Details</h4>
                  <p>{selectedNotification.details || selectedNotification.message || selectedNotification.data}</p>

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

export default NotificationBar;
