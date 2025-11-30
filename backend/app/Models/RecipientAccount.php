<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RecipientAccount extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'type',
        'contact_person',
        'email',
        'phone',
        'address',
        'id_number',
        'bank_account',
        'bank_name',
        'account_number',
        'account_type',
        'fund_code',
        'description',
        'fund_account_id',
        'status',
        'total_transactions',
        'total_amount'
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'total_transactions' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Get the fund account associated with this recipient (for collection types)
     */
    public function fundAccount(): BelongsTo
    {
        return $this->belongsTo(FundAccount::class);
    }

    /**
     * Scope for disbursement recipients
     */
    public function scopeDisbursement($query)
    {
        return $query->where('type', 'disbursement');
    }

    /**
     * Scope for collection recipients
     */
    public function scopeCollection($query)
    {
        return $query->where('type', 'collection');
    }

    /**
     * Scope for active recipients
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Update transaction statistics
     */
    public function updateTransactionStats($amount)
    {
        $this->increment('total_transactions');
        $this->increment('total_amount', $amount);
    }

    /**
     * Get display name based on type
     */
    public function getDisplayNameAttribute()
    {
        return $this->name;
    }

    /**
     * Get formatted total amount
     */
    public function getFormattedTotalAmountAttribute()
    {
        return '₱' . number_format($this->total_amount, 2);
    }
}
