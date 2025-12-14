<!DOCTYPE html>
<html>
<head>
    <title>Email Verification OTP</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .otp-box { background: #f5f5f5; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
        .otp-code { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #111827; }
        .warning { color: #dc2626; font-size: 14px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h2>Hi {{ $name }},</h2>
        <p>Your email verification code for IGCFMS staff registration is:</p>
        
        <div class="otp-box">
            <div class="otp-code">{{ $otp }}</div>
        </div>
        
        <p>This code will expire in <strong>10 minutes</strong>.</p>
        
        <p class="warning">If you did not request this code, please ignore this email.</p>
        
        <p>Best regards,<br>IGCFMS Team</p>
    </div>
</body>
</html>
