<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>New Override Request - IGCFMS</title>
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
            background-color: #2563eb;
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
            background-color: #fbbf24;
            color: #92400e;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
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
        .btn-approve {
            background-color: #16a34a;
        }
        .btn-reject {
            background-color: #dc2626;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔄 New Override Request</h1>
        <p>IGCFMS - Integrated Government Cash Flow Management System</p>
    </div>

    <div class="content">
        <h2>Dear Admin,</h2>
        <p>A new transaction override request has been submitted and requires your review.</p>

        <div class="details-box">
            <h3>Override Request Details</h3>
            <div class="detail-row">
                <span class="label">Request ID:</span>
                <span class="value">#{{ $overrideRequest->id }}</span>
            </div>
            <div class="detail-row">
                <span class="label">Requested By:</span>
                <span class="value">{{ $requestedBy->name }} ({{ $requestedBy->role }})</span>
            </div>
            <div class="detail-row">
                <span class="label">Status:</span>
                <span class="status">{{ ucfirst($overrideRequest->status) }}</span>
            </div>
            <div class="detail-row">
                <span class="label">Submitted:</span>
                <span class="value">{{ $overrideRequest->created_at->format('M d, Y h:i A') }}</span>
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
            <div class="detail-row">
                <span class="label">Department:</span>
                <span class="value">{{ $transaction->department ?: 'N/A' }}</span>
            </div>
        </div>

        <div class="details-box">
            <h3>Override Reason</h3>
            <p>{{ $overrideRequest->reason }}</p>
        </div>

        @if($overrideRequest->changes)
        <div class="details-box">
            <h3>Proposed Changes</h3>
            @php
                $changes = json_decode($overrideRequest->changes, true);
            @endphp
            @if($changes)
                @foreach($changes as $field => $value)
                    <div class="detail-row">
                        <span class="label">{{ ucfirst(str_replace('_', ' ', $field)) }}:</span>
                        <span class="value">{{ $value }}</span>
                    </div>
                @endforeach
            @endif
        </div>
        @endif

        <div style="text-align: center; margin-top: 30px;">
            <p><strong>Please log in to the IGCFMS admin panel to review this request.</strong></p>
            <a href="{{ config('app.frontend_url', 'http://localhost:3000') }}/login?redirect=/admin/override-transactions" class="btn">
                Login to Review Request
            </a>
        </div>
    </div>

    <div class="footer">
        <p>This is an automated notification from IGCFMS</p>
        <p>© {{ date('Y') }} Integrated Government Cash Flow Management System</p>
    </div>
</body>
</html>
