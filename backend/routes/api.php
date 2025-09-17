<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\FundAccountController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\OverrideRequestController;
use App\Http\Controllers\ReportsController;
use App\Http\Controllers\ReceiptController;
use App\Http\Controllers\DashboardController;

// Authentication routes
Route::post('/login', [AuthController::class, 'login']);
Route::middleware('auth:sanctum')->post('/logout', [AuthController::class, 'logout']);

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
//user routes 
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::patch('/users/{id}/toggle-status', [UserController::class, 'toggleStatus']);
});
//Fund Accouts routes
Route::middleware('auth:sanctum')->group(function () {
    //funds
    Route::get('/fund-accounts', [FundAccountController::class, 'index']);
    Route::get('/fund-accounts/{id}', [FundAccountController::class, 'show']);
    Route::post('/fund-accounts', [FundAccountController::class, 'store']);
    //transaction
    Route::get('/transactions', [TransactionController::class, 'index']);
    Route::post('/transactions', [TransactionController::class, 'store']);
    Route::post('/transactions/override', [TransactionController::class, 'requestOverride']);
    //reports
    Route::get('/reports', [ReportsController::class, 'index']);
    Route::post('/reports', [ReportsController::class, 'store']);
    //receipt
    Route::post('/receipts', [ReceiptController::class, 'store']);
});
Route::middleware('auth:sanctum')->group(function () {
    // Admin: list all override requests
    Route::get('/override_requests', [OverrideRequestController::class, 'index']);

    // Cashier: list only their override requests
    Route::get('/override_requests/my_requests', [OverrideRequestController::class, 'myRequests']);

    // Cashier: submit new override request
    Route::post('/transactions/override', [TransactionController::class, 'requestOverride']);

    // Admin: review override request
    Route::put('/override_requests/{id}/review', [OverrideRequestController::class, 'review']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/dashboard/summary', [DashboardController::class, 'summary']);
    Route::get('/dashboard/daily-revenue', [DashboardController::class, 'dailyRevenue']);
    Route::get('/dashboard/fund-distribution', [DashboardController::class, 'fundDistribution']);
    Route::get('/dashboard/recent-logs', [DashboardController::class, 'recentLogs']);
});
