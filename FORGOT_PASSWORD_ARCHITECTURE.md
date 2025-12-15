# Forgot Password Feature - Architecture & Diagrams

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Login.jsx                                                    │   │
│  │ ├─ Email input                                               │   │
│  │ ├─ Password input                                            │   │
│  │ ├─ Log in button                                             │   │
│  │ └─ Forgot Password? button ← NEW                             │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              ↓                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ ForgotPasswordModal.jsx ← NEW                                │   │
│  │ ├─ Email input field                                         │   │
│  │ ├─ Submit button                                             │   │
│  │ ├─ Success/Error messages                                    │   │
│  │ └─ Info box                                                  │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              ↓                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ API Call: POST /api/password/reset-request                  │   │
│  │ Payload: { email: "user@example.com" }                       │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      BACKEND (Laravel)                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ routes/api.php                                               │   │
│  │ POST /api/password/reset-request                             │   │
│  │ → PasswordResetController@requestReset                       │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              ↓                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ PasswordResetController.php                                  │   │
│  │ ├─ requestReset()                                            │   │
│  │ │  ├─ Validate email                                         │   │
│  │ │  ├─ Check for duplicate pending request                    │   │
│  │ │  ├─ Create PasswordResetRequest record                     │   │
│  │ │  └─ Send email to admin                                    │   │
│  │ ├─ approveReset($id)                                         │   │
│  │ │  ├─ Generate temporary password                            │   │
│  │ │  ├─ Hash and save temporary password                       │   │
│  │ │  ├─ Update user's force_password_change flag               │   │
│  │ │  ├─ Update user's password                                 │   │
│  │ │  └─ Send email to user                                     │   │
│  │ ├─ rejectReset($id)                                          │   │
│  │ │  └─ Update status to rejected                              │   │
│  │ ├─ getStatus()                                               │   │
│  │ │  └─ Return current status                                  │   │
│  │ └─ getPendingRequests()                                      │   │
│  │    └─ Return all pending requests with user info             │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              ↓                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ PasswordResetRequest Model                                   │   │
│  │ ├─ Relationships: belongsTo(User)                            │   │
│  │ ├─ Methods: isPending(), isApproved(), isUsed()              │   │
│  │ └─ Static: generateTemporaryPassword()                       │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              ↓                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Database: password_reset_requests table                      │   │
│  │ ├─ id (PK)                                                   │   │
│  │ ├─ user_id (FK)                                              │   │
│  │ ├─ email                                                     │   │
│  │ ├─ temporary_password (hashed)                               │   │
│  │ ├─ status (pending/approved/rejected/used)                   │   │
│  │ ├─ approved_at                                               │   │
│  │ ├─ used_at                                                   │   │
│  │ └─ timestamps                                                │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Mail Classes                                                 │   │
│  │ ├─ PasswordResetRequestMail (to admin)                       │   │
│  │ │  └─ resources/views/emails/password-reset-request.blade.php│  │
│  │ └─ TemporaryPasswordMail (to user)                           │   │
│  │    └─ resources/views/emails/temporary-password.blade.php    │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      EMAIL SERVICE (SMTP)                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Admin Email                                                  │   │
│  │ To: igcfma@gmail.com                                         │   │
│  │ Subject: Password Reset Request - Action Required            │   │
│  │ Contains: User info + Approval link                          │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ User Email                                                   │   │
│  │ To: user@example.com                                         │   │
│  │ Subject: Your Temporary Password                             │   │
│  │ Contains: Temporary password + Instructions                  │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Request/Response Flow

### 1. User Requests Password Reset

```
CLIENT                          SERVER
  │                               │
  ├─ POST /api/password/reset-request ──→
  │  {                                    │
  │    "email": "user@example.com"        │
  │  }                                    │
  │                                       │
  │                          ┌─ Validate email
  │                          ├─ Check for duplicates
  │                          ├─ Create record
  │                          ├─ Send admin email
  │                          │
  ←─ 200 OK ─────────────────┤
  {                           │
    "success": true,          │
    "message": "..."          │
  }                           │
  │                           │
```

