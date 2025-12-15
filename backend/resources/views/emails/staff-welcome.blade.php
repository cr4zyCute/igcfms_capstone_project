<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to IGCFMS - Your Account Credentials</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333;
            background: #f5f7fa;
        }
        .container { 
            max-width: 650px; 
            margin: 20px auto; 
            background: #fff;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header { 
            background: linear-gradient(135deg, #111827 0%, #1f2937 100%);
            color: #fff; 
            padding: 40px 30px; 
            text-align: center;
        }
        .header h1 { 
            margin: 0 0 8px 0; 
            font-size: 28px;
            font-weight: 700;
        }
        .header p {
            margin: 0;
            font-size: 14px;
            opacity: 0.9;
        }
        .content { 
            padding: 40px 30px;
        }
        .greeting {
            color: #111827;
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 12px;
        }
        .intro-text {
            color: #6b7280;
            margin-bottom: 30px;
            font-size: 15px;
        }
        .credentials-box { 
            background: linear-gradient(135deg, #f0f9ff 0%, #f3f4f6 100%);
            border: 2px solid #e0e7ff;
            border-radius: 10px; 
            padding: 25px; 
            margin: 30px 0;
        }
        .credential-item { 
            margin: 20px 0;
        }
        .credential-item:first-child {
            margin-top: 0;
        }
        .credential-label { 
            font-weight: 700; 
            color: #4b5563; 
            font-size: 11px; 
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
            display: block;
        }
        .credential-label i {
            margin-right: 6px;
            color: #1e40af;
        }
        .credential-value { 
            background: #fff;
            padding: 14px 16px; 
            border-radius: 8px; 
            font-family: 'Courier New', monospace; 
            font-size: 16px; 
            font-weight: 600;
            color: #111827;
            word-break: break-all;
            border: 1px solid #e5e7eb;
            letter-spacing: 1px;
        }
        .warning { 
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border-left: 5px solid #f59e0b; 
            padding: 20px; 
            margin: 30px 0; 
            border-radius: 8px;
        }
        .warning-title { 
            font-weight: 700; 
            color: #92400e; 
            margin-bottom: 10px;
            font-size: 15px;
        }
        .warning-title i {
            margin-right: 8px;
        }
        .warning-text { 
            color: #78350f; 
            font-size: 14px;
            line-height: 1.5;
        }
        .steps {
            margin: 30px 0;
        }
        .steps h3 {
            color: #111827;
            font-size: 16px;
            font-weight: 700;
            margin-bottom: 15px;
        }
        .steps h3 i {
            margin-right: 8px;
            color: #1e40af;
        }
        .steps ol {
            margin-left: 20px;
        }
        .steps li {
            color: #6b7280;
            margin: 10px 0;
            font-size: 14px;
            line-height: 1.6;
        }
        .support-text {
            color: #6b7280;
            font-size: 14px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
        }
        .signature {
            margin-top: 25px;
            color: #6b7280;
            font-size: 14px;
        }
        .signature strong {
            color: #111827;
        }
        .footer { 
            text-align: center; 
            color: #9ca3af; 
            font-size: 12px; 
            padding: 25px 30px;
            background: #f9fafb;
            border-top: 1px solid #e5e7eb;
        }
        .footer p {
            margin: 5px 0;
        }
        .badge {
            display: inline-block;
            background: #dbeafe;
            color: #1e40af;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            margin-top: 8px;
        }
        .badge i {
            margin-right: 4px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Welcome to IGCFMS</h1>
            <p>Integrated Government Collection and Fund Management System</p>
        </div>
        
        <div class="content">
            <div class="greeting">Hello {{ $name }},</div>
            
            <p class="intro-text">
                Your account has been successfully created in the IGCFMS system. Your login credentials are ready below. Please keep this information secure and change your password immediately upon first login.
            </p>
            
            <div class="credentials-box">
                <div class="credential-item">
                    <label class="credential-label"><i class="fas fa-envelope"></i> Email Address</label>
                    <div class="credential-value">{{ $email }}</div>
                </div>
                
                <div class="credential-item">
                    <label class="credential-label"><i class="fas fa-lock"></i> Temporary Password</label>
                    <div class="credential-value">{{ $password }}</div>
                    <span class="badge"><i class="fas fa-exclamation-triangle"></i> Change on first login</span>
                </div>
                
                <div class="credential-item">
                    <label class="credential-label"><i class="fas fa-user"></i> Your Role</label>
                    <div class="credential-value">{{ $role }}</div>
                </div>
            </div>
            
            <div class="warning">
                <div class="warning-title"><i class="fas fa-shield-alt"></i> Important Security Notice</div>
                <div class="warning-text">
                    <strong>This is a temporary password.</strong> You <strong>MUST</strong> change it immediately upon your first login. Never share this password with anyone. If you did not request this account or have any concerns, please contact your system administrator immediately.
                </div>
            </div>
            
            <div class="steps">
                <h3><i class="fas fa-list-check"></i> Next Steps:</h3>
                <ol>
                    <li>Visit the IGCFMS login page</li>
                    <li>Enter your email address and temporary password above</li>
                    <li>You will be prompted to change your password</li>
                    <li>Create a strong, unique password that only you know</li>
                    <li>Start using the IGCFMS system</li>
                </ol>
            </div>
            
            <p class="support-text">
                <strong>Need Help?</strong> If you have any questions, encounter any issues, or need technical assistance, please contact your system administrator or the IT support team.
            </p>
            
            <div class="signature">
                Best regards,<br>
                <strong>IGCFMS Administration</strong>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>© 2025 IGCFMS System. All rights reserved.</strong></p>
            <p>This is an automated message. Please do not reply to this email.</p>
            <p style="margin-top: 10px; opacity: 0.7;">For security reasons, never share your credentials via email or messaging apps.</p>
        </div>
    </div>
</body>
</html>
