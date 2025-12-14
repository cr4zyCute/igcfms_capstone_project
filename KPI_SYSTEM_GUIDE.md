# KPI System - Complete Guide

## What is KPI?
**KPI = Key Performance Indicator Dashboard** - Real-time analytics showing daily collections, disbursements, transaction volumes, cheque status, and override requests.

---

## Tech Stack
- **Frontend:** React 18+ | TanStack Query (caching) | WebSocket (real-time) | Chart.js (charts)
- **Backend:** Laravel API | WebSocket Server | MySQL Database

---

## How It Works (Real-Time Flow)

```
1. Component mounts → TanStack Query fetches data ONCE
2. WebSocket connects → listens for events
3. Backend creates transaction → broadcasts WebSocket event
4. Frontend receives event → updates cache directly
5. Component re-renders automatically → user sees update instantly
```

**Key:** NO polling, NO auto-refresh intervals. Event-driven only.

---

## Implementation (3 Steps)

### Step 1: Create Data Hook
```javascript
// igcfms/src/hooks/useKPIData.js
export const useKPITransactions = () => {
  return useQuery({
    queryKey: ['kpiData', 'transactions'],
    queryFn: fetchTransactions,
    staleTime: Infinity,        // Never stale
    gcTime: 30 * 60 * 1000,     // 30-min cache
    refetchInterval: false      // NO polling
  });
};
```

### Step 2: Create WebSocket Hook
```javascript
// igcfms/src/hooks/useKPIWebSocket.js
export const useKPIWebSocket = () => {
  const wsRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    wsRef.current = new WebSocket(`ws://localhost:8000/kpi?token=${token}`);
    
    wsRef.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      // Update cache directly (no API call)
      if (message.type === 'transaction_created') {
        queryClient.setQueryData(
          ['kpiData', 'transactions'],
          (oldData) => [message.data, ...oldData]
        );
      }
    };
  }, []);
};
```

### Step 3: Use in Component
```javascript
// igcfms/src/components/analytics/ReportAnalysis/dailyKPI.jsx
const DailyKPI = () => {
  useKPIWebSocket();
  const { data: transactions } = useKPITransactions();
  
  useEffect(() => {
    const collections = transactions
      .filter(t => t.transaction_type === 'collection')
      .reduce((sum, t) => sum + t.amount, 0);
    
    setDailyData({ totalCollections: collections });
  }, [transactions]);
  
  return <div>₱{dailyData.totalCollections}</div>;
};
```

---

## Key Concepts

### TanStack Query Configuration
- **staleTime: Infinity** → Data never becomes stale
- **gcTime: 30 minutes** → Keep in memory 30 minutes
- **refetchInterval: false** → NO polling
- **Fetch once on mount** → Only refetch on WebSocket events

### WebSocket Events Handled
```
transaction_created, transaction_updated, transaction_deleted
report_created, report_updated, report_deleted
cheque_created, cheque_cleared
override_request_created, override_request_reviewed
```

### Metrics Calculated
**Daily:** Collections, Disbursements, Net Balance, Total Transactions, Pending Approvals
**Monthly:** 12-month trends, Revenue growth %, Payer distribution
**Cheque:** Average clearance time, Processing accuracy, Reconciliation rate, Outstanding ratio

---

## File Structure
```
igcfms/src/
├── hooks/
│   ├── useKPIData.js              ← Data fetching
│   ├── useKPIWebSocket.js         ← Real-time updates
│   ├── useCheques.js
│   └── useReports.js
│
└── components/
    ├── analytics/ReportAnalysis/
    │   ├── dailyKPI.jsx           ← Daily metrics
    │   ├── monthlyKPI.jsx         ← Monthly metrics
    │   └── yearlyKPI.jsx          ← Yearly metrics
    │
    └── admin/
        ├── IssueCheque.jsx        ← Cheque KPI
        ├── IssueMoney.jsx         ← Disbursement KPI
        ├── IssueReceipt.jsx       ← Collection KPI
        └── GenerateReports.jsx    ← Report KPI
