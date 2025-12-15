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
        .button {
            display: inline-block;
            padding: 14px 35px;
            background-color: #000;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin: 25px 0;
            font-weight: 600;
            border: 2px solid #000;
            transition: all 0.3s ease;
            font-size: 15px;
            letter-spacing: 0.5px;
        }
        .button:hover {
            background-color: #fff;
            color: #000;
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
        .user-info {
            background-color: #f9f9f9;
            padding: 20px;
            border-left: 4px solid #000;
            margin: 20px 0;
            border-radius: 4px;
        }
        .user-info p {
            margin: 8px 0;
            font-size: 14px;
        }
        .user-info strong {
            color: #000;
            font-weight: 600;
        }
        hr {
            border: none;
            border-top: 1px solid #ddd;
            margin: 20px 0;
        }
        .note {
            background-color: #f0f0f0;
            padding: 12px 15px;
            border-radius: 4px;
            font-size: 13px;
            color: #555;
            margin-top: 15px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Password Reset Request</h2>
        </div>
        <div class="content">
            <p>Hello Admin,</p>
            
            <p>A user has requested a password reset. Please review the details below:</p>
            
            <div class="user-info">
                <p><strong>User Name:</strong> {{ $user->name }}</p>
                <p><strong>User Email:</strong> {{ $user->email }}</p>
                <p><strong>User Role:</strong> {{ ucfirst($user->role) }}</p>
                <p><strong>Request Time:</strong> {{ $resetRequest->created_at->format('Y-m-d H:i:s') }}</p>
            </div>
            
            <p>To approve this password reset request and send a temporary password to the user, click the button below:</p>
            
            <center>
                <a href="{{ $approvalLink }}" class="button">Approve Password Reset</a>
            </center>
            
            <p>If you did not expect this request or have any concerns, you can reject it by ignoring this email or contacting the user directly.</p>
            
            <hr>
            <div class="note">
                <strong>Note:</strong> This link will expire in 24 hours.
            </div>
        </div>
        <div class="footer">
            <p>&copy; {{ date('Y') }} IGCFMS. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
