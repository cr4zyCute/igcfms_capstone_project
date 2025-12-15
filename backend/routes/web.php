<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PasswordResetController;

Route::get('/', function () {
    return view('welcome');
});

// Password reset approval routes (accessible via web)
Route::get('/admin/password-reset/{id}/approve', [PasswordResetController::class, 'approveReset'])->name('password.approve');
Route::get('/admin/password-reset/{id}/reject', [PasswordResetController::class, 'rejectReset'])->name('password.reject');
