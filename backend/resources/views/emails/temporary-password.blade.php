<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            line-height: 1.6;
            color: #000;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            padding: 0;
            border: 2px solid #000;
            border-radius: 8px;
            background-color: #fff;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .header {
            background-color: #000;
            color: white;
            padding: 30px 20px;
            text-align: center;
            border-radius: 6px 6px 0 0;
            border-bottom: 2px solid #000;
        }
        .header h2 {
            margin: 0;
            font-size: 24px;
            font-weight: 700;
            letter-spacing: 0.5px;
        }
        .content {
            padding: 30px 25px;
            background-color: #fff;
        }
        .content p {
            margin: 0 0 15px 0;
            font-size: 15px;
            color: #333;
        }
        .content ol, .content ul {
            margin: 15px 0 15px 20px;
            font-size: 14px;
            color: #333;
        }
        .content li {
            margin: 8px 0;
        }
        .password-box {
            background-color: #f9f9f9;
            border: 2px solid #000;
            padding: 25px;
            text-align: center;
            border-radius: 6px;
            margin: 25px 0;
        }
        .password-box .label {
            color: #666;
            font-size: 13px;
            margin-bottom: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .password-box .password {
            font-size: 28px;
            font-weight: bold;
            color: #000;
            font-family: 'Courier New', monospace;
            letter-spacing: 3px;
            background-color: #fff;
            padding: 15px;
            border-radius: 4px;
            border: 1px solid #ddd;
        }
        .warning {
            background-color: #f0f0f0;
            border: 2px solid #000;
            padding: 18px;
            border-radius: 6px;
            margin: 25px 0;
            color: #333;
        }
        .warning strong {
            color: #000;
            font-weight: 700;
        }
        .warning ul {
            margin: 12px 0 0 20px;
            padding: 0;
        }
        .warning li {
            margin: 8px 0;
            font-size: 14px;
        }
        .footer {
            text-align: center;
            padding: 20px 25px;
            color: #666;
            font-size: 12px;
            border-top: 1px solid #ddd;
            background-color: #fafafa;
            border-radius: 0 0 6px 6px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Your Temporary Password</h2>
        </div>
        <div class="content">
            <p>Hello {{ $user->name }},</p>
            
            <p>Your password reset request has been approved by the administrator. Your temporary password is ready:</p>
            
            <div class="password-box">
                <div class="label">Your Temporary Password:</div>
                <div class="password">{{ $temporaryPassword }}</div>
            </div>
            
            <div class="warning">
                <strong>⚠️ Important Security Notice:</strong>
                <ul>
                    <li>This temporary password will expire after your first login</li>
                    <li>You will be required to change it to a new password upon login</li>
                    <li>Do not share this password with anyone</li>
                    <li>Keep this email secure</li>
                </ul>
            </div>
            
            <p><strong>Next Steps:</strong></p>
            <ol>
                <li>Log in to the system using your email and this temporary password</li>
                <li>You will be prompted to change your password immediately</li>
                <li>Create a new, strong password that you will remember</li>
            </ol>
            
            <p>If you did not request this password reset, please contact the administrator immediately.</p>
        </div>
        <div class="footer">
            <p>&copy; {{ date('Y') }} IGCFMS. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
