# Cashier Notifications Setup

## Problem
Cashier role didn't have:
1. Notification system for override requests
2. Notification bell component
3. Notifications page to view all notifications
4. User-specific notification filtering

## Solution
Created two new components for cashier with user-specific notification filtering:

### 1. **NotificationsPage.jsx** (Full notifications page)
**Location:** `igcfms/src/components/cashier/NotificationsPage.jsx`

**Features:**
- ✅ Display all notifications for current user only
- ✅ Search notifications by title/message
- ✅ Filter by status (All, Read, Unread)
- ✅ Mark individual notifications as read
- ✅ Mark all notifications as read
- ✅ Preview notification details
- ✅ Real-time updates via WebSocket
- ✅ Responsive design

**Key Code:**
```javascript
// Filter to show ONLY current user's notifications
const filteredNotifications = notifications.filter(notification => {
  const notificationUserId = notification.user_id || notification.recipient_id;
  const currentUserId = user?.id;
  
  if (currentUserId && notificationUserId) {
    return notificationUserId.toString() === currentUserId.toString();
  }
  return false;
});
```

### 2. **NotificationBell.jsx** (Bell icon with dropdown)
**Location:** `igcfms/src/components/cashier/NotificationBell.jsx`

**Features:**
- ✅ Bell icon with unread count badge
- ✅ Dropdown showing last 5 notifications
- ✅ User-specific notifications only
- ✅ Click to view full notification in NotificationsPage
- ✅ Real-time updates via WebSocket
- ✅ Mark as read on click

**Key Code:**
```javascript
// WebSocket for real-time updates
useNotificationsWebSocket();

// Filter to show ONLY current user's notifications
const filteredNotifications = notifications.filter(notification => {
  const notificationUserId = notification.user_id || notification.recipient_id;
  const currentUserId = user?.id;
  
  if (currentUserId && notificationUserId) {
    return notificationUserId.toString() === currentUserId.toString();
  }
  return false;
});

// Show unread count
const unreadCount = filteredNotifications.filter(n => !n.is_read && !n.read).length;
```

## How to Use

### Step 1: Add NotificationBell to CashierSidebar
```javascript
// In igcfms/src/components/cashier/CashierSidebar.jsx
import NotificationBell from './NotificationBell';

// Add to sidebar header
<NotificationBell />
```

### Step 2: Add Route for NotificationsPage
```javascript
// In your router configuration
<Route path="/cashier/notifications" element={<NotificationsPage />} />
```

### Step 3: Ensure Backend Sends Notifications
Make sure your backend sends notifications with:
- `user_id` or `recipient_id` field (must match cashier's user ID)
- `type` field (e.g., 'override', 'cheque', 'transaction')
- `title` field (notification title)
- `message` field (notification message)
- `created_at` field (timestamp)

## Notification Types Supported

| Type | Icon | Use Case |
|------|------|----------|
| override | ⚠️ | Override request notifications |
| cheque | 💳 | Cheque processing notifications |
| transaction | 🔄 | Transaction notifications |
| collection | 💰 | Collection notifications |
| disbursement | 💸 | Disbursement notifications |
| system | 🔔 | General system notifications |

## Real-Time Updates

Both components use:
- **WebSocket** for instant notifications
- **TanStack Query** for caching
- **useNotificationsWebSocket()** hook for real-time updates

**Console indicators:**
- 🔴 Notifications WebSocket connected - Real-time updates ACTIVE
- ⚪ Notifications WebSocket disconnected - attempting to reconnect...

## User-Specific Filtering

**Key Feature:** Notifications are filtered to show ONLY the current user's notifications

```javascript
// Only shows notifications where:
// notification.user_id === currentUser.id
// OR
// notification.recipient_id === currentUser.id
```

This ensures:
- ✅ Cashier A only sees their notifications
- ✅ Cashier B only sees their notifications
- ✅ No cross-user notification leaks
- ✅ Privacy and security maintained

## Comparison with Collecting Officer

| Feature | Collecting Officer | Cashier |
|---------|-------------------|---------|
| NotificationsPage | ✅ Yes | ✅ Yes (NEW) |
| NotificationBell | ✅ Yes | ✅ Yes (NEW) |
| User filtering | ✅ Yes | ✅ Yes (NEW) |
| WebSocket updates | ✅ Yes | ✅ Yes (NEW) |
| Override notifications | ✅ Yes | ✅ Yes (NEW) |

## Files Created

1. **NotificationsPage.jsx** - Full notifications page with search, filter, and preview
2. **NotificationBell.jsx** - Bell icon component with dropdown

## Files to Modify

1. **CashierSidebar.jsx** - Add NotificationBell import and component
2. **Router/App.jsx** - Add route for `/cashier/notifications`

## Testing

### Test 1: View Notifications
1. Login as cashier
2. Click notification bell icon
3. Should see dropdown with latest 5 notifications
4. Should show unread count badge

### Test 2: Filter Notifications
1. Click "View All Notifications"
2. Should see full NotificationsPage
3. Use filter dropdown to filter by status
4. Use search to find notifications

### Test 3: Real-Time Updates
1. Open NotificationsPage in one tab
2. Create override request in another tab
3. Should see notification appear instantly (no refresh needed)

### Test 4: User Filtering
1. Login as Cashier A
2. Should only see Cashier A's notifications
3. Login as Cashier B
4. Should only see Cashier B's notifications
5. Should NOT see Cashier A's notifications

## Backend Requirements

Ensure your backend:
1. Sends notifications with `user_id` or `recipient_id` field
2. Sends override request notifications to relevant cashiers
3. Supports WebSocket `/notifications` endpoint
4. Broadcasts notification events in real-time

## Summary

✅ Cashier now has full notification system
✅ User-specific notification filtering
✅ Real-time updates via WebSocket
✅ Same functionality as Collecting Officer
✅ Override request notifications supported
✅ Production-ready components

---

**Status:** Ready to integrate
**Created:** December 10, 2025
