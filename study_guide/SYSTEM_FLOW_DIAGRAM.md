# IGCFMS System Flow Diagram & Technical Documentation

## Complete System Flow

```
┌──────────────────────────────────────────────────────────────┐
│                     FRONTEND (React App)                      │
│                    http://localhost:3000                      │
└────────────────────┬─────────────────────────────────────────┘
                      │ HTTP Requests (Axios)
                      ↓
┌──────────────────────────────────────────────────────────────┐
│                    CORS MIDDLEWARE                            │
│              app/Http/Middleware/HandleCors.php               │
│         Validates origin, methods, headers, credentials       │
└────────────────────┬─────────────────────────────────────────┘
                      │
                      ↓
┌──────────────────────────────────────────────────────────────┐
│                   API ROUTES (routes/api.php)                 │
│                                                               │
│  Public Routes:                Protected Routes:              │
│  • /login                      • /users/*                     │
│  • /register                   • /fund-accounts/*             │
│  • /health                     • /transactions/*              │
│                                • /disbursements/*             │
│                                • /override-requests/*         │
│                                • /dashboard/*                 │
└────────────────────┬─────────────────────────────────────────┘
                      │
                      ↓
┌──────────────────────────────────────────────────────────────┐
│              SANCTUM AUTHENTICATION MIDDLEWARE                │
│                   Validates Bearer Token                      │
└────────────────────┬─────────────────────────────────────────┘
                      │
                      ↓
┌──────────────────────────────────────────────────────────────┐
│                     CONTROLLER LAYER                          │
├────────────────────────────────────────────────────────────── │
│  AuthController         → Login/Logout/Register               │
│  FundAccountController  → CRUD Fund Accounts                  │
│  TransactionController  → Process Collections/Disbursements   │
│  DashboardController    → Analytics & Reports                 │
│  OverrideRequestController → Handle Corrections               │
│  UserController         → User Management                     │
│  NotificationController → In-app Notifications                │
│  DisbursementController → Cheque/Cash Processing              │
└────────────────────┬─────────────────────────────────────────┘
                      │
                      ↓
┌──────────────────────────────────────────────────────────────┐
│                      SERVICE LAYER                            │
│                                                               │
│  ActivityTracker Service:                                     │
│  • Logs all user activities                                   │
│  • Creates admin notifications                                │
│  • Sends email alerts                                         │
│  • Records IP/User Agent                                      │
└────────────────────┬─────────────────────────────────────────┘
                      │
                      ↓
┌──────────────────────────────────────────────────────────────┐
│                    ELOQUENT ORM MODELS                        │
├────────────────────────────────────────────────────────────── │
│  User                → Authentication & Roles                 │
│  FundAccount         → Fund Categories & Balances             │
│  Transaction         → Financial Records                      │
│  Disbursement        → Payout Records                         │
│  Receipt             → Collection Receipts                    │
│  OverrideRequest     → Correction Requests                    │
│  ActivityLog         → Audit Trail                            │
│  Notification        → User Alerts                            │
│  RegistrationRequest → Pending User Registrations             │
└────────────────────┬─────────────────────────────────────────┘
                      │
                      ↓
┌──────────────────────────────────────────────────────────────┐
│                     MYSQL DATABASE                            │
│                      (igcfms)                                 │
├────────────────────────────────────────────────────────────── │
│  Tables:                                                      │
│  • users                    • notifications                   │
│  • fund_accounts            • activity_logs                   │
│  • transactions             • registration_requests           │
│  • disbursements            • system_settings                 │
│  • receipts                 • recipient_accounts              │
│  • override_requests        • personal_access_tokens          │
│  • audit_logs              • reports                          │
└───────────────────────────────────────────────────────────────┘
```

---

## 📊 Detailed Transaction Processing Flow

### Collection Transaction Flow:
```
User Input (Frontend)
    ↓
POST /api/transactions
    ↓
TransactionController@store
    ↓
Validate Input Data
    ↓
Auto-generate Receipt Number (RCPT-20250919-0001)
    ↓
Auto-generate Reference Number (COL-2025-0001)
    ↓
Create Transaction Record (positive amount)
    ↓
Create Receipt Record
    ↓
Track Activity (ActivityTracker)
    ↓
Send Admin Notification
    ↓
Update Fund Account Balance
    ↓
Return JSON Response
```

### Disbursement Transaction Flow:
```
User Input (Frontend)
    ↓
POST /api/transactions (type: Disbursement)
    ↓
TransactionController@store
    ↓
Validate Input & Permissions
    ↓
Auto-generate Reference (DIS-2025-0001)
    ↓
Create Transaction (negative amount)
    ↓
POST /api/disbursements (if Cheque)
    ↓
DisbursementController@store
    ↓
Create Disbursement Record
    ↓
Link to Transaction
    ↓
Track Activity
    ↓
Return Response
```

---

## 🔐 Authentication & Authorization Flow

```
1. User Login Request
   └── POST /api/login
       └── AuthController@login
           ├── Validate Credentials
           ├── Check User Status
           ├── Generate Sanctum Token
           ├── Track Login Activity
           ├── Log IP Address
           └── Return Token + User Role

2. Authenticated Request
   └── Request with Bearer Token
       └── Sanctum Middleware
           ├── Validate Token
           ├── Load User Context
           └── Pass to Controller

3. Role-Based Access
   └── Controller Method
       ├── Check User Role
       ├── Admin: Full Access
       ├── Cashier: Limited Access
       ├── Collecting Officer: Collection Operations
       └── Disbursing Officer: Disbursement Operations
```