### 2. Admin Approves Reset

```
ADMIN EMAIL                     SERVER
  │                               │
  ├─ Click approval link ────────→
  │  GET /admin/password-reset/1/approve
  │                               │
  │                          ┌─ Find request
  │                          ├─ Generate temp password
  │                          ├─ Hash password
  │                          ├─ Update user password
  │                          ├─ Set force_password_change
  │                          ├─ Send user email
  │                          │
  ←─ 200 OK ─────────────────┤
  {                           │
    "success": true,          │
    "message": "..."          │
  }                           │
  │                           │
```

### 3. User Logs In

```
CLIENT                          SERVER
  │                               │
  ├─ POST /api/login ────────────→
  │  {                            │
  │    "email": "user@...",       │
  │    "password": "A7X9K2M5"     │
  │  }                            │
  │                               │
  │                          ┌─ Verify credentials
  │                          ├─ Check force_password_change
  │                          │
  ←─ 200 OK ─────────────────┤
  {                           │
    "access_token": "...",    │
    "force_password_change": true
  }                           │
  │                           │
  ├─ Show ForcePasswordChangeModal
  │
```

### 4. User Changes Password

```
CLIENT                          SERVER
  │                               │
  ├─ POST /api/password/change ──→
  │  {                            │
  │    "new_password": "...",     │
  │    "confirm_password": "..."  │
  │  }                            │
  │                               │
  │                          ┌─ Validate password
  │                          ├─ Hash new password
  │                          ├─ Update user password
  │                          ├─ Set force_password_change = false
  │                          ├─ Mark reset as "used"
  │                          │
  ←─ 200 OK ─────────────────┤
  {                           │
    "success": true,          │
    "message": "..."          │
  }                           │
  │                           │
  ├─ Redirect to dashboard
  │
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USER SUBMITS EMAIL                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│              VALIDATE EMAIL & CHECK DUPLICATES               │
│  ├─ Email exists in users table?                            │
│  ├─ Is email valid format?                                  │
│  └─ Is there already a pending request?                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│         CREATE PASSWORD_RESET_REQUEST RECORD                │
│  ├─ user_id: (from users table)                             │
│  ├─ email: user@example.com                                 │
│  ├─ status: 'pending'                                       │
│  ├─ temporary_password: NULL                                │
│  └─ created_at: NOW()                                       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│           SEND EMAIL TO ADMIN (igcfma@gmail.com)            │
│  ├─ Subject: Password Reset Request - Action Required       │
│  ├─ User Info: name, email, role                            │
│  ├─ Approval Link: /admin/password-reset/{id}/approve       │
│  └─ Rejection Link: /admin/password-reset/{id}/reject       │
└─────────────────────────────────────────────────────────────┘
                          ↓
                    ADMIN RECEIVES EMAIL
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                  ADMIN CLICKS APPROVAL LINK                  │
│         GET /admin/password-reset/{id}/approve              │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│            GENERATE TEMPORARY PASSWORD                       │
│  ├─ Generate: substr(md5(uniqid()), 0, 8)                   │
│  ├─ Example: "A7X9K2M5"                                     │
│  └─ Hash: bcrypt($temporaryPassword)                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│         UPDATE PASSWORD_RESET_REQUEST RECORD                │
│  ├─ temporary_password: (hashed)                            │
│  ├─ status: 'approved'                                      │
│  └─ approved_at: NOW()                                      │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│              UPDATE USER RECORD                              │
│  ├─ password: (hashed temporary password)                   │
│  └─ force_password_change: true                             │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│         SEND EMAIL TO USER (user@example.com)               │
│  ├─ Subject: Your Temporary Password                        │
│  ├─ Temporary Password: A7X9K2M5                            │
│  ├─ Instructions: Use to login, then change password        │
│  └─ Warnings: Don't share, expires after first login        │
└─────────────────────────────────────────────────────────────┘
                          ↓
                    USER RECEIVES EMAIL
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                  USER LOGS IN                                │
│  ├─ Email: user@example.com                                 │
│  └─ Password: A7X9K2M5 (temporary)                          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│         VERIFY CREDENTIALS & CHECK FLAGS                    │
│  ├─ Email exists?                                           │
│  ├─ Password matches?                                       │
│  └─ force_password_change = true?                           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│         SHOW FORCE PASSWORD CHANGE MODAL                    │
│  ├─ User cannot access dashboard                            │
│  ├─ Must enter new password                                 │
│  └─ Must confirm password                                   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│              USER CHANGES PASSWORD                           │
│  ├─ New Password: (user's choice)                           │
│  └─ Confirm: (user's choice)                                │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│         UPDATE USER RECORD                                  │
│  ├─ password: (hashed new password)                         │
│  └─ force_password_change: false                            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│         UPDATE PASSWORD_RESET_REQUEST RECORD                │
│  ├─ status: 'used'                                          │
│  └─ used_at: NOW()                                          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                  REDIRECT TO DASHBOARD                       │
│  ├─ User can now access all features                        │
│  └─ Password reset complete                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Hierarchy

```
App
├── Login
│   ├── LoginForm
│   │   ├── EmailInput
│   │   ├── PasswordInput
│   │   ├── LoginButton
│   │   └── ForgotPasswordButton ← NEW
│   │
│   ├── ForgotPasswordModal ← NEW
│   │   ├── ModalHeader
│   │   ├── ModalBody
│   │   │   ├── EmailInput
│   │   │   ├── SubmitButton
│   │   │   ├── SuccessMessage
│   │   │   ├── ErrorMessage
│   │   │   └── InfoBox
│   │   └── ModalFooter
│   │       ├── CancelButton
│   │       └── RequestButton
│   │
│   ├── RateLimitModal
│   │   └── (existing)
│   │
│   └── ImageSlider
│       └── (existing)
│
├── Dashboard
│   ├── ForcePasswordChangeModal
│   │   ├── PasswordInput
│   │   ├── ConfirmInput
│   │   └── ChangeButton
│   │
│   └── (other dashboard components)
│
└── (other routes)
```

---

## State Management

```
Login Component State:
├── email: string
├── password: string
├── loading: boolean
├── showPassword: boolean
├── emailError: string
├── passwordError: string
├── currentSlide: number
├── isTransitioning: boolean
├── showRateLimitModal: boolean
└── showForgotPasswordModal: boolean ← NEW

