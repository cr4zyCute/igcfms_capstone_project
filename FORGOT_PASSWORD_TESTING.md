# Forgot Password Feature - Testing Guide

## Pre-Testing Checklist

- [ ] Backend migration has been run: `php artisan migrate`
- [ ] `.env` file has `ADMIN_EMAIL=igcfma@gmail.com` configured
- [ ] Email service is configured (SMTP or log driver for testing)
- [ ] Frontend components are imported correctly
- [ ] No console errors in browser DevTools

## Testing Steps

### Test 1: Frontend Modal Display

**Steps**:
1. Navigate to login page
2. Look for "Forgot Password?" button below the login button
3. Click the button
4. Verify ForgotPasswordModal appears with:
   - Header: "Forgot Password"
   - Email input field
   - "Request Reset" button
   - Info box explaining the process
   - Close button (×)

**Expected Result**: Modal displays correctly with all elements visible

---

### Test 2: Submit Password Reset Request

**Steps**:
1. Open ForgotPasswordModal
2. Enter a valid user email (e.g., `admin@example.com`)
3. Click "Request Reset" button
4. Observe the button changes to "Sending..."
5. Wait for response

**Expected Result**: 
- Success message: "Password reset request submitted successfully. Please wait for admin approval."
- Modal closes after 2 seconds
- No console errors

**Error Cases**:
- **Invalid email**: "Please enter a valid email"
- **Non-existent email**: "Email not found in system"
- **Duplicate request**: "A password reset request is already pending for this email"

---

### Test 3: Admin Email Reception

**Steps**:
1. After submitting reset request, check admin email (igcfma@gmail.com)
2. Look for email with subject: "Password Reset Request - Action Required"
3. Verify email contains:
   - User's name
   - User's email
   - User's role
   - Request timestamp
   - "Approve Password Reset" button/link

**Expected Result**: Email is received with all required information

**Troubleshooting**:
- If using log driver: Check `storage/logs/laravel.log`
- If using SMTP: Check SMTP credentials in `.env`
- Check spam/junk folder

---

### Test 4: Admin Approval Process

**Steps**:
1. In the admin email, click "Approve Password Reset" button
2. This should navigate to: `/admin/password-reset/{id}/approve`
3. Verify response shows: "Password reset approved. Temporary password sent to user."

**Expected Result**: 
- Page displays success message
- Temporary password is generated
- User's `force_password_change` flag is set to true
- Email is sent to user with temporary password

---

### Test 5: User Receives Temporary Password

**Steps**:
1. Check the user's email inbox
2. Look for email with subject: "Your Temporary Password"
3. Verify email contains:
   - Greeting with user's name
   - Temporary password (8-character code)
   - Warning about password expiration
   - Instructions for next steps

**Expected Result**: Email received with temporary password clearly displayed

---

### Test 6: Login with Temporary Password

**Steps**:
1. Go to login page
2. Enter user's email
3. Enter the temporary password from email
4. Click "Log in"
5. Verify you're logged in

**Expected Result**: 
- User successfully logs in
- ForcePasswordChangeModal automatically appears
- User is forced to change password before accessing dashboard

---

### Test 7: Force Password Change

**Steps**:
1. After logging in with temporary password, ForcePasswordChangeModal should appear
2. Enter new password (must be different from temporary password)
3. Confirm new password
4. Click "Change Password" button
5. Verify you're redirected to dashboard

**Expected Result**: 
- Password is successfully changed
- User can access dashboard
- Password reset request is marked as "used"

---

### Test 8: Prevent Duplicate Requests

**Steps**:
1. Submit password reset request for a user
2. Without waiting for approval, submit another request for the same email
3. Observe the response

**Expected Result**: 
- Error message: "A password reset request is already pending for this email. Please wait for admin approval."
- Second request is not created

---

### Test 9: Rate Limiting

**Steps**:
1. Submit 4 password reset requests in quick succession
2. Observe the 4th request

