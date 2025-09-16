<!DOCTYPE html>
<html>

<head>
    <title>New Registration Request</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
        }

        .button {
            background: #4CAF50;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            display: inline-block;
        }

        .button.reject {
            background: #f44336;
        }
    </style>
</head>

<body>
    <h2>New User Registration Request</h2>

    <p><strong>Name:</strong> {{ $request->name }}</p>
    <p><strong>Email:</strong> {{ $request->email }}</p>
    <p><strong>Role:</strong> {{ $request->role }}</p>
    <p><strong>Submitted:</strong> {{ $request->created_at->format('F j, Y g:i A') }}</p>

    <hr>

    <p>
        <a href="{{ url('http://localhost:8000/api/admin/approve/'.$request->id) }}" class="button">
            Approve Request
        </a>

        <a href="{{ url('http://localhost:8000/api/admin/reject/'.$request->id) }}" class="button reject">
            Reject Request
        </a>
    </p>

    <p>Or log into the admin panel to review this request.</p>
</body>

</html>