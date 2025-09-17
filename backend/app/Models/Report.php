<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Report extends Model
{
    use HasFactory;

    protected $fillable = [
        'report_type',
        'generated_by',
        'file_path',
        'generated_at',
    ];

    public $timestamps = false;

    // Remove the duplicate relationship and keep only one
    public function generatedBy()
    {
        return $this->belongsTo(User::class, 'generated_by');
    }
}
