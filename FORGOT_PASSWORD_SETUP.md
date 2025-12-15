# Forgot Password Feature - Setup Guide

## Overview
This document outlines the complete forgot password feature implementation for the IGCFMS system. The feature allows users to request password resets, which are then approved by admins who send temporary passwords via email.

## Flow Diagram

```
User Login Page
    ↓
[Forgot Password Button]
    ↓
ForgotPasswordModal (Enter Email)
    ↓
POST /api/password/reset-request
    ↓
Email sent to Admin (igcfma@gmail.com)
    ↓
Admin clicks approval link in email
    ↓
GET /admin/password-reset/{id}/approve
    ↓
Temporary password generated & sent to user
    ↓
User logs in with temp password
    ↓
ForcePasswordChangeModal appears
    ↓
User sets new password
```

## Backend Implementation

### 1. Database Migration
**File**: `backend/database/migrations/2025_12_15_084300_create_password_reset_requests_table.php`

Creates `password_reset_requests` table with:
- `id`: Primary key
- `user_id`: Foreign key to users table
- `email`: User's email
- `temporary_password`: Hashed temporary password
- `status`: pending, approved, rejected, or used
- `approved_at`: Timestamp when admin approved
- `used_at`: Timestamp when user used the temp password
- `created_at`, `updated_at`: Timestamps

### 2. Model
**File**: `backend/app/Models/PasswordResetRequest.php`

Key methods:
- `user()`: Get associated user
- `isPending()`: Check if pending approval
- `isApproved()`: Check if approved
- `isUsed()`: Check if already used
- `generateTemporaryPassword()`: Generate random 8-character password

### 3. Controller
**File**: `backend/app/Http/Controllers/PasswordResetController.php`

Methods:
- `requestReset()`: User submits password reset request
- `approveReset($id)`: Admin approves and sends temp password
- `rejectReset($id)`: Admin rejects request
- `getStatus()`: Check request status
- `getPendingRequests()`: Get all pending requests for admin dashboard

### 4. Email Templates
**Files**:
- `backend/resources/views/emails/password-reset-request.blade.php` - Sent to admin
- `backend/resources/views/emails/temporary-password.blade.php` - Sent to user

### 5. Mail Classes
**Files**:
- `backend/app/Mail/PasswordResetRequestMail.php`
- `backend/app/Mail/TemporaryPasswordMail.php`

### 6. API Routes
**File**: `backend/routes/api.php`

```php
// Password reset routes (no auth required for request)
Route::post('/password/reset-request', [PasswordResetController::class, 'requestReset'])->middleware('throttle:3,1');
Route::get('/password/reset-status', [PasswordResetController::class, 'getStatus']);

// Admin password reset approval routes
Route::get('/admin/password-reset/{id}/approve', [PasswordResetController::class, 'approveReset']);
Route::get('/admin/password-reset/{id}/reject', [PasswordResetController::class, 'rejectReset']);
Route::middleware('auth:sanctum')->get('/admin/password-reset/pending', [PasswordResetController::class, 'getPendingRequests']);
```

## Frontend Implementation

### 1. ForgotPasswordModal Component
**File**: `igcfms/src/components/modals/ForgotPasswordModal.jsx`

Features:
- Email input field
- Submit button with loading state
- Success/error messages
- Info box explaining the process
- Responsive design

### 2. Modal Styling
**File**: `igcfms/src/components/modals/css/ForgotPasswordModal.css`

Includes:
- Modal overlay with blur effect
- Animated slide-up entrance
- Form styling
- Alert messages (success/error)
- Responsive mobile design

### 3. Login Page Integration
**File**: `igcfms/src/components/pages/Login.jsx`

Changes:
- Import ForgotPasswordModal component
- Add state: `showForgotPasswordModal`
- Add "Forgot Password?" button below login button
- Render modal component

### 4. Login Page Styling
**File**: `igcfms/src/components/pages/css/Login.css`

Added:
- `.forgot-password-btn` - Styled button
- `.forgot-password-btn:hover` - Hover effect
- `.forgot-password-btn:disabled` - Disabled state

## Environment Configuration

Add to `.env` file:

```env
# Admin email for password reset requests
ADMIN_EMAIL=igcfma@gmail.com

# Mail configuration (if not already set)
MAIL_MAILER=smtp
MAIL_HOST=your_smtp_host
MAIL_PORT=your_smtp_port
MAIL_USERNAME=your_email
MAIL_PASSWORD=your_password
MAIL_FROM_ADDRESS=your_from_email
MAIL_FROM_NAME="IGCFMS"
```

## Setup Instructions

### Backend Setup

1. **Run Migration**:
   ```bash
   php artisan migrate
   ```

