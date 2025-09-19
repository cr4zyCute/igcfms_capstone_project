<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use App\Models\ActivityLog;

class ActivityNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public $activityLog;

    public function __construct(ActivityLog $activityLog)
    {
        $this->activityLog = $activityLog;
    }

    public function build()
    {
        $subject = $this->getEmailSubject();
        
        return $this->subject($subject)
                    ->view('emails.activity-notification')
                    ->with([
                        'activityLog' => $this->activityLog,
                        'activityTitle' => $this->getActivityTitle(),
                        'priorityLevel' => $this->getPriorityLevel(),
                        'actionRequired' => $this->isActionRequired(),
                    ]);
    }

    private function getEmailSubject()
    {
        $subjects = [
            ActivityLog::ACTIVITY_LOGIN => 'User Login - IGCFMS',
            ActivityLog::ACTIVITY_LOGIN_FAILED => 'SECURITY ALERT: Failed Login Attempt - IGCFMS',
            ActivityLog::ACTIVITY_LOGOUT => 'User Logout - IGCFMS',
            ActivityLog::ACTIVITY_COLLECTION => 'New Collection Transaction - IGCFMS',
            ActivityLog::ACTIVITY_DISBURSEMENT => 'New Disbursement Transaction - IGCFMS',
            ActivityLog::ACTIVITY_OVERRIDE_REQUEST => 'URGENT: Override Request Submitted - IGCFMS',
            ActivityLog::ACTIVITY_OVERRIDE_APPROVED => 'Override Request Approved - IGCFMS',
            ActivityLog::ACTIVITY_OVERRIDE_REJECTED => 'Override Request Rejected - IGCFMS',
            ActivityLog::ACTIVITY_FUND_ACCOUNT_CREATED => 'Fund Account Created - IGCFMS',
            ActivityLog::ACTIVITY_FUND_ACCOUNT_UPDATED => 'Fund Account Updated - IGCFMS',
            ActivityLog::ACTIVITY_REPORT_GENERATED => 'Report Generated - IGCFMS',
            ActivityLog::ACTIVITY_USER_CREATED => 'New User Created - IGCFMS',
            ActivityLog::ACTIVITY_USER_UPDATED => 'User Updated - IGCFMS',
            ActivityLog::ACTIVITY_RECEIPT_ISSUED => 'Receipt Issued - IGCFMS',
            ActivityLog::ACTIVITY_CHEQUE_ISSUED => 'Cheque Issued - IGCFMS',
        ];

        return $subjects[$this->activityLog->activity_type] ?? 'System Activity - IGCFMS';
    }

    private function getActivityTitle()
    {
        $titles = [
            ActivityLog::ACTIVITY_LOGIN => '🔐 User Login Activity',
            ActivityLog::ACTIVITY_LOGIN_FAILED => '⚠️ Security Alert - Failed Login',
            ActivityLog::ACTIVITY_LOGOUT => '🚪 User Logout Activity',
            ActivityLog::ACTIVITY_COLLECTION => '💰 Collection Transaction',
            ActivityLog::ACTIVITY_DISBURSEMENT => '💸 Disbursement Transaction',
            ActivityLog::ACTIVITY_OVERRIDE_REQUEST => '🔄 Override Request (Action Required)',
            ActivityLog::ACTIVITY_OVERRIDE_APPROVED => '✅ Override Approved',
            ActivityLog::ACTIVITY_OVERRIDE_REJECTED => '❌ Override Rejected',
            ActivityLog::ACTIVITY_FUND_ACCOUNT_CREATED => '🏦 Fund Account Created',
            ActivityLog::ACTIVITY_FUND_ACCOUNT_UPDATED => '🏦 Fund Account Updated',
            ActivityLog::ACTIVITY_REPORT_GENERATED => '📊 Report Generated',
            ActivityLog::ACTIVITY_USER_CREATED => '👤 New User Created',
            ActivityLog::ACTIVITY_USER_UPDATED => '👤 User Updated',
            ActivityLog::ACTIVITY_RECEIPT_ISSUED => '🧾 Receipt Issued',
            ActivityLog::ACTIVITY_CHEQUE_ISSUED => '💳 Cheque Issued',
        ];

        return $titles[$this->activityLog->activity_type] ?? '📋 System Activity';
    }

    private function getPriorityLevel()
    {
        $highPriority = [
            ActivityLog::ACTIVITY_LOGIN_FAILED,
            ActivityLog::ACTIVITY_OVERRIDE_REQUEST,
            ActivityLog::ACTIVITY_USER_CREATED,
        ];

        $mediumPriority = [
            ActivityLog::ACTIVITY_LOGIN,
            ActivityLog::ACTIVITY_COLLECTION,
            ActivityLog::ACTIVITY_DISBURSEMENT,
            ActivityLog::ACTIVITY_OVERRIDE_APPROVED,
            ActivityLog::ACTIVITY_OVERRIDE_REJECTED,
        ];

        if (in_array($this->activityLog->activity_type, $highPriority)) {
            return 'HIGH';
        } elseif (in_array($this->activityLog->activity_type, $mediumPriority)) {
            return 'MEDIUM';
        }

        return 'LOW';
    }

    private function isActionRequired()
    {
        return in_array($this->activityLog->activity_type, [
            ActivityLog::ACTIVITY_LOGIN_FAILED,
            ActivityLog::ACTIVITY_OVERRIDE_REQUEST,
        ]);
    }
}
