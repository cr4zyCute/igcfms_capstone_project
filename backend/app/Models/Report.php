<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Report extends Model
{
    use HasFactory;

    protected $fillable = [
        'report_type',
        'date_from',
        'date_to',
        'department',
        'category',
        'include_transactions',
        'include_overrides',
        'format',
        'generated_by',
        'file_path',
        'file_size',
        'generated_at',
    ];

    public $timestamps = true;

    // Remove the duplicate relationship and keep only one
    public function generatedBy()
    {
        return $this->belongsTo(User::class, 'generated_by');
    }
}
