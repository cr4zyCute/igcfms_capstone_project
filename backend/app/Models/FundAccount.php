<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;


class FundAccount extends Model
{
    use SoftDeletes;
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

    /**
     * Get the next available account code for a given account type
     * This method includes soft-deleted records to avoid code reuse
     */
    public static function getNextAccountCode($accountType)
    {
        // Define prefixes for each account type
        $prefixes = [
            'Revenue' => 'REV',
            'Expense' => 'EXP',
            'Asset' => 'AST',
            'Liability' => 'LIB',
            'Equity' => 'EQT'
        ];

        $prefix = $prefixes[$accountType] ?? 'GEN';
        
        // Get the highest number from ALL accounts (including soft-deleted) with this prefix
        $maxCode = self::withTrashed()
            ->where('code', 'like', $prefix . '%')
            ->get()
            ->map(function ($account) use ($prefix) {
                // Extract the numeric part from the code
                $numericPart = substr($account->code, strlen($prefix));
                return (int) $numericPart;
            })
            ->max();

        // If no accounts exist with this prefix, start with 1
        // Otherwise, increment the highest number found
        $newNumber = $maxCode ? $maxCode + 1 : 1;

        // Format with leading zeros (e.g., REV001, EXP002)
        return $prefix . str_pad($newNumber, 3, '0', STR_PAD_LEFT);
    }

    /**
     * Scope to get all accounts including soft-deleted for admin purposes
     */
    public function scopeWithDeleted($query)
    {
        return $query->withTrashed();
    }
}
