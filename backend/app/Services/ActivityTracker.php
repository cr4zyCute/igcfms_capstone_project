<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\User;
use App\Models\Notification;
use App\Mail\ActivityNotificationMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Http\Request;

class ActivityTracker
{
    /**
     * Log user activity and send notifications
     */
    public static function log($activityType, $description, $user = null, $details = [], Request $request = null)
    {
        try {
            // Get user information
            if (!$user) {
                $user = auth()->user();
            }

            // Get request information
            $ipAddress = $request ? $request->ip() : request()->ip();
            $userAgent = $request ? $request->userAgent() : request()->userAgent();

            // Create activity log
            $activityLog = ActivityLog::create([
                'user_id' => $user ? $user->id : null,
                'user_name' => $user ? $user->name : 'Unknown',
                'user_role' => $user ? $user->role : 'Unknown',
                'activity_type' => $activityType,
                'activity_description' => $description,
                'ip_address' => $ipAddress,
                'user_agent' => $userAgent,
                'details' => $details,
                'created_at' => now(),
            ]);

            // Create notification for all admin users
            self::createAdminNotifications($activityLog);

            // Send email notification to admin (queued for performance)
            self::sendEmailNotification($activityLog);

            return $activityLog;

        } catch (\Exception $e) {
            Log::error('Activity tracking failed: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Create notifications for all admin users
     */
    private static function createAdminNotifications($activityLog)
    {
        try {
            // Check if notifications table exists before trying to create notifications
            if (!\Schema::hasTable('notifications')) {
                Log::info('Notifications table does not exist, skipping notification creation');
                return;
            }

            // Only create notifications for Admin users
            $adminUsers = User::where('role', 'Admin')->get();
            
            // Decode details if stored as JSON string
            $details = $activityLog->details;
            if (is_string($details)) {
                $decoded = json_decode($details, true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $details = $decoded;
                } else {
                    $details = [];
                }
            }
            if (!is_array($details)) {
                $details = [];
            }

            foreach ($adminUsers as $admin) {
                Log::info("Creating notification for admin user", [
                    'admin_id' => $admin->id,
                    'admin_role' => $admin->role,
                    'activity_type' => $activityLog->activity_type,
                ]);
                
                Notification::create([
                    'user_id' => $admin->id,
                    'type' => 'user_activity',
                    'title' => self::getActivityTitle($activityLog),
                    'message' => $activityLog->activity_description,
                    'data' => array_merge([
                        'activity_id' => $activityLog->id,
                        'user_name' => $activityLog->user_name,
                        'user_role' => $activityLog->user_role,
                        'activity_type' => $activityLog->activity_type,
                        'ip_address' => $activityLog->ip_address,
                        'timestamp' => $activityLog->created_at->toISOString(),
                    ], $details),
                    'is_read' => false,
                    'created_at' => now(),
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Failed to create admin notifications: ' . $e->getMessage());
        }
    }

    /**
     * Send email notification to admin
     */
    private static function sendEmailNotification($activityLog)
    {
        try {
            // Queue the email instead of sending synchronously to avoid blocking
            Mail::to('igcfmsa@gmail.com')->queue(new ActivityNotificationMail($activityLog));
        } catch (\Exception $e) {
            Log::error('Failed to send activity email notification: ' . $e->getMessage());
        }
    }

    /**
     * Get activity title for notifications
     */
    private static function getActivityTitle($activityLog)
    {
        $titles = [
            ActivityLog::ACTIVITY_LOGIN => '🔐 User Login',
            ActivityLog::ACTIVITY_LOGIN_FAILED => '⚠️ Failed Login Attempt',
            ActivityLog::ACTIVITY_LOGOUT => '🚪 User Logout',
            ActivityLog::ACTIVITY_COLLECTION => '💰 New Collection',
            ActivityLog::ACTIVITY_DISBURSEMENT => '💸 New Disbursement',
            ActivityLog::ACTIVITY_OVERRIDE_REQUEST => '🔄 Override Request',
            ActivityLog::ACTIVITY_OVERRIDE_APPROVED => '✅ Override Approved',
            ActivityLog::ACTIVITY_OVERRIDE_REJECTED => '❌ Override Rejected',
            ActivityLog::ACTIVITY_FUND_ACCOUNT_CREATED => '🏦 Fund Account Created',
            // ActivityLog::ACTIVITY_FUND_ACCOUNT_UPDATED => '🏦 Fund Account Updated', // Commented out - redundant with collection/disbursement notifications
            ActivityLog::ACTIVITY_REPORT_GENERATED => '📊 Report Generated',
            ActivityLog::ACTIVITY_USER_CREATED => '👤 User Created',
            ActivityLog::ACTIVITY_USER_UPDATED => '👤 User Updated',
            ActivityLog::ACTIVITY_RECEIPT_ISSUED => '🧾 Receipt Issued',
            ActivityLog::ACTIVITY_CHEQUE_ISSUED => '💳 Cheque Issued',
        ];

        return $titles[$activityLog->activity_type] ?? '📋 System Activity';
    }

    /**
     * Track login activity
     */
    public static function trackLogin($user, Request $request)
    {
        self::log(
            ActivityLog::ACTIVITY_LOGIN,
            "{$user->name} ({$user->role}) logged into the system",
            $user,
            [
                'login_time' => now()->toISOString(),
                'session_id' => session()->getId(),
            ],
            $request
        );
    }

    /**
     * Track failed login attempt
     */
    public static function trackFailedLogin($email, Request $request)
    {
        self::log(
            ActivityLog::ACTIVITY_LOGIN_FAILED,
            "Failed login attempt for email: {$email}",
            null,
            [
                'email' => $email,
                'attempt_time' => now()->toISOString(),
            ],
            $request
        );
    }

    /**
     * Track logout activity
     */
    public static function trackLogout($user, Request $request)
    {
        self::log(
            ActivityLog::ACTIVITY_LOGOUT,
            "{$user->name} ({$user->role}) logged out of the system",
            $user,
            [
                'logout_time' => now()->toISOString(),
            ],
            $request
        );
    }

    /**
     * Track transaction creation
     */
    public static function trackTransaction($transaction, $user)
    {
        $activityType = $transaction->type === 'Collection' 
            ? ActivityLog::ACTIVITY_COLLECTION 
            : ActivityLog::ACTIVITY_DISBURSEMENT;

        self::log(
            $activityType,
            "{$user->name} ({$user->role}) created a {$transaction->type} transaction of ₱" . number_format($transaction->amount, 2),
            $user,
            [
                'transaction_id' => $transaction->id,
                'transaction_type' => $transaction->type,
                'amount' => $transaction->amount,
                'receipt_no' => $transaction->receipt_no,
                'reference_no' => $transaction->reference_no,
                'fund_account_id' => $transaction->fund_account_id,
                'department' => $transaction->department,
                'category' => $transaction->category,
            ]
        );
    }

    /**
     * Track override request
     */
    public static function trackOverrideRequest($overrideRequest, $user)
    {
        self::log(
            ActivityLog::ACTIVITY_OVERRIDE_REQUEST,
            "{$user->name} ({$user->role}) submitted an override request for transaction #{$overrideRequest->transaction_id}",
            $user,
            [
                'override_request_id' => $overrideRequest->id,
                'transaction_id' => $overrideRequest->transaction_id,
                'reason' => $overrideRequest->reason,
            ]
        );
    }

    /**
     * Track override review
     */
    public static function trackOverrideReview($overrideRequest, $user, $status)
    {
        $activityType = $status === 'approved' 
            ? ActivityLog::ACTIVITY_OVERRIDE_APPROVED 
            : ActivityLog::ACTIVITY_OVERRIDE_REJECTED;

        self::log(
            $activityType,
            "{$user->name} ({$user->role}) {$status} override request #{$overrideRequest->id}",
            $user,
            [
                'override_request_id' => $overrideRequest->id,
                'transaction_id' => $overrideRequest->transaction_id,
                'status' => $status,
                'review_notes' => $overrideRequest->review_notes,
            ]
        );
    }

    /**
     * Track fund account operations
     */
    public static function trackFundAccount($fundAccount, $user, $action = 'created', $skipNotification = false)
    {
        $activityType = $action === 'created' 
            ? ActivityLog::ACTIVITY_FUND_ACCOUNT_CREATED 
            : ActivityLog::ACTIVITY_FUND_ACCOUNT_UPDATED;

        // Skip logging if this is just a balance update from a transaction (to avoid redundant notifications)
        if ($skipNotification && $action === 'updated') {
            return;
        }

        self::log(
            $activityType,
            "{$user->name} ({$user->role}) {$action} fund account: {$fundAccount->name}",
            $user,
            [
                'fund_account_id' => $fundAccount->id,
                'account_name' => $fundAccount->name,
                'account_code' => $fundAccount->code,
                'account_type' => $fundAccount->account_type,
                'action' => $action,
            ]
        );
    }

    /**
     * Track report generation
     */
    public static function trackReportGeneration($reportType, $user, $details = [])
    {
        self::log(
            ActivityLog::ACTIVITY_REPORT_GENERATED,
            "{$user->name} ({$user->role}) generated a {$reportType} report",
            $user,
            array_merge([
                'report_type' => $reportType,
                'generated_at' => now()->toISOString(),
            ], $details)
        );
    }

    /**
     * Track user management
     */
    public static function trackUserManagement($targetUser, $user, $action = 'created')
    {
        $activityType = $action === 'created' 
            ? ActivityLog::ACTIVITY_USER_CREATED 
            : ActivityLog::ACTIVITY_USER_UPDATED;

        self::log(
            $activityType,
            "{$user->name} ({$user->role}) {$action} user: {$targetUser->name} ({$targetUser->role})",
            $user,
            [
                'target_user_id' => $targetUser->id,
                'target_user_name' => $targetUser->name,
                'target_user_role' => $targetUser->role,
                'action' => $action,
            ]
        );
    }
}