```

---

## Backend Requirements

### Database Tables
```sql
CREATE TABLE transactions (
  id INT PRIMARY KEY,
  transaction_type VARCHAR(50),  -- 'collection' or 'disbursement'
  amount DECIMAL(12, 2),
  status VARCHAR(50),
  created_at TIMESTAMP,
  user_id INT
);

CREATE TABLE reports (
  id INT PRIMARY KEY,
  report_type VARCHAR(50),
  generated_at TIMESTAMP,
  data JSON
);
```

### API Endpoints
```
GET  /api/transactions
GET  /api/reports
GET  /api/cheques
POST /api/reports
```

### WebSocket Server
```
ws://localhost:8000/kpi?token=xxx
Broadcasts: transaction_created, transaction_updated, etc.
```

---

## Real-Time Data Flow Diagram

```
┌─────────────────────────────────────────────┐
│ User Opens Dashboard                        │
└────────────────┬────────────────────────────┘
                 │
    ┌────────────┴────────────┐
    │                         │
    ▼                         ▼
┌──────────────┐      ┌──────────────┐
│ TanStack     │      │ WebSocket    │
│ Query        │      │ Connects     │
│ Fetches Data │      │              │
└──────┬───────┘      └──────┬───────┘
       │                     │
       └────────────┬────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │ Component Renders    │
         │ with Cached Data     │
         └──────────────────────┘
                    │
              ⏳ WAITING...
                    │
    ┌───────────────┴────────────────┐
    │ Backend: New Transaction       │
    │ Broadcasts WebSocket Event     │
    └───────────────┬────────────────┘
                    │
                    ▼ (Milliseconds)
         ┌──────────────────────┐
         │ Frontend Receives    │
         │ WebSocket Message    │
         └──────────┬───────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │ Update Cache         │
         │ (NO API call)        │
         └──────────┬───────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │ Component Re-renders │
         │ with New Data        │
         │ INSTANT! ✓           │
         └──────────────────────┘
```

---

## Debugging

### Check WebSocket Connection
```javascript
// Console should show:
// 🔴 KPI WebSocket connected - Real-time updates ACTIVE
// ⚪ KPI WebSocket disconnected - attempting to reconnect...
```

### Check Network
- Browser DevTools → Network tab
- Should see: `GET /api/transactions` (once on mount)
- Should see: WebSocket connection (persistent)
- Should NOT see: Repeated API requests

### Common Issues

| Issue | Solution |
|-------|----------|
| WebSocket not connecting | Check token in localStorage, verify ws:// URL |
| Data not updating | Check WebSocket connection status in console |
| Duplicate API requests | Check TanStack Query config (staleTime, refetchInterval) |
| Slow updates | Check React DevTools Profiler for unnecessary re-renders |

---

## Performance Optimization

### Caching Strategy
- **staleTime: Infinity** → Never refetch unless WebSocket event
- **gcTime: 30 minutes** → Keep data in memory, reduce API calls
- **refetchInterval: false** → NO polling (saves bandwidth)

### Lazy Loading
```javascript
// Load analytics after 100ms
useEffect(() => {
  const timer = setTimeout(() => setShowAnalytics(true), 100);
  return () => clearTimeout(timer);
}, []);
```

### Memoization
```javascript
// Prevent unnecessary recalculations
const dailyMetrics = useMemo(() => {
  return calculateMetrics(transactions);
}, [transactions]);
```

---

## Security

### Authentication
```javascript
const token = localStorage.getItem('token');
const headers = { Authorization: `Bearer ${token}` };
const wsUrl = `ws://localhost:8000/kpi?token=${token}`;
```

### Validation
- Backend validates all incoming data
- Frontend validates before display
- Error handling with retry logic

---

## WebSocket Auto-Reconnect

```
Connection drops
  ↓