ForgotPasswordModal State:
├── email: string
├── loading: boolean
├── message: string
└── messageType: 'success' | 'error'

AuthContext State:
├── user: User
├── token: string
└── isAuthenticated: boolean
```

---

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────┐
│              USER SUBMITS RESET REQUEST                  │
└─────────────────────────────────────────────────────────┘
                          ↓
                    ┌─────────────┐
                    │ Validation  │
                    └─────────────┘
                          ↓
         ┌────────────────┬────────────────┐
         ↓                ↓                ↓
    ✓ Valid         ✗ Invalid Email   ✗ Not Found
         │                │                │
         ↓                ↓                ↓
    Continue      Error Message      Error Message
                  "Invalid email"     "Email not found"
         │                │                │
         ↓                ↓                ↓
    Check for      Show Error         Show Error
    Duplicates     Return to Modal    Return to Modal
         │
         ├─ ✓ No duplicate
         │   │
         │   ↓
         │   Create Record
         │   Send Email
         │   Success Message
         │
         └─ ✗ Duplicate
             │
             ↓
             Error Message
             "Request already pending"
             Return to Modal
```

---

## Security Flow

```
┌──────────────────────────────────────────────────────┐
│                 SECURITY MEASURES                     │
├──────────────────────────────────────────────────────┤
│                                                       │
│ 1. INPUT VALIDATION                                  │
│    ├─ Email format validation                        │
│    ├─ Email existence check                          │
│    └─ SQL injection prevention (parameterized)       │
│                                                       │
│ 2. RATE LIMITING                                     │
│    ├─ 3 requests per minute per IP                   │
│    ├─ Throttle middleware                            │
│    └─ Returns 429 Too Many Requests                  │
│                                                       │
│ 3. PASSWORD SECURITY                                 │
│    ├─ Temporary password: 8 random characters        │
│    ├─ Hashed with bcrypt                             │
│    ├─ Expires after first use                        │
│    └─ Never stored in plain text                     │
│                                                       │
│ 4. DUPLICATE PREVENTION                              │
│    ├─ Check for existing pending request             │
│    ├─ Only one pending per user                      │
│    └─ Prevents spam                                  │
│                                                       │
│ 5. EMAIL VERIFICATION                                │
│    ├─ Email must exist in users table                │
│    ├─ Only registered users can reset                │
│    └─ Prevents unauthorized access                   │
│                                                       │
│ 6. STATUS TRACKING                                   │
│    ├─ All requests tracked                           │
│    ├─ Timestamps recorded                            │
│    ├─ Status: pending/approved/rejected/used         │
│    └─ Audit trail maintained                         │
│                                                       │
│ 7. FORCE PASSWORD CHANGE                             │
│    ├─ User must change password on first login       │
│    ├─ Temporary password cannot be reused            │
│    ├─ Modal blocks dashboard access                  │
│    └─ Ensures new password is set                    │
│                                                       │
└──────────────────────────────────────────────────────┘
```

