# Forgot Password Feature - Quick Start

## 🚀 Get Started in 5 Minutes

### Step 1: Run Database Migration
```bash
cd backend
php artisan migrate
```

### Step 2: Configure Environment
Edit `backend/.env` and ensure:
```env
ADMIN_EMAIL=igcfma@gmail.com
MAIL_MAILER=log
```

For production SMTP:
```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM_ADDRESS=your-email@gmail.com
MAIL_FROM_NAME="IGCFMS"
```

### Step 3: Test the Feature

1. **Open Login Page**
   - Navigate to http://localhost:3000/login

2. **Click "Forgot Password?" Button**
   - Button appears below login form

3. **Submit Email**
   - Enter a valid user email
   - Click "Request Reset"
   - Success message appears

4. **Check Admin Email**
   - For development: Check `storage/logs/laravel.log`
   - For production: Check admin inbox

5. **Admin Approves**
   - Click approval link in email
   - Temporary password is generated

6. **User Logs In**
   - Use temporary password to login
   - Force password change modal appears
   - Set new password

## 📁 Files Overview

### Backend
```
backend/
├── app/
│   ├── Http/Controllers/
│   │   └── PasswordResetController.php      ← Main logic
│   ├── Mail/
│   │   ├── PasswordResetRequestMail.php     ← Admin email
│   │   └── TemporaryPasswordMail.php        ← User email
│   └── Models/
│       └── PasswordResetRequest.php         ← Database model
├── database/migrations/
│   └── 2025_12_15_084300_create_password_reset_requests_table.php
├── resources/views/emails/
│   ├── password-reset-request.blade.php     ← Admin template
│   └── temporary-password.blade.php         ← User template
└── routes/
    └── api.php                              ← API endpoints
```

### Frontend
```
igcfms/
└── src/components/
    ├── modals/
    │   ├── ForgotPasswordModal.jsx          ← Modal component
    │   └── css/
    │       └── ForgotPasswordModal.css      ← Modal styling
    └── pages/
        ├── Login.jsx                        ← Updated with button
        └── css/
            └── Login.css                    ← Updated styling
```

## 🔌 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/password/reset-request` | User requests reset |
| GET | `/api/password/reset-status` | Check request status |
| GET | `/admin/password-reset/{id}/approve` | Admin approves |
| GET | `/admin/password-reset/{id}/reject` | Admin rejects |
| GET | `/admin/password-reset/pending` | Get pending requests |

## 🔐 Security Features

✅ Rate limiting (3 requests per minute)
✅ Temporary password hashing
✅ Email verification
✅ Status tracking
✅ Force password change on first login
✅ Duplicate request prevention

## 📧 Email Flow

### Admin Email
```
Subject: Password Reset Request - Action Required

Contains:
- User name, email, role
- Request timestamp
- Approval button/link
```

### User Email
```
Subject: Your Temporary Password

Contains:
- Temporary password (8 chars)
- Login instructions
- Security warnings
- Next steps
```

## 🧪 Quick Test

### Using cURL
```bash
# Request reset
curl -X POST http://localhost:8000/api/password/reset-request \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'

# Check status
curl http://localhost:8000/api/password/reset-status?email=user@example.com
```

### Using Postman
1. Create POST request to `http://localhost:8000/api/password/reset-request`
2. Set header: `Content-Type: application/json`
3. Body: `{"email": "user@example.com"}`
4. Send and check response

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Migration fails | Run `php artisan migrate:fresh` |
| Email not sending | Check SMTP config in `.env` |
| Modal not showing | Clear browser cache, check console |
| Temp password not working | Verify `force_password_change` is true |
| Rate limit error | Wait 1 minute or adjust throttle |

## 📊 Database Schema

```sql
CREATE TABLE password_reset_requests (
  id BIGINT PRIMARY KEY,
  user_id BIGINT FOREIGN KEY,
  email VARCHAR(255),
  temporary_password VARCHAR(255) NULL,
  status ENUM('pending', 'approved', 'rejected', 'used'),
  approved_at TIMESTAMP NULL,
  used_at TIMESTAMP NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## 🎯 User Journey

```
1. User clicks "Forgot Password?"
   ↓
2. Enters email in modal
   ↓
3. Request sent to backend
   ↓
4. Admin receives email
   ↓
5. Admin clicks approval link
   ↓
6. Temp password generated
   ↓
7. User receives email with temp password
   ↓
8. User logs in with temp password
   ↓
9. Force password change modal appears
   ↓
10. User sets new password
   ↓
11. Access to dashboard granted
```

## ⚙️ Configuration Options

### Throttle Rate
File: `backend/routes/api.php`
```php
->middleware('throttle:3,1')  // 3 requests per 1 minute
```

### Admin Email
File: `backend/.env`
```env
ADMIN_EMAIL=igcfma@gmail.com
```

### Temporary Password Length
File: `backend/app/Models/PasswordResetRequest.php`
```php
substr(md5(uniqid()), 0, 8)  // Change 8 to desired length
```

## 📚 Additional Resources

- **Setup Guide**: `FORGOT_PASSWORD_SETUP.md`
- **Testing Guide**: `FORGOT_PASSWORD_TESTING.md`
- **Laravel Mail**: https://laravel.com/docs/mail
- **React Hooks**: https://react.dev/reference/react

## ✅ Checklist Before Production

- [ ] Migration run successfully
- [ ] SMTP configured
- [ ] Admin email set correctly
- [ ] All tests passed
- [ ] Email templates customized
- [ ] Rate limiting appropriate
- [ ] Error messages user-friendly
- [ ] Mobile responsive
- [ ] Security review complete
- [ ] Documentation updated

## 🆘 Need Help?

1. Check `FORGOT_PASSWORD_SETUP.md` for detailed setup
2. Check `FORGOT_PASSWORD_TESTING.md` for test cases
3. Check Laravel logs: `storage/logs/laravel.log`
4. Check browser console for frontend errors
5. Verify database with: `php artisan tinker`

## 🎉 You're All Set!

The forgot password feature is now ready to use. Users can request password resets, admins can approve them, and users will be forced to change their password on first login.

Happy coding! 🚀
