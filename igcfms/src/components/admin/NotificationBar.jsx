import React, { useState, useEffect, useRef } from "react";
import "./css/notificationbar.css";
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '../../hooks/useNotifications';

const NotificationBar = () => {
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [filter, setFilter] = useState("all");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showPreviewMenu, setShowPreviewMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [viewArchived, setViewArchived] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [localReadMap, setLocalReadMap] = useState({}); // overlay read/unread per id
  const [deletedIds, setDeletedIds] = useState({}); // locally removed notifications
  const [archivedMap, setArchivedMap] = useState({}); // locally archived notifications
  const filterDropdownRef = useRef(null);
  const previewMenuRef = useRef(null);
  const hasProcessedLocalStorage = useRef(false); // Track if we've processed localStorage

  const [searchTerm, setSearchTerm] = useState("");

  const token = localStorage.getItem("token");

  // TanStack Query hooks
  const {
    data: notifications = [],
    isLoading: notificationsLoading,
    isFetching: notificationsFetching,
    error: notificationsError
  } = useNotifications({ enabled: !!token });

  // Only show loading if we have no data AND we're loading
  // If we have cached data, show it immediately (no loading state)
  const showLoading = notificationsLoading && notifications.length === 0;

  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();

  // Track the last processed notification ID to avoid re-processing
  const lastProcessedIdRef = useRef(null);

  // Process localStorage selection when notifications are loaded
  useEffect(() => {
    const selectedNotificationId = localStorage.getItem('igcfms_selectedNotificationId');
    
    // Process if:
    // 1. We have notifications
    // 2. There's a notification ID in localStorage (new selection from bell)
    // 3. It's a different ID than the last one we processed
    if (notifications.length > 0 && selectedNotificationId && selectedNotificationId !== lastProcessedIdRef.current) {
      // Reset the flag to allow processing
      hasProcessedLocalStorage.current = false;
      lastProcessedIdRef.current = selectedNotificationId;
      processNotificationSelection(notifications);
    } else if (notifications.length > 0 && !selectedNotification && !hasProcessedLocalStorage.current) {
      // Auto-select first notification only on initial load
      processNotificationSelection(notifications);
    }
  }, [notifications, selectedNotification]);

  // Listen for notification selection events from the bell
  useEffect(() => {
    const handleNotificationSelected = (event) => {
      const notificationId = event.detail.notificationId;
      console.log('Received notificationSelected event:', notificationId);
      
      // Reset the last processed ID to force re-processing
      lastProcessedIdRef.current = null;
      hasProcessedLocalStorage.current = false;
      
      // Process the new selection
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
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target)) {
        setShowFilterDropdown(false);
      }
      if (previewMenuRef.current && !previewMenuRef.current.contains(event.target)) {
        setShowPreviewMenu(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const processNotificationSelection = (notificationData) => {
    // Check if there's a selected notification ID from localStorage (clicked from bell)
    // Only process localStorage once to prevent resetting
    const selectedNotificationId = localStorage.getItem('igcfms_selectedNotificationId');
    
    console.log('Selected Notification ID from localStorage:', selectedNotificationId);
    console.log('Available notifications:', notificationData.map(n => ({ id: n.id, type: typeof n.id })));
    console.log('Has processed localStorage:', hasProcessedLocalStorage.current);
    
    if (selectedNotificationId && !hasProcessedLocalStorage.current) {
      // Mark as processed immediately to prevent re-processing
      hasProcessedLocalStorage.current = true;
      
      // Try both string and number comparison
      const clickedNotification = notificationData.find(
        n => n.id.toString() === selectedNotificationId || n.id === parseInt(selectedNotificationId)
      );
      
      console.log('Found clicked notification:', clickedNotification);
      
      if (clickedNotification) {
        setSelectedNotification(clickedNotification);
        // Clear the localStorage after selecting
        localStorage.removeItem('igcfms_selectedNotificationId');
        
        // Mark the notification as read if it's unread
        const isRead = localReadMap[clickedNotification.id] !== undefined ? localReadMap[clickedNotification.id] : (clickedNotification.is_read || clickedNotification.read);
        if (!isRead) {
          markNotificationAsRead(clickedNotification.id);
          setLocalReadMap(prev => ({ ...prev, [clickedNotification.id]: true }));
        }
        
        // Scroll to the notification in the list after a short delay
        setTimeout(() => {
          const notificationElement = document.querySelector(`[data-notification-id="${clickedNotification.id}"]`);
          if (notificationElement) {
            notificationElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      } else {
        console.log('Notification not found, selecting first one');
        if (notificationData.length > 0) {
          setSelectedNotification(notificationData[0]);
        }
      }
    } else if (notificationData.length > 0 && !selectedNotification && !hasProcessedLocalStorage.current) {
      // Auto-select first notification only if no notification is selected and localStorage wasn't processed
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
    const baseList = viewArchived ? Object.values(archivedMap) : notifications;
    let filtered = baseList;

    // Apply filter
    switch (filter) {
      case "logins":
        filtered = baseList.filter(n => 
          n.type === "login" || 
          n.type === "logout" || 
          n.title?.toLowerCase().includes("log") ||
          n.message?.toLowerCase().includes("logged")
        );
        break;
      case "transactions":
        filtered = baseList.filter(n => 
          n.type === "transaction" || 
          n.type === "receipt" || 
          n.type === "disbursement" ||
          n.type === "collection" ||
          n.title?.toLowerCase().includes("transaction") ||
          n.message?.toLowerCase().includes("transaction")
        );
        break;
      case "override":
        filtered = baseList.filter(n => 
          n.type === "override" || 
          n.type === "override_request" ||
          n.title?.toLowerCase().includes("override") ||
          n.message?.toLowerCase().includes("override")
        );
        break;
      default:
        filtered = baseList;
    }

    // Remove locally deleted items (apply to both views)
    filtered = filtered.filter(n => !deletedIds[n.id]);
    // In active view, exclude archived items; in archived view, we already used archived list
    if (!viewArchived) {
      filtered = filtered.filter(n => !archivedMap[n.id]);
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

  const markNotificationAsRead = async (notificationId) => {
    try {
      await markAsReadMutation.mutateAsync(notificationId);
      console.log('Notification marked as read:', notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    setSelectedNotification(notification);
    const isRead = localReadMap[notification.id] !== undefined ? localReadMap[notification.id] : (notification.read || notification.is_read);
    if (!isRead) {
      markNotificationAsRead(notification.id);
      setLocalReadMap(prev => ({ ...prev, [notification.id]: true }));
    }
    setShowPreviewMenu(false);
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

  const selectedFilterLabel = viewArchived ? 'Archived' : (filterOptions.find(option => option.value === filter)?.label || "Filter notifications");
  const filteredNotifications = getFilteredNotifications();

  const handlePreviewAction = async (action) => {
    if (!selectedNotification) return;

    switch (action) {
      case 'markRead': {
        const id = selectedNotification.id;
        const isRead = (localReadMap[id] !== undefined ? localReadMap[id] : (selectedNotification.read || selectedNotification.is_read));
        if (isRead) {
          // Mark as unread (local only)
          setLocalReadMap(prev => ({ ...prev, [id]: false }));
          setSelectedNotification(prev => prev ? { ...prev, read: false, is_read: false } : prev);
        } else {
          // Mark as read (call API + local overlay)
          await markNotificationAsRead(id);
          setLocalReadMap(prev => ({ ...prev, [id]: true }));
          setSelectedNotification(prev => prev ? { ...prev, read: true, is_read: true } : prev);
        }
        break;
      }
      case 'delete':
        setShowDeleteModal(true);
        break;
      case 'archive':
        // Toggle archive/unarchive based on current state
        if (archivedMap[selectedNotification.id]) {
          handleUnarchive(selectedNotification.id);
        } else {
          handleArchiveNotification(selectedNotification);
        }
        break;
      default:
        break;
    }

    setShowPreviewMenu(false);
  };

  const handleConfirmDelete = async () => {
    if (!selectedNotification) return;
    setDeleteLoading(true);
    try {
      const id = selectedNotification.id;
      // Local removal from list
      setDeletedIds(prev => ({ ...prev, [id]: true }));
      setSelectedNotification(null);
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
    }
  };

  const handleArchiveNotification = (notification) => {
    if (!notification) return;
    setArchivedMap(prev => ({ ...prev, [notification.id]: notification }));
    setSelectedNotification(null);
    setViewArchived(true);
  };

  const handleUnarchive = (notificationId) => {
    setArchivedMap(prev => {
      const updated = { ...prev };
      delete updated[notificationId];
      return updated;
    });
  };

  const toggleArchiveView = () => {
    setViewArchived(prev => !prev);
  };

  // When switching viewArchived, ensure a valid selection
  useEffect(() => {
    const currentList = getFilteredNotifications();
    if (currentList.length === 0) {
      setSelectedNotification(null);
      return;
    }
    if (!selectedNotification || !currentList.some(n => n.id === selectedNotification.id)) {
      setSelectedNotification(currentList[0]);
    }
  }, [viewArchived, archivedMap, deletedIds, notifications, filter, searchTerm]);

  return (
    <div className="notification-bar-page">
      {/* <div className="notification-header">
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
          <button className="settings-btn">
            <i className="fas fa-cog"></i>
          </button>
        </div>
      </div> */}

      <div className="notification-content">
        {/* Left Sidebar - Notification List */}
        <div className="notification-sidebar">
          <div className="notifications-list">
            <div className="search-section">
              <div className="search-input-container">
                <input
                  type="text"
                  placeholder={viewArchived ? "Search archived notifications..." : "Search notifications..."}
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
              <div className="search-archive-group">
                <button
                  type="button"
                  className={`archive-btn ${viewArchived ? "active" : ""}`}
                  onClick={toggleArchiveView}
                  title={viewArchived ? 'Show active notifications' : 'Show archived notifications'}
                >
                  <i className={`fas ${viewArchived ? 'fa-bell' : 'fa-box-archive'}`}></i>
                </button>
              </div>
            </div>
                
            <div className="list-header">
              <h3> {selectedFilterLabel}</h3>
              {notificationsFetching && notifications.length > 0 && (
            <span style={{ marginLeft: '10px', fontSize: '12px', color: '#64748b' }}>
              <i className="fas fa-sync fa-spin" style={{ fontSize: '10px' }}></i> Updating...
            </span>
          )}
              {!viewArchived && (
                <button className="mark-all-read-btn">
                  <i className="fas fa-check-double"></i>
                  Mark all as read
                </button>
              )}
            </div>

            <div className="notification-items">
              {showLoading ? (
                <div className="loading-state">
                  <i className="fas fa-spinner fa-spin"></i>
                  <p>Loading notifications...</p>
                </div>
              ) : filteredNotifications.length > 0 ? (
                filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    data-notification-id={notification.id}
                    className={`notification-item ${
                      selectedNotification?.id === notification.id ? "selected" : ""
                    } ${!(localReadMap[notification.id] !== undefined ? localReadMap[notification.id] : (notification.is_read || notification.read)) ? "unread" : ""}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="notification-item-content">
                      <div className="notification-header-item">
                        <div className="notification-icon">
                          <i 
                            className={getNotificationIcon(notification.type)}
                          ></i>
                        </div>
                        <div className="notification-tags">
                        <span className="category-tag">{notification.category || notification.type}</span>
                        {notification.type === 'login' && <span className="status-tag successful">Successful</span>}
                      </div>
                        <div className="notification-meta">
                          <span className="notification-time">
                            {getTimeAgo(notification.created_at || notification.timestamp)}
                          </span>
                          {!
                            ((localReadMap[notification.id] !== undefined
                              ? localReadMap[notification.id]
                              : (notification.is_read || notification.read)))
                            && <div className="unread-dot"></div>
                          }
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
                  <i className={`fas ${viewArchived ? 'fa-box-open' : 'fa-inbox'}`}></i>
                  <p>{viewArchived ? 'No archived notifications found.' : 'No notifications found.'}</p>
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
                <div className="preview-actions" ref={previewMenuRef}>
                  <button
                    className={`action-btn preview-menu-btn ${showPreviewMenu ? "active" : ""}`}
                    onClick={() => setShowPreviewMenu(prev => !prev)}
                  >
                    <i className="fas fa-ellipsis-v"></i>
                  </button>
                  {showPreviewMenu && (
                    <div className="preview-menu-dropdown">
                      <button
                        className="preview-menu-option"
                        onClick={() => handlePreviewAction('markRead')}
                      >
                        <i className="fas fa-check"></i>
                        <span>{(selectedNotification && ((localReadMap[selectedNotification.id] !== undefined ? localReadMap[selectedNotification.id] : (selectedNotification.read || selectedNotification.is_read)))) ? 'Mark as Unread' : 'Mark as read'}</span>
                      </button>
                      <button
                        className="preview-menu-option"
                        onClick={() => handlePreviewAction('delete')}
                      >
                        <i className="fas fa-trash"></i>
                        <span>Delete</span>
                      </button>
                      <button
                        className="preview-menu-option"
                        onClick={() => handlePreviewAction('archive')}
                      >
                        <i className="fas fa-archive"></i>
                        <span>{archivedMap[selectedNotification.id] ? 'Unarchive' : 'Archive'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="preview-body">
                {/* <div className="notification-highlight">
                  <div className="highlight-icon">
                    <i className={getNotificationIcon(selectedNotification.type)}></i>
                  </div>
                  <div className="highlight-content">
                    <h3>System Notification</h3>
                    <p>{renderWithIcons(selectedNotification.message || selectedNotification.data)}</p>
                  </div>
                </div> */}

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
                <i className={`fas ${viewArchived ? 'fa-box-open' : 'fa-bell-slash'}`}></i>
              </div>
              <h3>{viewArchived ? 'No archived notification selected' : 'No notification selected'}</h3>
              <p>{viewArchived ? 'Choose an archived notification from the list to view its details and take actions.' : 'Choose a notification from the list to view its details and take actions.'}</p>
              <div className="empty-suggestions">
                <div className="suggestion-item">
                  <i className="fas fa-search"></i>
                  <span>{viewArchived ? 'Use the search bar to find specific archived notifications' : 'Use the search bar to find specific notifications'}</span>
                </div>
                <div className="suggestion-item">
                  <i className="fas fa-filter"></i>
                  <span>{viewArchived ? 'Filter by type to narrow down archived results' : 'Filter by type to narrow down results'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Notification delete confirmation modal (own classnames) */}
      {showDeleteModal && (
        <div className="notif-delete-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="notif-delete-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="notif-delete-modal-header">
              <i className="fas fa-exclamation-triangle notif-delete-warning-icon"></i>
              <h3 className="notif-delete-modal-title">Delete Notification</h3>
            </div>

            <div className="notif-delete-modal-body">
              <p className="notif-delete-confirmation-text">
                Are you sure you want to delete this notification? This action cannot be undone.
              </p>

              {selectedNotification && (
                <div className="notif-receipt-details-summary">
                  <div className="notif-detail-row">
                    <span className="notif-detail-label">ID:</span>
                    <span className="notif-detail-value">{selectedNotification.id}</span>
                  </div>
                  <div className="notif-detail-row">
                    <span className="notif-detail-label">Title:</span>
                    <span className="notif-detail-value">{selectedNotification.title || selectedNotification.type}</span>
                  </div>
                  <div className="notif-detail-row">
                    <span className="notif-detail-label">Date:</span>
                    <span className="notif-detail-value">{(selectedNotification.created_at || selectedNotification.timestamp) ? new Date(selectedNotification.created_at || selectedNotification.timestamp).toLocaleString() : 'N/A'}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="notif-delete-modal-footer">
              <button
                type="button"
                className="notif-delete-btn notif-delete-btn-cancel"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="notif-delete-btn notif-delete-btn-confirm"
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Deleting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-trash"></i>
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBar;