---

## 🔄 Override Request Workflow

```
1. CASHIER INITIATES
   POST /api/transactions/override
   └── OverrideRequestController@store
       ├── Create Override Request
       ├── Status: "pending"
       ├── Email Admin
       └── Create Notification

2. ADMIN REVIEWS
   PUT /api/override_requests/{id}/review
   └── OverrideRequestController@review
       ├── Set Status: "approved"/"rejected"
       ├── If Approved:
       │   ├── Update Original Transaction
       │   ├── Apply Changes
       │   └── Mark as Override Type
       ├── Email Cashier
       └── Track Activity

3. SYSTEM UPDATES
   └── Transaction Modified
       ├── New Amount/Description
       ├── Audit Trail Created
       └── Dashboard Reflects Changes
```

---

## 📈 Dashboard Data Aggregation Flow

```
GET /api/dashboard/summary
    ↓
DashboardController@summary
    ↓
┌─────────────────────────────────┐
│  Parallel Database Queries:      │
│  • Count Active Users            │
│  • Count Active Fund Accounts    │
│  • Sum Collection Transactions   │
│  • Sum Disbursement Transactions │
│  • Count Today's Transactions    │
└─────────────────────────────────┘
    ↓
Aggregate Results
    ↓
Format JSON Response
    ↓
Return to Frontend
    ↓
React Dashboard Update
```

---

## ⚠️ Critical System Bottlenecks & Solutions

### 1. **Synchronous Email Sending**
```
CURRENT PROBLEM:
AuthController@register
    └── Mail::to()->send()  ← BLOCKS REQUEST
        └── SMTP Connection (can timeout)

SOLUTION:
AuthController@register
    └── dispatch(SendEmailJob)  ← NON-BLOCKING
        └── Queue Worker Processes Email
```

### 2. **Balance Calculation on Every Request**
```
CURRENT PROBLEM:
FundAccountController@index
    └── foreach account
        └── sum(transactions.amount)  ← N+1 QUERY

SOLUTION:
Add 'current_balance' column
    └── Update via Database Trigger
    └── Or Update via Observer Pattern
```

### 3. **No Pagination on Large Datasets**
```
CURRENT PROBLEM:
TransactionController@index
    └── Transaction::all()  ← LOADS ALL RECORDS

SOLUTION:
TransactionController@index
    └── Transaction::paginate(50)
    └── Return with pagination metadata
```

---

## 🛠️ Database Query Optimization Points

### Required Indexes:
```sql
-- Speed up transaction lookups
CREATE INDEX idx_transactions_fund_account ON transactions(fund_account_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transactions_type ON transactions(type);

-- Speed up user activity lookups
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);

-- Speed up notification queries
CREATE INDEX idx_notifications_user_id ON notifications(user_id, is_read);
```

---

## 🔧 System Configuration Dependencies

### Environment Variables Used:
```
APP_NAME=Laravel                    → Application name
APP_URL=http://localhost            → Base URL
DB_CONNECTION=mysql                 → Database driver
DB_DATABASE=igcfms                  → Database name
MAIL_USERNAME=igcfmsa@gmail.com    → Email sender
FRONTEND_URL=http://localhost:3000  → React app URL
SESSION_DRIVER=file                 → Session storage
QUEUE_CONNECTION=database           → Queue storage
```

### External Services:
1. **Gmail SMTP** - Email notifications
2. **MySQL Database** - Data persistence
3. **Sanctum** - API authentication
4. **Laravel Queue** - Async job processing

---

## 📝 API Response Format Standards

### Success Response:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Resource data
  }
}
```

### Error Response:
```json
{
  "success": false,
  "message": "Error description",
  "errors": {
    "field": ["validation error"]
  }
}
```

### Paginated Response:
```json
{
  "data": [...],
  "current_page": 1,
  "per_page": 50,
  "total": 500,
  "last_page": 10
}
```

---

## 🚨 System Health Check Points

1. **Database Connection**
   - Check: Can connect to MySQL
   - Endpoint: `/api/health`

2. **Email Service**
   - Check: SMTP credentials valid
   - Test: Send test email to admin

3. **Queue Worker**
   - Check: Queue worker running
   - Command: `php artisan queue:work`

4. **Cache Service**
   - Check: Cache driver accessible
   - Test: Cache::put() and Cache::get()

5. **Storage Permissions**
   - Check: storage/logs writable
   - Check: bootstrap/cache writable

---

## 🎯 Performance Metrics to Monitor

1. **Response Time**
   - Target: < 200ms for reads
   - Target: < 500ms for writes

2. **Database Queries**
   - Monitor: Number of queries per request
   - Alert: > 20 queries per request

3. **Memory Usage**
   - Monitor: Peak memory per request
   - Alert: > 128MB per request

4. **Queue Length**
   - Monitor: Pending jobs count
   - Alert: > 100 pending jobs

5. **Error Rate**
   - Monitor: 4xx and 5xx responses
   - Alert: > 1% error rate
