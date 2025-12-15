<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PasswordResetRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'email',
        'temporary_password',
        'status',
        'approved_at',
        'used_at',
    ];

    protected $casts = [
        'approved_at' => 'datetime',
        'used_at' => 'datetime',
    ];

    /**
     * Get the user that owns this password reset request
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if request is pending approval
     */
    public function isPending()
    {
        return $this->status === 'pending';
    }

    /**
     * Check if request is approved
     */
    public function isApproved()
    {
        return $this->status === 'approved';
    }

    /**
     * Check if request has been used
     */
    public function isUsed()
    {
        return $this->status === 'used';
    }

    /**
     * Generate a temporary password
     */
    public static function generateTemporaryPassword()
    {
        return strtoupper(substr(md5(uniqid()), 0, 8));
    }
}
