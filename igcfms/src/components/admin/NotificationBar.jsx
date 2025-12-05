import React, { useState, useEffect, useRef, useMemo } from "react";
import "./css/notificationbar.css";
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '../../hooks/useNotifications';
import { useFundAccounts } from '../../hooks/useFundAccounts';

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

  // Fund accounts for resolving fund account names in preview
  const { data: fundAccountsPayload } = useFundAccounts({ page: 1, limit: 1000, enabled: !!token });
  const fundAccountsList = (fundAccountsPayload && fundAccountsPayload.data) ? fundAccountsPayload.data : [];
  const fundNameById = useMemo(() => {
    const map = {};
    for (const acc of fundAccountsList) {
      map[String(acc.id)] = acc.name || acc.code || `Account #${acc.id}`;
    }
    return map;
  }, [fundAccountsList]);

  // Track the last processed notification ID to avoid re-processing
  const lastProcessedIdRef = useRef(null);

  // Helpers to suppress redundant notifications
  const parseTime = (t) => {
    try { return new Date(t).getTime(); } catch (e) { return 0; }
  };
  // Robust numeric parser that accepts strings like "₱1,234.56" or "1,234.56"
  const parseAmount = (value) => {
    if (value == null) return NaN;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const cleaned = value.replace(/[^0-9.-]/g, '');
      const n = Number.parseFloat(cleaned);
      return Number.isFinite(n) ? n : NaN;
    }
    return NaN;
  };
  const extractAmountFromText = (text) => {
    if (!text || typeof text !== 'string') return NaN;
    const match = text.match(/₱?\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/);
    if (!match) return NaN;
    return parseAmount(match[0]);
  };
  const getNotificationAmount = (n) => {
    const d = (n?.data && typeof n.data === 'object') ? n.data : (typeof n?.data === 'string' ? (() => { try { return JSON.parse(n.data); } catch { return {}; } })() : {});
    let v = parseAmount(d.amount);
    if (!Number.isFinite(v)) v = parseAmount(n?.amount);
    if (!Number.isFinite(v)) v = extractAmountFromText(n?.message || n?.details || '');
    return v;
  };

  // Safely coerce notification "data" to an object when backend returns a JSON string
  const asObject = (value) => {
    if (!value) return {};
    if (typeof value === 'object') return value;
    if (typeof value === 'string') {
      try { return JSON.parse(value); } catch { return {}; }
    }
    return {};
  };

  // Extract fund account name from a message like "... fund account: Building Renovation"
  const extractFundAccountName = (text) => {
    if (!text || typeof text !== 'string') return null;
    const m = text.match(/fund\s*account\s*:\s*([^\n\r]+)/i);
    if (m && m[1]) {
      return m[1].trim();
    }
    return null;
  };

  // Try to get fund account id and/or name from a notification
  const getFundIdAndName = (n) => {
    const d = asObject(n?.data);
    const idRaw = (d && d.fund_account_id != null) ? d.fund_account_id : (n?.fund_account_id != null ? n.fund_account_id : null);
    let id = idRaw != null ? String(idRaw) : null;
    let name = null;
    if (id && fundNameById[id]) {
      name = fundNameById[id];
    }
    if (!name) {
      const fromMsg = extractFundAccountName(n?.message || n?.details || '');
      if (fromMsg) {
        name = fromMsg;
        // Try to map back to id by exact case-insensitive match
        const match = Object.entries(fundNameById).find(([, v]) => (v || '').toLowerCase() === fromMsg.toLowerCase());
        if (match) id = match[0];
      }
    }
    // Fallback: infer from nearby System Activity that mentions fund account
    if (!name) {
      const targetTs = parseTime(n?.created_at || n?.timestamp || (d?.timestamp));
      const targetUser = (d?.user_name || '').toLowerCase();
      let best = null;
      const scanList = [...notifications, ...Object.values(archivedMap || {})];
      for (const m of scanList) {
        const text = (m?.message || m?.details || '');
        const md = asObject(m?.data);
        const inferredFromId = md?.fund_account_id != null ? fundNameById[String(md.fund_account_id)] || null : null;
        const inferredFromMsg = extractFundAccountName(text);
        const inferred = inferredFromId || inferredFromMsg;
        if (!inferred) continue;
        const ts = parseTime(m?.created_at || m?.timestamp || md?.timestamp);
        if (!Number.isFinite(ts) || !Number.isFinite(targetTs)) continue;
        const diff = Math.abs(ts - targetTs);
        // within 10 minutes window
        if (diff <= 10 * 60 * 1000) {
          const sameUser = (md?.user_name || '').toLowerCase() === targetUser;
          const score = diff + (sameUser ? 0 : 60 * 1000); // prefer same user
          if (!best || score < best.score) {
            best = { name: inferred, score };
          }
        }
      }
      if (best) {
        name = best.name;
        const match = Object.entries(fundNameById).find(([, v]) => (v || '').toLowerCase() === best.name.toLowerCase());
        if (match) id = match[0];
      }
    }
    if (!name && id) {
      name = `Account #${id}`;
    }
    return { id, name };
  };

  const getFundKeyFromNotification = (n) => {
    const { id, name } = getFundIdAndName(n) || {};
    if (id) return `id:${id}`;
    if (name) return `name:${name.toLowerCase()}`;
    return null;
  };

  // Resolve fund account names for a notification (single or grouped)
  function getFundAccountNamesForNotification(notif) {
    try {
      const ids = Array.isArray(notif?._groupIds) && notif._groupIds.length > 0
        ? notif._groupIds
        : [notif?.id].filter(Boolean);
      const namesSet = new Set();
      ids.forEach((gid) => {
        const item = notifications.find(n => n.id === gid) || archivedMap[gid];
        if (!item) return;
        const d = asObject(item.data);
        const accId = d.fund_account_id != null ? d.fund_account_id : item.fund_account_id;
        if (accId != null) {
          const nm = fundNameById[String(accId)] || `Account #${accId}`;
          namesSet.add(nm);
        } else {
          const { name: fallbackName } = getFundIdAndName(item) || {};
          if (fallbackName) namesSet.add(fallbackName);
        }
      });
      return Array.from(namesSet);
    } catch (e) {
      return [];
    }
  }

  // Memoized names for the currently selected notification
  const selectedFundNames = useMemo(() => {
    if (!selectedNotification) return [];
    return getFundAccountNamesForNotification(selectedNotification);
  }, [selectedNotification, notifications, archivedMap, fundNameById]);
  const isFundUpdate = (n) => ((n?.title || '').toLowerCase().includes('fund account updated'));
  const isCollectionOrDisbursement = (n) => {
    const title = (n?.title || '').toLowerCase();
    const type = (n?.type || '').toLowerCase();
    return title.includes('collection') || title.includes('disbursement') || ['collection','disbursement','transaction','receipt'].includes(type);
  };
  const sameFundId = (a, b) => {
    const da = (a?.data && typeof a.data === 'object') ? a.data : {};
    const db = (b?.data && typeof b.data === 'object') ? b.data : {};
    if (da.fund_account_id == null || db.fund_account_id == null) return false;
    return String(da.fund_account_id) === String(db.fund_account_id);
  };
  // const suppressRedundantFundUpdates = (list, windowMs = 5 * 60 * 1000) => {
  //   // Suppress "Fund Account Updated" notifications when a collection/disbursement exists
  //   // on the same fund account within a time window (default 5 minutes)
  //   // NOTE: Fund Account Updated notifications are now disabled at the source (ActivityTracker.php)
  //   if (!Array.isArray(list) || list.length === 0) return list;
  //   const txnItems = list.filter(isCollectionOrDisbursement);
  //   return list.filter(item => {
  //     if (!isFundUpdate(item)) return true;
  //     const t0 = parseTime(item.created_at || item.timestamp || 0);
  //     return !txnItems.some(tx => {
  //       if (!sameFundId(item, tx)) return false;
  //       const t1 = parseTime(tx.created_at || tx.timestamp || 0);
  //       return Math.abs(t1 - t0) <= windowMs;
  //     });
  //   });
  // };

  // Collection helpers
  function isCollectionNotification(n) {
    if (!n) return false;
    const t = (n?.type || '').toLowerCase();
    const title = (n?.title || '').toLowerCase();
    return t === 'collection' || title.includes('collection');
  }
  function isCollectionGroup(n) {
    if (!n) return false;
    if (isCollectionNotification(n)) return true;
    const ids = Array.isArray(n?._groupIds) ? n._groupIds : [];
    return ids.some((gid) => {
      const item = notifications.find(x => x.id === gid) || archivedMap[gid];
      return isCollectionNotification(item);
    });
  }

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

  // Build a grouping key for notifications that belong to the same real-world activity
  // Priority: data.reference_no -> data.receipt_no -> data.reference -> data.receipt
  // Then: coalesce Fund Account Updated and Collection/Disbursement that hit the same fund account within the same hour
  // Fallback for other transaction-like items: title/type + minute-bucket + name hint
  const buildGroupKey = (n) => {
    if (!n) return null;
    const data = (n.data && typeof n.data === 'object') ? n.data : {};
    const ref = data.reference_no || data.receipt_no || data.reference || data.receipt || data.transaction_group_id || data.transactionGroupId;
    const base = (n.title || n.type || '').toString().toLowerCase();

    // Only try to coalesce transaction-like notifications on a best-effort basis
    const isTxnLike = (() => {
      const t = (n.type || '').toString().toLowerCase();
      const title = (n.title || '').toString().toLowerCase();
      return (
        ["transaction", "receipt", "disbursement", "collection", "fund", "user_activity"].includes(t) ||
        title.includes("collection") || title.includes("disbursement") || title.includes("receipt") || title.includes("cheque") || title.includes("fund account")
      );
    })();
    if (!isTxnLike) return null;

    const createdAt = n.created_at || n.timestamp;
    // 1) Merge by fund account + hour for fund updates and collections/disbursements
    const fundKey = getFundKeyFromNotification(n);
    let hourBucket = '';
    try {
      if (createdAt) hourBucket = new Date(createdAt).toISOString().slice(0, 13); // YYYY-MM-DDTHH
    } catch (e) { /* ignore */ }
    if (fundKey && hourBucket) {
      return `fund:${fundKey}|h:${hourBucket}`;
    }

    // If fund+hour didn't apply, fall back to reference-based grouping
    if (ref) return `ref:${String(ref)}|${base}`;

    // 2) Fallback: title/type + minute bucket + name hint
    let minuteBucket = '';
    try {
      if (createdAt) minuteBucket = new Date(createdAt).toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
    } catch (e) { /* ignore */ }
    const nameHint = (data.payer || data.user_name || data.recipient || '').toString().toLowerCase();
    return minuteBucket ? `min:${minuteBucket}|${base}|${nameHint}` : null;
  };

  // Merge notifications that share the same group key. The merged item keeps the newest item as base
  // and exposes _groupIds, _groupCount, and computed read state across the group.
  const mergeSameTransactionNotifications = (list) => {
    if (!Array.isArray(list) || list.length === 0) return [];

    const groups = new Map();
    for (const n of list) {
      const key = buildGroupKey(n) || `id:${n.id}`; // ensure every item lands in a group
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(n);
    }

    const merged = [];
    for (const [key, items] of groups.entries()) {
      if (!items || items.length === 0) continue;
      // newest first by created_at, then by id
      const sorted = items.slice().sort((a, b) => {
        const aT = new Date(a.created_at || a.timestamp || 0).getTime();
        const bT = new Date(b.created_at || b.timestamp || 0).getTime();
        if (bT !== aT) return bT - aT;
        return (b.id || 0) - (a.id || 0);
      });

      if (sorted.length === 1) {
        merged.push(sorted[0]);
        continue;
      }

      const base = { ...sorted[0] };
      const ids = sorted.map(n => n.id);
      const anyUnread = sorted.some(n => {
        const local = localReadMap[n.id];
        const effective = (local !== undefined ? local : (n.is_read || n.read));
        return !effective;
      });

      // Sum available amounts if present (best-effort) using robust parser (handles ₱ and commas)
      const sumAmount = sorted.reduce((acc, item) => {
        const amt = getNotificationAmount(item);
        return acc + (Number.isFinite(amt) ? amt : 0);
      }, 0);
      // Sum collections only and count them (used for display)
      const sumCollectionAmount = sorted.reduce((acc, item) => {
        const isCol = isCollectionNotification(item);
        if (!isCol) return acc;
        const amt = getNotificationAmount(item);
        return acc + (Number.isFinite(amt) ? amt : 0);
      }, 0);
      const collectionCount = sorted.reduce((acc, item) => acc + (isCollectionNotification(item) ? 1 : 0), 0);

      const count = sorted.length;
      const refFromData = (() => {
        const d = (base.data && typeof base.data === 'object') ? base.data : {};
        return d.reference_no || d.receipt_no || d.reference || d.receipt || null;
      })();

      const niceTitle = `${base.title || base.type || 'Notification'} (${count})`;
      const summaryParts = [];
      if (refFromData) summaryParts.push(`Ref: ${refFromData}`);
      if (sumCollectionAmount > 0) {
        summaryParts.push(`Collections ₱${sumCollectionAmount.toLocaleString()}`);
      } else if (sumAmount > 0) {
        summaryParts.push(`Total ₱${sumAmount.toLocaleString()}`);
      }
      summaryParts.push(`${count} item${count > 1 ? 's' : ''}`);
      const detailsText = `Merged ${summaryParts.join(' • ')}`;

      const mergedObj = {
        ...base,
        // Keep the newest item's id for DOM anchoring, but expose all underlying ids
        id: base.id,
        title: niceTitle,
        // Prefer keeping original message; add a concise group summary as details
        details: detailsText,
        is_read: !anyUnread,
        _group: true,
        _groupIds: ids,
        _groupCount: count,
        _groupSumAmount: sumAmount,
        _groupCollectionSumAmount: sumCollectionAmount,
        _groupCollectionCount: collectionCount,
        _groupRef: refFromData,
      };

      merged.push(mergedObj);
    }

    // Keep the same overall ordering: newest group first
    return merged.sort((a, b) => {
      const aT = new Date(a.created_at || a.timestamp || 0).getTime();
      const bT = new Date(b.created_at || b.timestamp || 0).getTime();
      if (bT !== aT) return bT - aT;
      return (b.id || 0) - (a.id || 0);
    });
  };

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

    // Suppress redundant Fund Account Updated notifications if a collection/disbursement
    // occurred on the same fund account within a short time window
    // NOTE: Fund Account Updated notifications are now disabled at the source (ActivityTracker.php)
    // filtered = suppressRedundantFundUpdates(filtered);

    // Apply search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(n => 
        n.title?.toLowerCase().includes(q) ||
        n.message?.toLowerCase().includes(q) ||
        (typeof n.details === 'string' && n.details.toLowerCase().includes(q)) ||
        n.type?.toLowerCase().includes(q) ||
        (n.data && typeof n.data === 'object' && (
          String(n.data.reference_no || n.data.receipt_no || n.data.reference || '').toLowerCase().includes(q)
        ))
      );
    }

    // Merge notifications that belong to the same transaction
    const merged = mergeSameTransactionNotifications(filtered);
    return merged;
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await markAsReadMutation.mutateAsync(notificationId);
      console.log('Notification marked as read:', notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsReadMutation.mutateAsync();
      // Update local state to mark all notifications as read
      const newReadMap = {};
      filteredNotifications.forEach(notification => {
        const ids = Array.isArray(notification._groupIds) && notification._groupIds.length > 0
          ? notification._groupIds
          : [notification.id];
        ids.forEach(id => { newReadMap[id] = true; });
      });
      setLocalReadMap(prev => ({ ...prev, ...newReadMap }));
      console.log('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    setSelectedNotification(notification);
    const ids = Array.isArray(notification._groupIds) && notification._groupIds.length > 0
      ? notification._groupIds
      : [notification.id];

    try {
      // Determine which ids are unread and mark them as read
      const unreadIds = ids.filter(id => {
        const original = notifications.find(n => n.id === id);
        const isReadEffective = localReadMap[id] !== undefined ? localReadMap[id] : (original?.is_read || original?.read);
        return !isReadEffective;
      });
      for (const id of unreadIds) {
        await markNotificationAsRead(id);
      }
      // Overlay local map for all ids
      setLocalReadMap(prev => {
        const updated = { ...prev };
        ids.forEach(id => { updated[id] = true; });
        return updated;
      });
    } catch (e) {
      // no-op; server state will refresh via react-query
    }

    setShowPreviewMenu(false);
  };

  // Determine if all items in a notification (or its group) are read, considering local overlay
  const isNotificationGroupAllRead = (notif) => {
    if (!notif) return true;
    const ids = Array.isArray(notif._groupIds) && notif._groupIds.length > 0
      ? notif._groupIds
      : [notif.id];
    return ids.every(id => {
      const original = notifications.find(n => n.id === id);
      return (localReadMap[id] !== undefined ? localReadMap[id] : (original?.is_read || original?.read));
    });
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

  const formatCurrency = (value) => {
    const n = Number.parseFloat(value);
    if (!Number.isFinite(n)) return null;
    return `₱${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const emojiIconMap = {
    "🔒": "fas fa-lock",
    "🔔": "fas fa-bell",
    "🔐": "fas fa-lock",
    "💸": "fas fa-money-bill-wave",
    "⚠️": "fas fa-exclamation-triangle",
    "⚠": "fas fa-exclamation-triangle",
    "🏦": "fas fa-building",
    "💰": "fas fa-coins",
    "💳": "fas fa-credit-card",
    "📊": "fas fa-chart-bar",
    "📈": "fas fa-chart-line",
    "📉": "fas fa-chart-line",
    "🔄": "fas fa-sync",
    "✅": "fas fa-check-circle",
    "❌": "fas fa-times-circle",
    "⏰": "fas fa-clock",
    "📝": "fas fa-file-alt",
    "👤": "fas fa-user",
    "👥": "fas fa-users",
    "🎯": "fas fa-bullseye",
    "📌": "fas fa-thumbtack",
    "🔑": "fas fa-key",
    "🚀": "fas fa-rocket",
    "⭐": "fas fa-star",
    "🎁": "fas fa-gift",
    "📦": "fas fa-box"
  };

  const renderWithIcons = (text) => {
    if (!text || typeof text !== "string") return text;

    const emojiPattern = /(🔒|🔔|🔐|💸|⚠️|⚠|🏦|💰|💳|📊|📈|📉|🔄|✅|❌|⏰|📝|👤|👥|🎯|📌|🔑|🚀|⭐|🎁|📦)/g;
    const parts = text.split(emojiPattern);

    return parts.filter(Boolean).map((part, index) => {
      const iconClass = emojiIconMap[part];
      if (iconClass) {
        return <i key={`icon-${index}`} className={`${iconClass}`} style={{ marginRight: '4px', color: '#111827' }}></i>;
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
        const ids = Array.isArray(selectedNotification._groupIds) && selectedNotification._groupIds.length > 0
          ? selectedNotification._groupIds
          : [selectedNotification.id];

        // If every id is read, toggle to unread locally, else mark all as read
        const allRead = ids.every(id => (localReadMap[id] !== undefined ? localReadMap[id] : (notifications.find(n => n.id === id)?.is_read || false)));
        if (allRead) {
          // local-only unread toggle
          setLocalReadMap(prev => {
            const updated = { ...prev };
            ids.forEach(id => { updated[id] = false; });
            return updated;
          });
          setSelectedNotification(prev => prev ? { ...prev, read: false, is_read: false } : prev);
        } else {
          for (const id of ids) {
            try { await markNotificationAsRead(id); } catch (e) { /* ignore */ }
          }
          setLocalReadMap(prev => {
            const updated = { ...prev };
            ids.forEach(id => { updated[id] = true; });
            return updated;
          });
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
      const ids = Array.isArray(selectedNotification._groupIds) && selectedNotification._groupIds.length > 0
        ? selectedNotification._groupIds
        : [selectedNotification.id];
      setDeletedIds(prev => {
        const updated = { ...prev };
        ids.forEach(id => { updated[id] = true; });
        return updated;
      });
      setSelectedNotification(null);
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
    }
  };

  const handleArchiveNotification = (notification) => {
    if (!notification) return;
    const ids = Array.isArray(notification._groupIds) && notification._groupIds.length > 0
      ? notification._groupIds
      : [notification.id];
    setArchivedMap(prev => {
      const updated = { ...prev };
      // Store original notification objects where available to preserve data shape
      ids.forEach(id => {
        const original = notifications.find(n => n.id === id) || notification;
        updated[id] = original;
      });
      return updated;
    });
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

  // When switching viewArchived or lists update, ensure selection maps to merged list
  useEffect(() => {
    const currentList = getFilteredNotifications();
    if (currentList.length === 0) {
      setSelectedNotification(null);
      return;
    }
    if (!selectedNotification) {
      setSelectedNotification(currentList[0]);
      return;
    }
    const inListById = currentList.some(n => n.id === selectedNotification.id);
    if (inListById) return;
    // Try to find a group that contains the currently selected id
    const containingGroup = currentList.find(n => Array.isArray(n._groupIds) && n._groupIds.includes(selectedNotification.id));
    if (containingGroup) {
      setSelectedNotification(containingGroup);
    } else {
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
                <button className="mark-all-read-btn" onClick={handleMarkAllAsRead}>
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
                    <div className="notification-item-header">
                      <div className="notification-header-left">
                        <div className="notification-icon">
                          <i 
                            className={getNotificationIcon(notification.type)}
                          ></i>
                        </div>
                        <span className="category-tag">{notification.category || notification.type}</span>
                      </div>
                      <div className="notification-header-right">
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
                    <div className="notification-item-content">
                      <h4 className="notification-title">{renderWithIcons(notification.title || notification.type)}</h4>
                      <p className="notification-message">{renderWithIcons(notification.message || notification.data)}</p>
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
                    {selectedNotification._group && isCollectionGroup(selectedNotification) &&
                      Number.isFinite(selectedNotification._groupCollectionSumAmount) && selectedNotification._groupCollectionSumAmount > 0 && (
                        <span className="preview-total-amount"> • Collections Total: {formatCurrency(selectedNotification._groupCollectionSumAmount)}</span>
                      )
                    }
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
                        <span>{isNotificationGroupAllRead(selectedNotification) ? 'Mark as Unread' : 'Mark as read'}</span>
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
                  {/* <p>{renderWithIcons(selectedNotification.details || selectedNotification.message || selectedNotification.data)}</p> */}

                  {isCollectionGroup(selectedNotification) && !selectedNotification._group && selectedNotification.data && typeof selectedNotification.data === 'object' && (
                    <div className="related-data">
                      <h5>Collection Total:</h5>
                      <ul>
                        {selectedFundNames.length > 0 && (
                          <li><strong>Fund Account:</strong> {selectedFundNames.join(', ')}</li>
                        )}
                        <li><strong>Total Amount:</strong> {formatCurrency(parseAmount(selectedNotification.data.amount ?? selectedNotification.amount)) || '₱0.00'}</li>
                      </ul>
                    </div>
                  )}

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

                  {selectedNotification._group && Array.isArray(selectedNotification._groupIds) && (
                    <>
                      {isCollectionGroup(selectedNotification) && (
                        <div className="related-data">
                          <h5>Collection Summary:</h5>
                          <ul>
                            {selectedFundNames.length > 0 && (
                              <li><strong>Fund Account{selectedFundNames.length > 1 ? 's' : ''}:</strong> {selectedFundNames.join(', ')}</li>
                            )}
                            {selectedNotification._groupRef && (
                              <li><strong>Reference:</strong> {selectedNotification._groupRef}</li>
                            )}
                            <li><strong>Collection Items:</strong> {Number.isFinite(selectedNotification._groupCollectionCount) ? selectedNotification._groupCollectionCount : selectedNotification._groupCount}</li>
                            {Number.isFinite(selectedNotification._groupCollectionSumAmount) && selectedNotification._groupCollectionSumAmount > 0 && (
                              <li><strong>Collection Total:</strong> {formatCurrency(selectedNotification._groupCollectionSumAmount)}</li>
                            )}
                          </ul>
                        </div>
                      )}

                      <div className="related-data">
                        <h5>Items:</h5>
                        <div className="group-items-list">
                          {selectedNotification._groupIds.map((gid) => {
                            const item = notifications.find(n => n.id === gid) || archivedMap[gid] || null;
                            if (!item) return null;
                            const itemData = (item.data && typeof item.data === 'object') ? item.data : null;
                            const itemAmount = itemData?.amount ?? item.amount;
                            const { name: itemFundName } = getFundIdAndName(item);
                            // Amount: prefer structured value, fallback to extracting from message
                            let formattedAmount = null;
                            const parsedAmount = parseAmount(itemAmount);
                            if (Number.isFinite(parsedAmount)) {
                              formattedAmount = formatCurrency(parsedAmount);
                            } else {
                              const amtFromMsg = extractAmountFromText(item.message || item.details || '');
                              if (Number.isFinite(amtFromMsg)) {
                                formattedAmount = formatCurrency(amtFromMsg);
                              }
                            }
                            return (
                              <div key={gid} className="group-item-card" style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, marginBottom: 10, background: '#fff' }}>
                                <div className="group-item-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {/* <i className={getNotificationIcon(item.type)}></i> */}
                                    <strong>{renderWithIcons(item.title || item.type)}</strong>
                                  </div>
                                  <span style={{ color: '#6b7280', fontSize: 12 }}>{(item.created_at || item.timestamp) ? new Date(item.created_at || item.timestamp).toLocaleString() : ''}</span>
                                </div>
                                {item.message && (
                                  <div className="group-item-message" style={{ marginTop: 6, color: '#111827' }}>
                                    {renderWithIcons(item.message)}
                                  </div>
                                )}
                                {(formattedAmount || itemFundName) && (
                                  <div className="group-item-amount" style={{ marginTop: 6 }}>
                                    {formattedAmount && (
                                      <>
                                        <strong>Amount:</strong> {formattedAmount}
                                      </>
                                    )}
                                    {itemFundName && (
                                      <>
                                        {formattedAmount ? ' • ' : null}
                                        <strong>Fund Account:</strong> {itemFundName}
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
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