Attempt 1: Wait 2 seconds (2^1)
Attempt 2: Wait 4 seconds (2^2)
Attempt 3: Wait 8 seconds (2^3)
Attempt 4: Wait 16 seconds (2^4)
Attempt 5: Wait 30 seconds (2^5, capped)
Stop: Give up after 5 attempts
```

---

## Summary

✅ **Real-Time:** WebSocket-driven (milliseconds)
✅ **No Polling:** Event-based only
✅ **Efficient:** 30-minute cache, minimal network calls
✅ **Scalable:** Handles multiple concurrent users
✅ **Resilient:** Auto-reconnect with exponential backoff

**Key Pattern:**
1. Fetch data once on mount
2. Connect WebSocket
3. Listen for events
4. Update cache on events
5. Component re-renders automatically
6. User sees update instantly

---

---

## Cheque Management System

### Why Cheques Need Reconciliation?

When you issue a cheque, it goes through a lifecycle:
1. **Issued** - Cheque is created and given to payee
2. **Cleared** - Bank processes the cheque (money leaves account)
3. **Reconciled** - Cheque is matched with bank statement
4. **Unmatched** - Cheque exists but doesn't match bank records (problem!)

### Cheque Statuses Explained

| Status | Meaning | Why Important |
|--------|---------|---------------|
| **Issued** | Cheque created and sent to payee | Track what cheques are out there |
| **Cleared** | Bank processed the cheque | Money actually left the account |
| **Reconciled** | Cheque matched with bank statement | Confirms cheque is legitimate and accounted for |
| **Unmatched** | Cheque doesn't match bank records | RED FLAG - possible fraud or error |

### Purpose of Reconciliation

**Reconciliation = Matching cheques with bank statements**

**Why?**
- ✅ Verify all issued cheques actually cleared
- ✅ Detect fraud (fake or forged cheques)
- ✅ Find missing cheques (lost in mail)
- ✅ Catch errors (wrong amounts, wrong payees)
- ✅ Maintain accurate financial records
- ✅ Comply with auditing requirements

### Example Scenario

```
You issue cheque #001 for ₱10,000 to John

Status Flow:
1. ISSUED → Cheque created in system
2. CLEARED → Bank confirms ₱10,000 left account
3. RECONCILED → Cheque matches bank statement ✓

But if:
1. ISSUED → Cheque created in system
2. CLEARED → Bank shows ₱10,000 left
3. UNMATCHED → Bank statement shows ₱15,000 left instead
   → PROBLEM! Amount doesn't match - investigate!
```

### IssueCheque Component Purpose

**IssueCheque.jsx** manages the entire cheque issuance workflow:

#### What It Does:
1. **Create Cheques** - Form to issue new cheques
2. **Track Cheques** - Display all issued cheques in a table
3. **Filter & Search** - Find cheques by status, date, payee
4. **Preview Cheques** - View cheque before printing
5. **Print Cheques** - Generate physical cheque
6. **Export Data** - Download cheque list as PDF/Excel
7. **Monitor Status** - Track which cheques are cleared/reconciled
8. **Real-Time Updates** - WebSocket updates when cheques are cleared

#### Key Features:
```javascript
// Real-time WebSocket for cheque updates
useIssueChequeWebSocket()

// Fetch cheque data
useCheques()

// Create new cheque
useCreateCheque()

// Update cheque status
useUpdateCheque()

// Lazy-loaded KPI analytics
AverageClearanceTime      // How long cheques take to clear
ChequeProcessingAccuracyRate  // % of cheques processed correctly
ChequeReconciliationRate  // % of cheques reconciled
OutstandingChequesRatio   // % of cheques still outstanding
```

#### Data Flow:
```
1. User fills cheque form
   ↓
2. Submit → Create cheque in database
   ↓
3. WebSocket broadcasts "cheque_created" event
   ↓
4. All connected users see new cheque instantly
   ↓
5. Bank clears cheque → WebSocket broadcasts "cheque_cleared"
   ↓
6. Cheque status updates to "Cleared"
   ↓
7. Reconciliation process matches with bank statement
   ↓
8. Status updates to "Reconciled" ✓
```

#### Why This Matters for KPI:
- **Average Clearance Time** - How fast are cheques being processed?
- **Reconciliation Rate** - What % of cheques are properly matched?
- **Outstanding Ratio** - How many cheques are still pending?
- **Accuracy Rate** - Are there unmatched/problematic cheques?

These metrics help you:
✅ Monitor cheque processing efficiency
✅ Detect issues early (unmatched cheques)
✅ Improve cash flow management
✅ Ensure financial accuracy
✅ Comply with audit requirements

---

**Generated:** December 10, 2025
**Status:** Complete and ready to use
