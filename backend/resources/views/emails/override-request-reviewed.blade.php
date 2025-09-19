<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Override Request {{ $status }} - IGCFMS</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: {{ $overrideRequest->status === 'approved' ? '#16a34a' : '#dc2626' }};
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .content {
            background-color: #f8fafc;
            padding: 30px;
            border: 1px solid #e2e8f0;
        }
        .footer {
            background-color: #64748b;
            color: white;
            padding: 15px;
            text-align: center;
            border-radius: 0 0 8px 8px;
            font-size: 14px;
        }
        .details-box {
            background-color: white;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #f1f5f9;
        }
        .detail-row:last-child {
            border-bottom: none;
        }
        .label {
            font-weight: bold;
            color: #475569;
        }
        .value {
            color: #1e293b;
        }
        .status {
            background-color: {{ $overrideRequest->status === 'approved' ? '#16a34a' : '#dc2626' }};
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .alert {
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
        }
        .alert-success {
            background-color: #d1fae5;
            border: 1px solid #a7f3d0;
            color: #065f46;
        }
        .alert-danger {
            background-color: #fee2e2;
            border: 1px solid #fca5a5;
            color: #991b1b;
        }
        .btn {
            display: inline-block;
            background-color: #2563eb;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            margin: 10px 5px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>
            @if($overrideRequest->status === 'approved')
                ✅ Override Request Approved
            @else
                ❌ Override Request Rejected
            @endif
        </h1>
        <p>IGCFMS - Integrated Government Cash Flow Management System</p>
    </div>

    <div class="content">
        <h2>Dear {{ $overrideRequest->requestedBy->name }},</h2>
        
        @if($overrideRequest->status === 'approved')
            <div class="alert alert-success">
                <strong>Good news!</strong> Your override request has been approved by the administrator.
            </div>
        @else
            <div class="alert alert-danger">
                <strong>Request Rejected:</strong> Your override request has been rejected by the administrator.
            </div>
        @endif

        <div class="details-box">
            <h3>Override Request Details</h3>
            <div class="detail-row">
                <span class="label">Request ID:</span>
                <span class="value">#{{ $overrideRequest->id }}</span>
            </div>
            <div class="detail-row">
                <span class="label">Status:</span>
                <span class="status">{{ $status }}</span>
            </div>
            <div class="detail-row">
                <span class="label">Reviewed By:</span>
                <span class="value">{{ $reviewedBy->name }} ({{ $reviewedBy->role }})</span>
            </div>
            <div class="detail-row">
                <span class="label">Reviewed On:</span>
                <span class="value">{{ $overrideRequest->reviewed_at->format('M d, Y h:i A') }}</span>
            </div>
        </div>

        <div class="details-box">
            <h3>Transaction Details</h3>
            <div class="detail-row">
                <span class="label">Transaction ID:</span>
                <span class="value">#{{ $transaction->id }}</span>
            </div>
            <div class="detail-row">
                <span class="label">Type:</span>
                <span class="value">{{ $transaction->type }}</span>
            </div>
            <div class="detail-row">
                <span class="label">Amount:</span>
                <span class="value">₱{{ number_format($transaction->amount, 2) }}</span>
            </div>
            <div class="detail-row">
                <span class="label">Description:</span>
                <span class="value">{{ $transaction->description ?: 'N/A' }}</span>
            </div>
        </div>

        <div class="details-box">
            <h3>Your Original Reason</h3>
            <p>{{ $overrideRequest->reason }}</p>
        </div>

        @if($overrideRequest->review_notes)
        <div class="details-box">
            <h3>Admin Review Notes</h3>
            <p>{{ $overrideRequest->review_notes }}</p>
        </div>
        @endif

        @if($overrideRequest->status === 'approved')
            <p><strong>What happens next:</strong></p>
            <ul>
                <li>The proposed changes have been applied to the transaction</li>
                <li>The transaction has been marked as an override</li>
                <li>You can view the updated transaction in your dashboard</li>
            </ul>
        @else
            <p><strong>What happens next:</strong></p>
            <ul>
                <li>The original transaction remains unchanged</li>
                <li>You may submit a new override request with additional justification if needed</li>
                <li>Please contact your supervisor if you have questions about this decision</li>
            </ul>
        @endif

        <div style="text-align: center; margin-top: 30px;">
            <a href="{{ config('app.frontend_url', 'http://localhost:3000') }}/login?redirect=/cashier/dashboard" class="btn">
                Login to View Dashboard
            </a>
        </div>
    </div>

    <div class="footer">
        <p>This is an automated notification from IGCFMS</p>
        <p>© {{ date('Y') }} Integrated Government Cash Flow Management System</p>
    </div>
</body>
</html>
