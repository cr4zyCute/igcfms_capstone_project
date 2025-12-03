<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\OverrideRequest;
use App\Models\Transaction;
use App\Models\Receipt;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use App\Services\ActivityTracker;
use App\Mail\OverrideRequestNotificationMail;
use App\Mail\OverrideRequestReviewedMail;
use App\Http\Controllers\NotificationController;

class OverrideRequestController extends Controller
{
    // Admin: List all override requests
    public function index()
    {
        $requests = OverrideRequest::with('transaction', 'requestedBy', 'reviewedBy')->get();
        return response()->json($requests);
    }

    // Cashier: List only their own requests
    public function myRequests()
    {
        $userId = Auth::id();
        $requests = OverrideRequest::where('requested_by', $userId)
            ->with('transaction', 'reviewedBy')
            ->get();
        return response()->json($requests);
    }

    // Cashier: Submit new override request
    public function store(Request $request)
    {
        $request->validate([
            'transaction_id' => 'required|exists:transactions,id',
            'reason' => 'required|string',
            'changes' => 'required|array', // proposed changes
        ]);

        $overrideRequest = OverrideRequest::create([
            'transaction_id' => $request->transaction_id,
            'requested_by' => Auth::id(),
            'reason' => $request->reason,
            'changes' => json_encode($request->changes),
            'status' => 'pending',
        ]);

        // Load relationships for email
        $overrideRequest->load('transaction', 'requestedBy');

        // Send email notification to admin
        try {
            Mail::to('igcfmsa@gmail.com')->send(new OverrideRequestNotificationMail($overrideRequest));
        } catch (\Exception $e) {
            Log::error('Failed to send override request email: ' . $e->getMessage());
        }

        // TODO: Create notification for all admin users (after notifications table is created)
        // Uncomment this after running migrations
        
        $adminUsers = User::where('role', 'Admin')->get();
        foreach ($adminUsers as $admin) {
            NotificationController::createNotification(
                $admin->id,
                'override_request',
                'New Override Request',
                "Override request #{$overrideRequest->id} submitted by {$overrideRequest->requestedBy->name} for transaction #{$overrideRequest->transaction_id}",
                [
                    'override_request_id' => $overrideRequest->id,
                    'transaction_id' => $overrideRequest->transaction_id,
                    'requested_by' => $overrideRequest->requestedBy->name
                ]
            );
        }
        

        // Track override request activity
        ActivityTracker::trackOverrideRequest($overrideRequest, Auth::user());

        return response()->json($overrideRequest, 201);
    }

