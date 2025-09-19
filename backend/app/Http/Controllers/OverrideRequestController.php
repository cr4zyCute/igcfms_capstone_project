<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\OverrideRequest;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
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
        /*
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
        */

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
            $changes = json_decode($overrideRequest->changes, true);
            $transaction = $overrideRequest->transaction;

            if (isset($changes['amount'])) $transaction->amount = $changes['amount'];
            if (isset($changes['description'])) $transaction->description = $changes['description'];
            if (isset($changes['category'])) $transaction->category = $changes['category'];
            if (isset($changes['department'])) $transaction->department = $changes['department'];

            $transaction->approved_by = Auth::id();
            $transaction->type = 'Override';
            $transaction->save();
        }

        // Send email notification to the cashier who requested the override
        try {
            $cashierEmail = $overrideRequest->requestedBy->email;
            Mail::to($cashierEmail)->send(new OverrideRequestReviewedMail($overrideRequest));
        } catch (\Exception $e) {
            Log::error('Failed to send override review email: ' . $e->getMessage());
        }

        // TODO: Create notification for the cashier (after notifications table is created)
        // Uncomment this after running migrations
        /*
        $status = ucfirst($request->status);
        NotificationController::createNotification(
            $overrideRequest->requested_by,
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
        */

        return response()->json($overrideRequest);
    }
}
