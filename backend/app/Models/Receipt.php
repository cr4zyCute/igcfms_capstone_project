<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Receipt extends Model
{
    protected $fillable = [
        'transaction_id',
        'payer_name',
        'receipt_number',
        'issued_at',
    ];

    // Disable Laravel's automatic timestamps since we only have issued_at
    public $timestamps = false;

    protected $casts = [
        'issued_at' => 'datetime',
    ];

    public function transaction()
    {
        return $this->belongsTo(Transaction::class);
    }
}