2. **Configure Email** (in `.env`):
   - Set `ADMIN_EMAIL` to the admin's email address
   - Configure SMTP settings for email sending

3. **Test Email** (optional):
   ```bash
   php artisan tinker
   Mail::raw('Test email', function($message) {
     $message->to('test@example.com');
   });
   ```

### Frontend Setup

1. **Ensure ForgotPasswordModal is imported** in Login.jsx
2. **Check API endpoint** is accessible at `/api/password/reset-request`
3. **Test the flow** in development

## User Flow

### Step 1: User Requests Password Reset
1. User clicks "Forgot Password?" on login page
2. Modal opens with email input
3. User enters their email and clicks "Request Reset"
4. Request is sent to `/api/password/reset-request`
5. Success message displayed

### Step 2: Admin Receives Email
1. Admin receives email at `igcfma@gmail.com`
2. Email contains:
   - User's name, email, and role
   - Request timestamp
   - "Approve Password Reset" button (link)

### Step 3: Admin Approves Request
1. Admin clicks approval link in email
2. Link calls `/admin/password-reset/{id}/approve`
3. System generates temporary password
4. User's `force_password_change` flag set to true
5. Temporary password sent to user's email

### Step 4: User Logs In
1. User receives email with temporary password
2. User logs in with email and temporary password
3. ForcePasswordChangeModal automatically appears
4. User is required to change password
5. Password reset request marked as "used"

## API Endpoints

### POST `/api/password/reset-request`
**Request**:
```json
{
  "email": "user@example.com"
}
```

**Response (Success)**:
```json
{
  "success": true,
  "message": "Password reset request submitted successfully. Please wait for admin approval."
}
```

**Response (Error)**:
```json
{
  "success": false,
  "message": "A password reset request is already pending for this email."
}
```

### GET `/api/password/reset-status`
**Query Parameters**:
- `email`: User's email

**Response**:
```json
{
  "success": true,
  "status": "pending|approved|rejected|used",
  "message": "Reset request status retrieved."
}
```

### GET `/admin/password-reset/{id}/approve`
**Response**:
```json
{
  "success": true,
  "message": "Password reset approved. Temporary password sent to user."
}
```

### GET `/admin/password-reset/{id}/reject`
**Response**:
```json
{
  "success": true,
  "message": "Password reset request rejected."
}
```

## Security Considerations

1. **Rate Limiting**: Reset requests limited to 3 per minute
2. **Temporary Password**: 
   - 8-character random string
   - Hashed in database
   - Expires after first login
3. **Email Verification**: Only registered email addresses can request reset
4. **Status Tracking**: All requests tracked with timestamps
5. **Force Password Change**: User must change password on first login with temp password

## Troubleshooting

### Email Not Sending
- Check SMTP configuration in `.env`
- Verify `ADMIN_EMAIL` is set correctly
- Check Laravel logs: `storage/logs/laravel.log`

### Modal Not Appearing
- Ensure ForgotPasswordModal is imported in Login.jsx
- Check browser console for errors
- Verify CSS file is linked

### Temporary Password Not Working
- Check if user's password was updated in database
- Verify `force_password_change` flag is set to true
- Check if ForcePasswordChangeModal is working

### Database Issues
- Run migration: `php artisan migrate`
- Check migration status: `php artisan migrate:status`
- Rollback if needed: `php artisan migrate:rollback`

## Future Enhancements

1. **Password Reset Link**: Instead of temporary password, send reset link
2. **Expiration Time**: Add expiration time to reset requests
3. **Admin Dashboard**: Create admin panel to manage reset requests
4. **Email Templates**: Customize email templates with branding
5. **SMS Notification**: Send temporary password via SMS
6. **Two-Factor Authentication**: Add 2FA to password reset process

## Files Created/Modified

### Created Files:
- `backend/database/migrations/2025_12_15_084300_create_password_reset_requests_table.php`
- `backend/app/Models/PasswordResetRequest.php`
- `backend/app/Http/Controllers/PasswordResetController.php`
- `backend/app/Mail/PasswordResetRequestMail.php`
- `backend/app/Mail/TemporaryPasswordMail.php`
- `backend/resources/views/emails/password-reset-request.blade.php`
- `backend/resources/views/emails/temporary-password.blade.php`
- `igcfms/src/components/modals/ForgotPasswordModal.jsx`
- `igcfms/src/components/modals/css/ForgotPasswordModal.css`

### Modified Files:
- `backend/routes/api.php` - Added password reset routes
- `igcfms/src/components/pages/Login.jsx` - Added forgot password button and modal
- `igcfms/src/components/pages/css/Login.css` - Added button styling

## Support

For issues or questions, refer to:
- Laravel Documentation: https://laravel.com/docs
- React Documentation: https://react.dev
- Email Configuration: https://laravel.com/docs/mail
