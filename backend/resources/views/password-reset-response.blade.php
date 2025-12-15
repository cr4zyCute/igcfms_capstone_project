<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset - {{ $success ? 'Success' : 'Error' }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f5f5f5;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
            padding: 50px 40px;
            max-width: 500px;
            width: 100%;
            text-align: center;
            border: 2px solid #000;
        }
        
        .icon {
            font-size: 60px;
            margin-bottom: 20px;
            font-weight: bold;
        }
        
        .success .icon {
            color: #000;
        }
        
        .error .icon {
            color: #000;
        }
        
        h1 {
            font-size: 28px;
            margin-bottom: 15px;
            color: #000;
            font-weight: 700;
            letter-spacing: -0.5px;
        }
        
        .success h1 {
            color: #000;
        }
        
        .error h1 {
            color: #000;
        }
        
        .message {
            font-size: 16px;
            color: #333;
            line-height: 1.6;
            margin-bottom: 30px;
            font-weight: 500;
        }
        
        .button {
            display: inline-block;
            padding: 14px 35px;
            background: #000;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            transition: all 0.3s ease;
            border: 2px solid #000;
            font-size: 15px;
            letter-spacing: 0.5px;
        }
        
        .button:hover {
            background: white;
            color: #000;
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
        }
        
        .footer {
            margin-top: 35px;
            padding-top: 25px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #666;
            font-weight: 500;
        }
        
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #000;
            margin-right: 8px;
            vertical-align: middle;
        }
    </style>
</head>
<body>
    <div class="container {{ $success ? 'success' : 'error' }}">
        <div class="icon">
            {{ $success ? '✓' : '✕' }}
        </div>
        
        <h1>
            {{ $success ? 'Password Reset Approved' : 'Error' }}
        </h1>
        
        <p class="message">
            {{ $message }}
        </p>
        
        <a href="http://localhost:3000/login" class="button">
            Back to Login
        </a>
        
        <div class="footer">
            <span class="status-indicator"></span>
            <p>IGCFMS - Integrated Government Cashiering and Financial Management System</p>
        </div>
    </div>
</body>
</html>
