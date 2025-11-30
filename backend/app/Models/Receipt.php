<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Receipt extends Model
{
    protected $fillable = [
        'transaction_id',
        'payer_name',
        'receipt_number',
        'issued_at',
        'status',
        'cancellation_reason',
        'cancelled_at',
        'cancelled_by',
    ];

    // Disable Laravel's automatic timestamps since we only have issued_at
    public $timestamps = false;

    protected $casts = [
        'issued_at' => 'datetime',
        'cancelled_at' => 'datetime',
    ];

    public function transaction()
    {
        return $this->belongsTo(Transaction::class);
    }

    public function cancelledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cancelled_by');
    }

    public function parentReceipt(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_receipt_id');
    }
}
