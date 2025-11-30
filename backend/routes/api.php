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
use App\Http\Controllers\CashierController;
use App\Http\Controllers\DisbursementController;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\RecipientAccountController;
use App\Http\Controllers\SystemSettingsController;

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

        // User profile routes
        Route::get('/user/profile', [UserController::class, 'getProfile']);
        Route::put('/user/profile', [UserController::class, 'updateProfile']);

        // System settings routes
        Route::get('/system/settings', [SystemSettingsController::class, 'index']);
        Route::put('/system/settings', [SystemSettingsController::class, 'update']);
        Route::get('/system/settings/{key}', [SystemSettingsController::class, 'getSetting']);
        Route::put('/system/settings/{key}', [SystemSettingsController::class, 'updateSetting']);
});
//Fund Accouts routes
Route::middleware('auth:sanctum')->group(function () {
    //funds
    Route::get('/fund-accounts', [FundAccountController::class, 'index']);
    Route::get('/fund-accounts/{id}', [FundAccountController::class, 'show']);
    Route::post('/fund-accounts', [FundAccountController::class, 'store']);
    Route::put('/fund-accounts/{id}/balance', [FundAccountController::class, 'updateBalance']);
    //transaction
    Route::get('/transactions', [TransactionController::class, 'index']);
    Route::post('/transactions', [TransactionController::class, 'store']);
    //reports
    Route::get('/reports', [ReportsController::class, 'index']);
    Route::post('/reports', [ReportsController::class, 'store']);
    //receipt
    Route::get('/receipts', [ReceiptController::class, 'index']);
    Route::post('/receipts', [ReceiptController::class, 'store']);
    Route::put('/receipts/{id}', [ReceiptController::class, 'update']);
    Route::post('/receipts/{id}/cancel', [ReceiptController::class, 'cancel']);
    Route::delete('/receipts/{id}', [ReceiptController::class, 'destroy']);
    //disbursements/cheques
    Route::get('/disbursements', [DisbursementController::class, 'index']);
    Route::post('/disbursements', [DisbursementController::class, 'store']);
    Route::put('/disbursements/{id}', [DisbursementController::class, 'update']);
    Route::patch('/disbursements/{id}', [DisbursementController::class, 'update']);
    Route::get('/cheques', [DisbursementController::class, 'cheques']);
    Route::patch('/cheques/{id}', [DisbursementController::class, 'update']);
    Route::put('/cheques/{id}', [DisbursementController::class, 'update']);
    Route::get('/disbursements/{id}', [DisbursementController::class, 'show']);
    //audit logs
    Route::get('/audit-logs', [AuditLogController::class, 'index']);
    Route::post('/audit-logs', [AuditLogController::class, 'store']);
    //notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::put('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'getUnreadCount']);
    //activity logs
    Route::get('/activity-logs', [ActivityLogController::class, 'index']);
    Route::get('/activity-logs/recent', [ActivityLogController::class, 'recent']);
    Route::get('/activity-logs/statistics', [ActivityLogController::class, 'statistics']);
    Route::get('/activity-logs/user/{userId}', [ActivityLogController::class, 'userActivities']);
    Route::post('/activity-logs', [ActivityLogController::class, 'store']);
});
Route::middleware('auth:sanctum')->group(function () {
    // Admin: list all override requests
    Route::get('/override_requests', [OverrideRequestController::class, 'index']);
    Route::get('/override-requests', [OverrideRequestController::class, 'index']); // Alternative route with hyphen

    // Cashier: list only their override requests
    Route::get('/override_requests/my_requests', [OverrideRequestController::class, 'myRequests']);

    // Cashier: submit new override request
    Route::post('/transactions/override', [OverrideRequestController::class, 'store']);

    // Admin: review override request
    Route::put('/override_requests/{id}/review', [OverrideRequestController::class, 'review']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/dashboard/summary', [DashboardController::class, 'summary']);
    Route::get('/dashboard/daily-revenue', [DashboardController::class, 'dailyRevenue']);
    Route::get('/dashboard/fund-distribution', [DashboardController::class, 'fundDistribution']);
    Route::get('/dashboard/recent-logs', [DashboardController::class, 'recentLogs']);
    Route::get('/dashboard/recent-transactions', [DashboardController::class, 'recentTransactions']);
    Route::get('/dashboard/fund-performance', [DashboardController::class, 'fundPerformance']);
    Route::get('/dashboard/top-fund-accounts', [DashboardController::class, 'topFundAccounts']);
    Route::get('/dashboard/monthly-revenue', [DashboardController::class, 'monthlyRevenue']);
});
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/fund-accounts', [FundAccountController::class, 'index']);
    Route::get('/fund-accounts/{id}', [FundAccountController::class, 'show']);
    Route::post('/fund-accounts', [FundAccountController::class, 'store']);
    Route::put('/fund-accounts/{id}', [FundAccountController::class, 'update']);
    Route::delete('/fund-accounts/{id}', [FundAccountController::class, 'destroy']);

    // Debug route to view all accounts including soft-deleted ones
    Route::get('/fund-accounts-debug/all-with-deleted', [FundAccountController::class, 'getAllWithDeleted']);
});
// Remove duplicate route

// Get override requests
Route::get('/override_requests', [OverrideRequestController::class, 'index'])->middleware('auth:sanctum');

// Admin reviews request
Route::put('/override_requests/{id}/review', [OverrideRequestController::class, 'review'])->middleware('auth:sanctum');

// Recipient Account routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/recipient-accounts', [RecipientAccountController::class, 'index']);
    Route::post('/recipient-accounts', [RecipientAccountController::class, 'store']);
    Route::get('/recipient-accounts/{recipientAccount}', [RecipientAccountController::class, 'show']);
    Route::put('/recipient-accounts/{recipientAccount}', [RecipientAccountController::class, 'update']);
    Route::delete('/recipient-accounts/{recipientAccount}', [RecipientAccountController::class, 'destroy']);
    Route::patch('/recipient-accounts/{recipientAccount}/toggle-status', [RecipientAccountController::class, 'toggleStatus']);
    Route::get('/recipient-accounts/{recipientAccount}/transactions', [RecipientAccountController::class, 'getTransactions']);
    Route::get('/recipient-accounts-fund-accounts', [RecipientAccountController::class, 'getFundAccounts']);
    Route::get('/recipient-accounts-stats', [RecipientAccountController::class, 'getStats']);
});
