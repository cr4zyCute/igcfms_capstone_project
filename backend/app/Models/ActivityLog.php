<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'user_name',
        'user_role',
        'activity_type',
        'activity_description',
        'ip_address',
        'user_agent',
        'details',
        'created_at',
    ];

    public $timestamps = false;

    protected $casts = [
        'details' => 'array',
        'created_at' => 'datetime',
    ];

    // Relationship with User
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Activity types constants
    const ACTIVITY_LOGIN = 'login';
    const ACTIVITY_LOGIN_FAILED = 'login_failed';
    const ACTIVITY_LOGOUT = 'logout';
    const ACTIVITY_COLLECTION = 'collection_created';
    const ACTIVITY_DISBURSEMENT = 'disbursement_created';
    const ACTIVITY_OVERRIDE_REQUEST = 'override_requested';
    const ACTIVITY_OVERRIDE_APPROVED = 'override_approved';
    const ACTIVITY_OVERRIDE_REJECTED = 'override_rejected';
    const ACTIVITY_FUND_ACCOUNT_CREATED = 'fund_account_created';
    const ACTIVITY_FUND_ACCOUNT_UPDATED = 'fund_account_updated';
    const ACTIVITY_REPORT_GENERATED = 'report_generated';
    const ACTIVITY_USER_CREATED = 'user_created';
    const ACTIVITY_USER_UPDATED = 'user_updated';
    const ACTIVITY_RECEIPT_ISSUED = 'receipt_issued';
    const ACTIVITY_CHEQUE_ISSUED = 'cheque_issued';

    // Scope for recent activities
    public function scopeRecent($query, $days = 7)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    // Scope for specific user role
    public function scopeByRole($query, $role)
    {
        return $query->where('user_role', $role);
    }

    // Scope for specific activity type
    public function scopeByType($query, $type)
    {
        return $query->where('activity_type', $type);
    }
}
