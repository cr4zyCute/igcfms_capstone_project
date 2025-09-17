<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FundAccount extends Model
{
    protected $fillable = [
        'name',
        'code',
        'description',
        'initial_balance',
        'current_balance',
        'account_type',
        'department',
        'is_active',
        'created_by'
    ];

    public function transactions()
    {
        return $this->hasMany(Transaction::class, 'fund_account_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
