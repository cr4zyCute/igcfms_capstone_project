<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RegistrationRequest extends Model
{
    use HasFactory;

    protected $table = 'registration_requests';

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'status',
        'rejection_reason',
        'approved_at',
        'approved_by'
    ];

    protected $casts = [
        'approved_at' => 'datetime',
    ];
}
