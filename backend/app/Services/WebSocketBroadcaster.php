<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WebSocketBroadcaster
{
    private $wsServerUrl;

    public function __construct()
    {
        $this->wsServerUrl = env('WS_SERVER_URL', 'http://localhost:8000');
    }

    /**
     * Broadcast message to specific user
     */
    public function broadcastToUser($userId, $type, $data = [])
    {
        try {
            $payload = [
                'type' => $type,
                'userId' => $userId,
                'data' => $data,
                'timestamp' => now()->toIso8601String(),
            ];

            // Send to WebSocket server via HTTP endpoint
            Http::post("{$this->wsServerUrl}/broadcast/user/{$userId}", $payload);
            
            Log::info("WebSocket broadcast to user {$userId}: {$type}");
        } catch (\Exception $e) {
            Log::error("WebSocket broadcast failed: " . $e->getMessage());
        }
    }

    /**
     * Broadcast message to all users
     */
    public function broadcastToAll($type, $data = [])
    {
        try {
            $payload = [
                'type' => $type,
                'data' => $data,
                'timestamp' => now()->toIso8601String(),
            ];

            Http::post("{$this->wsServerUrl}/broadcast/all", $payload);
            
            Log::info("WebSocket broadcast to all: {$type}");
        } catch (\Exception $e) {
            Log::error("WebSocket broadcast failed: " . $e->getMessage());
        }
    }

    /**
     * Broadcast message to users by role
     */
    public function broadcastToRole($role, $type, $data = [])
    {
        try {
            $payload = [
                'type' => $type,
                'role' => $role,
                'data' => $data,
                'timestamp' => now()->toIso8601String(),
            ];

            Http::post("{$this->wsServerUrl}/broadcast/role/{$role}", $payload);
            
            Log::info("WebSocket broadcast to {$role}: {$type}");
        } catch (\Exception $e) {
            Log::error("WebSocket broadcast failed: " . $e->getMessage());
        }
    }

    /**
     * Broadcast notification created event
     */
    public function notificationCreated($userId, $notification)
    {
        $this->broadcastToUser($userId, 'notification_created', [
            'id' => $notification->id,
            'type' => $notification->type,
            'title' => $notification->title,
            'message' => $notification->message,
            'is_read' => $notification->is_read,
            'created_at' => $notification->created_at,
        ]);
    }

    /**
     * Broadcast transaction created event
     */
    public function transactionCreated($transaction)
    {
        // Broadcast to all users (they may need to see it)
        $this->broadcastToAll('transaction_created', [
            'id' => $transaction->id,
            'type' => $transaction->type,
            'amount' => $transaction->amount,
            'description' => $transaction->description,
            'created_at' => $transaction->created_at,
        ]);
    }

    /**
     * Broadcast disbursement created event
     */
    public function disbursementCreated($disbursement)
    {
        $this->broadcastToAll('disbursement_created', [
            'id' => $disbursement->id,
            'amount' => $disbursement->amount,
            'status' => $disbursement->status,
            'created_at' => $disbursement->created_at,
        ]);
    }

    /**
     * Broadcast receipt created event
     */
    public function receiptCreated($receipt)
    {
        $this->broadcastToAll('receipt_created', [
            'id' => $receipt->id,
            'receipt_number' => $receipt->receipt_number,
            'amount' => $receipt->amount,
            'created_at' => $receipt->created_at,
        ]);
    }

    /**
     * Broadcast override request event
     */
    public function overrideRequestCreated($overrideRequest)
    {
        $this->broadcastToAll('override_request_created', [
            'id' => $overrideRequest->id,
            'transaction_id' => $overrideRequest->transaction_id,
            'status' => $overrideRequest->status,
            'created_at' => $overrideRequest->created_at,
        ]);
    }

    /**
     * Broadcast fund account updated event
     */
    public function fundAccountUpdated($fundAccount)
    {
        $this->broadcastToAll('fund_account_updated', [
            'id' => $fundAccount->id,
            'name' => $fundAccount->name,
            'balance' => $fundAccount->balance,
            'updated_at' => $fundAccount->updated_at,
        ]);
    }
}
