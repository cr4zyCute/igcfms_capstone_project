<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Receipt extends Model
{
    protected $fillable = [
        'transaction_id',
        'payer_name',
        'receipt_number',
    ];

    public function transaction()
    {
        return $this->belongsTo(Transaction::class);
    }
}