**Expected Result**: 
- 4th request is rate limited (429 error)
- User sees error message
- Can retry after 1 minute

---

### Test 10: Admin Rejection (Optional)

**Steps**:
1. Submit password reset request
2. In admin email, if there's a reject link, click it
3. Verify response

**Expected Result**: 
- Request status changes to "rejected"
- User does not receive temporary password
- User can submit new request

---

## Database Verification

### Check Password Reset Requests Table

```sql
-- View all requests
SELECT * FROM password_reset_requests;

-- View pending requests
SELECT * FROM password_reset_requests WHERE status = 'pending';

-- View approved requests
SELECT * FROM password_reset_requests WHERE status = 'approved';

-- View specific user's requests
SELECT * FROM password_reset_requests WHERE user_id = 1;
```

### Check User Password Change Flag

```sql
-- View users with force_password_change = true
SELECT id, name, email, force_password_change FROM users WHERE force_password_change = true;

-- Reset flag manually (if needed)
UPDATE users SET force_password_change = false WHERE id = 1;
```

---

## API Testing (Using Postman/cURL)

### Test Password Reset Request

**Endpoint**: `POST /api/password/reset-request`

**cURL**:
```bash
curl -X POST http://localhost:8000/api/password/reset-request \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

**Response**:
```json
{
  "success": true,
  "message": "Password reset request submitted successfully. Please wait for admin approval."
}
```

---

### Test Reset Status

**Endpoint**: `GET /api/password/reset-status?email=user@example.com`

**cURL**:
```bash
curl http://localhost:8000/api/password/reset-status?email=user@example.com
```

**Response**:
```json
{
  "success": true,
  "status": "pending",
  "message": "Reset request status retrieved."
}
```

---

## Common Issues & Solutions

### Issue: Modal doesn't appear
**Solution**: 
- Check if ForgotPasswordModal is imported in Login.jsx
- Check browser console for errors
- Verify CSS file is linked

### Issue: Email not sending
**Solution**:
- Check SMTP configuration in `.env`
- Verify `ADMIN_EMAIL` is set
- Check Laravel logs: `storage/logs/laravel.log`
- If using log driver, check logs instead of email

### Issue: Temporary password not working
**Solution**:
- Verify password was hashed correctly in database
- Check if `force_password_change` flag is true
- Verify ForcePasswordChangeModal is working

### Issue: Rate limiting too strict
**Solution**:
- Adjust throttle in `routes/api.php`: `middleware('throttle:3,1')`
- Change `3,1` to desired requests per minute

### Issue: Database migration fails
**Solution**:
- Check if table already exists: `php artisan migrate:status`
- Rollback previous migrations if needed: `php artisan migrate:rollback`
- Check migration file for syntax errors

---

## Performance Testing

### Load Testing
- Test with multiple simultaneous password reset requests
- Monitor database performance
- Check email queue (if using queue)

### Security Testing
- Test SQL injection in email field
- Test XSS in email input
- Verify rate limiting works
- Test with invalid tokens

---

## Browser Compatibility

Test on:
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

---

## Accessibility Testing

- [ ] Modal is keyboard navigable
- [ ] Focus management works correctly
- [ ] Error messages are announced
- [ ] Color contrast meets WCAG standards
- [ ] Form labels are properly associated

---

## Sign-off Checklist

- [ ] All 10 tests passed
- [ ] No console errors
- [ ] Email functionality working
- [ ] Database records created correctly
- [ ] User flow is smooth
- [ ] Error messages are clear
- [ ] Mobile responsive
- [ ] Rate limiting works
- [ ] Force password change works
- [ ] Ready for production

---

## Notes

- For development, use `MAIL_MAILER=log` to see emails in logs
- For production, configure proper SMTP settings
- Test with real email addresses when possible
- Monitor email delivery rates
- Keep temporary passwords secure