    // Admin: Approve or Reject override request
    public function review(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:approved,rejected',
            'review_notes' => 'nullable|string',
        ]);

        $overrideRequest = OverrideRequest::with('transaction', 'requestedBy')->findOrFail($id);
        $overrideRequest->status = $request->status;
        $overrideRequest->review_notes = $request->review_notes;
        $overrideRequest->reviewed_by = Auth::id();
        $overrideRequest->reviewed_at = now();
        $overrideRequest->save();

        // Load the reviewer relationship
        $overrideRequest->load('reviewedBy');

        // Apply changes if approved
        if ($request->status === 'approved') {
            $transaction = $overrideRequest->transaction;
            $originalType = $transaction->type;

            $changesData = $overrideRequest->changes;
            if (is_string($changesData)) {
                $changesData = json_decode($changesData, true) ?: [];
            } elseif (!is_array($changesData)) {
                $changesData = [];
            }

            DB::transaction(function () use (&$overrideRequest, $transaction, $originalType, &$changesData) {
                $newTransaction = $transaction->replicate();
                $newTransaction->created_at = now();
                $newTransaction->updated_at = now();
                $newTransaction->type = $originalType === 'Override' ? ($changesData['original_type'] ?? 'Collection') : $originalType;

                $newAmount = array_key_exists('amount', $changesData)
                    ? (float) $changesData['amount']
                    : (float) $transaction->amount;

                if (strcasecmp($newTransaction->type, 'Disbursement') === 0) {
                    $newAmount = -abs($newAmount);
                } else {
                    $newAmount = abs($newAmount);
                }

                $newTransaction->amount = $newAmount;

                if (isset($changesData['description'])) {
                    $newTransaction->description = $changesData['description'];
                }
                if (isset($changesData['category'])) {
                    $newTransaction->category = $changesData['category'];
                }
                if (isset($changesData['department'])) {
                    $newTransaction->department = $changesData['department'];
                }

                $identifiers = $this->generateOverrideIdentifiers($newTransaction->type);
                $newTransaction->receipt_no = $identifiers['receipt_no'];
                $newTransaction->reference_no = $identifiers['reference_no'];
                $newTransaction->reference = $newTransaction->reference ?? $identifiers['reference_no'];
                $newTransaction->approved_by = Auth::id();
                $newTransaction->save();

                // Handle receipts from the original transaction: mark them cancelled for audit trail
                $linkedReceipts = Receipt::where('transaction_id', $transaction->id)->get();
                foreach ($linkedReceipts as $receipt) {
                    $receipt->status = 'Cancelled';
                    $receipt->cancellation_reason = 'Override approved';
                    $receipt->cancelled_at = now();
                    $receipt->cancelled_by = Auth::id();
                    $receipt->save();
                }

                // Optionally auto-create a new receipt for the replicated transaction if requested
                if (request()->boolean('auto_receipt', false)) {
                    $payerName = optional($linkedReceipts->first())->payer_name ?? ($newTransaction->recipient ?? '');
                    Receipt::create([
                        'transaction_id' => $newTransaction->id,
                        'payer_name' => $payerName,
                        'receipt_number' => $newTransaction->receipt_no,
                        'issued_at' => now(),
                        'status' => 'Issued',
                    ]);
                }

                $transaction->type = 'Override';
                $transaction->approved_by = Auth::id();
                $transaction->save();

                $changesData['applied_transaction_id'] = $newTransaction->id;
                $changesData['original_transaction_id'] = $transaction->id;
                $overrideRequest->changes = json_encode($changesData);
                $overrideRequest->save();

                $overrideRequest->setRelation('transaction', $transaction);
            });
        }

        // Send email notification to the user who requested the override
        try {
            $userEmail = $overrideRequest->requestedBy->email;
            Mail::to($userEmail)->send(new OverrideRequestReviewedMail($overrideRequest));
        } catch (\Exception $e) {
            Log::error('Failed to send override review email: ' . $e->getMessage());
        }

        // Create notification for the user who requested the override (Collecting Officer, Disbursing Officer, or Cashier)
        // IMPORTANT: Use the requested_by ID, NOT the current authenticated user (admin)
        $requestedByUserId = $overrideRequest->requested_by;
        $status = ucfirst($request->status);
        
        // Log for debugging
        Log::info("Creating notification for override request #{$overrideRequest->id}", [
            'requested_by_user_id' => $requestedByUserId,
            'current_admin_id' => Auth::id(),
            'status' => $request->status
        ]);
        
        try {
            $notification = NotificationController::createNotification(
                $requestedByUserId,
                'override_reviewed',
                "Override Request {$status}",
                "Your override request #{$overrideRequest->id} has been {$request->status} by {$overrideRequest->reviewedBy->name}",
                [
                    'override_request_id' => $overrideRequest->id,
                    'transaction_id' => $overrideRequest->transaction_id,
                    'status' => $request->status,
                    'reviewed_by' => $overrideRequest->reviewedBy->name
                ]
            );
            
            Log::info("Notification created successfully", [
                'notification_id' => $notification->id,
                'user_id' => $notification->user_id
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to create notification for override request: ' . $e->getMessage(), [
                'requested_by_user_id' => $requestedByUserId,
                'exception' => $e
            ]);
        }

        // Track override review activity
        ActivityTracker::trackOverrideReview($overrideRequest, Auth::user(), $request->status);

        return response()->json($overrideRequest);
    }

    private function generateOverrideIdentifiers(string $type): array
    {
        $timestamp = now()->format('YmdHis');

        if (strcasecmp($type, 'Disbursement') === 0) {
            return [
                'receipt_no' => "OVR-DIS-{$timestamp}",
                'reference_no' => "OVR-DIS-{$timestamp}"
            ];
        }

        return [
            'receipt_no' => "OVR-COL-{$timestamp}",
            'reference_no' => "OVR-COL-{$timestamp}"
        ];
    }
}
