<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

Route::post('/login', [AuthController::class, 'login']);
Route::middleware('auth:sanctum')->post('/logout', [AuthController::class, 'logout']);

// Test routes
Route::get('/test', function () {
    return response()->json(['message' => 'API working!']);
});

Route::get('/health', function () {
    return response()->json(['status' => 'healthy']);
});
