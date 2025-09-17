<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OverrideRequest extends Model
{
    protected $fillable = [
        'transaction_id',
        'requested_by',
        'reason',
        'changes',
        'status',
        'reviewed_by',
        'review_notes'
    ];

    public function transaction()
    {
        return $this->belongsTo(Transaction::class, 'transaction_id');
    }

    public function requester()
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
