<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    protected $fillable = [
        'type',
        'amount',
        'description',
        'recipient',
        'recipient_account_id',
        'purpose',
        'department',
        'category',
        'reference',
        'receipt_no',
        'reference_no',
        'fund_account_id',
        'mode_of_payment',
        'created_by',
        'approved_by'
    ];

    public function fundAccount()
    {
        return $this->belongsTo(FundAccount::class, 'fund_account_id');
    }

    public function recipientAccount()
    {
        return $this->belongsTo(RecipientAccount::class, 'recipient_account_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
