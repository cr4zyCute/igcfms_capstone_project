<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Disbursement extends Model
{
    use HasFactory;

    protected $fillable = [
        'transaction_id',
        'payee_name',
        'method',
        'cheque_number',
        'bank_name',
        'account_number',
        'amount',
        'issue_date',
        'memo',
        'fund_account_id',
        'issued_by',
        'issued_at',
        'status',
        'reconciled',
        'reconciled_at',
    ];

    protected $casts = [
        'issued_at' => 'datetime',
        'issue_date' => 'date',
        'amount' => 'decimal:2',
        'reconciled' => 'boolean',
        'reconciled_at' => 'datetime',
    ];

    // Enable timestamps since we'll add them in migration
    public $timestamps = true;

    // Relationship with Transaction
    public function transaction()
    {
        return $this->belongsTo(Transaction::class);
    }

    // Relationship with Fund Account
    public function fundAccount()
    {
        return $this->belongsTo(FundAccount::class);
    }

    // Relationship with User (issued by)
    public function issuedBy()
    {
        return $this->belongsTo(User::class, 'issued_by');
    }
}
