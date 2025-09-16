<!DOCTYPE html>
<html>

<head>
    <title>Registration Rejected</title>
</head>

<body>
    <h2>Hi {{ $request->name }},</h2>
    <p>We regret to inform you that your registration request for IGCFMS has been rejected.</p>

    @if($reason)
    <p><strong>Reason:</strong> {{ $reason }}</p>
    @endif

    <p>If you believe this was a mistake, please contact the admin.</p>
</body>

</html>