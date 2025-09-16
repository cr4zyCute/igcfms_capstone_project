<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AdminController;

// Authentication routes
Route::post('/login', [AuthController::class, 'login']);
Route::middleware('auth:sanctum')->post('/logout', [AuthController::class, 'logout']);

// Test routes
Route::get('/test', function () {
    return response()->json(['message' => 'API working!']);
});

Route::get('/health', function () {
    return response()->json(['status' => 'healthy']);
});
Route::post('/register', [AuthController::class, 'register'])->withoutMiddleware('auth:sanctum');
Route::prefix('admin')->group(function () {
    Route::get('/approve/{id}', [AdminController::class, 'approve']);
    Route::get('/reject/{id}', [AdminController::class, 'reject']);
});
