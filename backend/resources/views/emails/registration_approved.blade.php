<!DOCTYPE html>
<html>

<head>
    <title>Account Approved</title>
</head>

<body>
    <h2>Hi {{ $user->name }},</h2>
    <p>Your registration request for IGCFMS has been approved by the admin!</p>
    <p>You can now log in with your email and password:</p>
    <a href="{{ env('NGROK_URL', env('APP_URL')) }}/login">Log In</a>
</body>

</html>