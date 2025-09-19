<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $activityTitle }} - IGCFMS</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
            font-size: 14px;
        }
        .priority-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            margin-top: 10px;
        }
        .priority-high {
            background-color: #dc2626;
            color: white;
        }
        .priority-medium {
            background-color: #f59e0b;
            color: white;
        }
        .priority-low {
            background-color: #10b981;
            color: white;
        }
        .content {
            padding: 30px;
        }
        .activity-summary {
            background-color: #f8fafc;
            border-left: 4px solid #3b82f6;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
        }
        .activity-summary h3 {
            margin: 0 0 10px 0;
            color: #1e40af;
            font-size: 18px;
        }
        .activity-summary p {
            margin: 0;
            font-size: 16px;
            color: #374151;
        }
        .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 20px 0;
        }
        .detail-item {
            background-color: #f9fafb;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
        }
        .detail-label {
            font-weight: 600;
            color: #374151;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
        }
        .detail-value {
            color: #1f2937;
            font-size: 14px;
            word-break: break-word;
        }
        .action-required {
            background-color: #fef2f2;
            border: 2px solid #fca5a5;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
        }
        .action-required h4 {
            color: #dc2626;
            margin: 0 0 10px 0;
            font-size: 16px;
        }
        .action-required p {
            color: #991b1b;
            margin: 0;
        }
        .btn {
            display: inline-block;
            padding: 12px 24px;
            background-color: #3b82f6;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            margin: 10px 5px;
            transition: background-color 0.3s;
        }
        .btn:hover {
            background-color: #2563eb;
        }
        .btn-danger {
            background-color: #dc2626;
        }
        .btn-danger:hover {
            background-color: #b91c1c;
        }
        .footer {
            background-color: #f8fafc;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 12px;
        }
        .timestamp {
            color: #6b7280;
            font-size: 12px;
            font-style: italic;
        }
        @media (max-width: 600px) {
            .details-grid {
                grid-template-columns: 1fr;
                gap: 10px;
            }
            .header {
                padding: 20px;
            }
            .content {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{ $activityTitle }}</h1>
            <p>Integrated Government Cash Flow Management System</p>
            <span class="priority-badge priority-{{ strtolower($priorityLevel) }}">
                {{ $priorityLevel }} PRIORITY
            </span>
        </div>

        <div class="content">
            @if($actionRequired)
            <div class="action-required">
                <h4>⚠️ IMMEDIATE ACTION REQUIRED</h4>
                <p>This activity requires your immediate attention and review.</p>
            </div>
            @endif

            <div class="activity-summary">
                <h3>Activity Summary</h3>
                <p>{{ $activityLog->activity_description }}</p>
                <div class="timestamp">
                    {{ $activityLog->created_at->format('F j, Y \a\t g:i A') }}
                </div>
            </div>

            <div class="details-grid">
                <div class="detail-item">
                    <div class="detail-label">User</div>
                    <div class="detail-value">{{ $activityLog->user_name }}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Role</div>
                    <div class="detail-value">{{ $activityLog->user_role }}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Activity Type</div>
                    <div class="detail-value">{{ ucwords(str_replace('_', ' ', $activityLog->activity_type)) }}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">IP Address</div>
                    <div class="detail-value">{{ $activityLog->ip_address ?? 'Unknown' }}</div>
                </div>
            </div>

            @if($activityLog->details && count($activityLog->details) > 0)
            <h4 style="color: #374151; margin: 30px 0 15px 0;">Additional Details</h4>
            <div class="details-grid">
                @foreach($activityLog->details as $key => $value)
                    @if(!in_array($key, ['user_agent', 'session_id']) && $value)
                    <div class="detail-item">
                        <div class="detail-label">{{ ucwords(str_replace('_', ' ', $key)) }}</div>
                        <div class="detail-value">
                            @if(is_array($value))
                                {{ json_encode($value, JSON_PRETTY_PRINT) }}
                            @elseif(is_numeric($value) && $key === 'amount')
                                ₱{{ number_format($value, 2) }}
                            @else
                                {{ $value }}
                            @endif
                        </div>
                    </div>
                    @endif
                @endforeach
            </div>
            @endif

            <div style="text-align: center; margin-top: 30px;">
                @if($actionRequired)
                    <a href="{{ config('app.frontend_url', 'http://localhost:3000') }}/login?redirect=/admin/dashboard" class="btn btn-danger">
                        🚨 Review Immediately
                    </a>
                @else
                    <a href="{{ config('app.frontend_url', 'http://localhost:3000') }}/login?redirect=/admin/dashboard" class="btn">
                        📊 View Dashboard
                    </a>
                @endif
            </div>

            @if($activityLog->activity_type === 'login_failed')
            <div style="background-color: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 15px; margin-top: 20px;">
                <h4 style="color: #dc2626; margin: 0 0 10px 0;">🔒 Security Recommendations</h4>
                <ul style="color: #991b1b; margin: 0; padding-left: 20px;">
                    <li>Monitor for repeated failed attempts from this IP</li>
                    <li>Consider implementing IP blocking if suspicious</li>
                    <li>Review user account security settings</li>
                    <li>Check for any unusual system access patterns</li>
                </ul>
            </div>
            @endif

            @if(in_array($activityLog->activity_type, ['collection_created', 'disbursement_created']))
            <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 15px; margin-top: 20px;">
                <h4 style="color: #0369a1; margin: 0 0 10px 0;">💼 Transaction Information</h4>
                <p style="color: #0c4a6e; margin: 0;">
                    This {{ strtolower(str_replace('_created', '', $activityLog->activity_type)) }} has been recorded in the system. 
                    Please review the transaction details and ensure all documentation is properly filed.
                </p>
            </div>
            @endif
        </div>

        <div class="footer">
            <p><strong>This is an automated notification from IGCFMS</strong></p>
            <p>© {{ date('Y') }} Integrated Government Cash Flow Management System</p>
            <p>For technical support, contact your system administrator</p>
        </div>
    </div>
</body>
</html>