---

## Database Relationships

```
users (existing)
├─ id (PK)
├─ name
├─ email (UNIQUE)
├─ password
├─ role
├─ force_password_change ← Updated for this feature
└─ timestamps

password_reset_requests (NEW)
├─ id (PK)
├─ user_id (FK → users.id)
├─ email
├─ temporary_password
├─ status
├─ approved_at
├─ used_at
└─ timestamps

Relationship:
users (1) ──→ (many) password_reset_requests
```

---

## File Structure

```
igcfms_capstone_project/
├── backend/
│   ├── app/
│   │   ├── Http/Controllers/
│   │   │   └── PasswordResetController.php ← NEW
│   │   ├── Mail/
│   │   │   ├── PasswordResetRequestMail.php ← NEW
│   │   │   └── TemporaryPasswordMail.php ← NEW
│   │   └── Models/
│   │       └── PasswordResetRequest.php ← NEW
│   ├── database/
│   │   └── migrations/
│   │       └── 2025_12_15_084300_create_password_reset_requests_table.php ← NEW
│   ├── resources/views/emails/
│   │   ├── password-reset-request.blade.php ← NEW
│   │   └── temporary-password.blade.php ← NEW
│   └── routes/
│       └── api.php ← MODIFIED
│
├── igcfms/
│   └── src/components/
│       ├── modals/
│       │   ├── ForgotPasswordModal.jsx ← NEW
│       │   └── css/
│       │       └── ForgotPasswordModal.css ← NEW
│       └── pages/
│           ├── Login.jsx ← MODIFIED
│           └── css/
│               └── Login.css ← MODIFIED
│
└── Documentation/
    ├── FORGOT_PASSWORD_SETUP.md ← NEW
    ├── FORGOT_PASSWORD_TESTING.md ← NEW
    ├── FORGOT_PASSWORD_QUICKSTART.md ← NEW
    ├── FORGOT_PASSWORD_SUMMARY.md ← NEW
    └── FORGOT_PASSWORD_ARCHITECTURE.md ← NEW (this file)
```

---

## Technology Stack

```
Frontend:
├─ React 18+
├─ React Router
├─ Fetch API
└─ CSS3

Backend:
├─ Laravel 11
├─ PHP 8.2+
├─ MySQL/SQLite
└─ Sanctum (Authentication)

Email:
├─ SMTP (configurable)
├─ Blade Templates
└─ Laravel Mail

Security:
├─ Bcrypt (password hashing)
├─ Rate Limiting (throttle middleware)
├─ CSRF Protection
└─ Input Validation
```

---

This architecture ensures a secure, scalable, and maintainable forgot password feature integrated seamlessly with the existing IGCFMS system.
