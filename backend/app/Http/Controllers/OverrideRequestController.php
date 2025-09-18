<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\OverrideRequest;
use App\Models\Transaction;
use Illuminate\Support\Facades\Auth;

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

        return response()->json($overrideRequest, 201);
    }

    // Admin: Approve or Reject override request
    public function review(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:approved,rejected',
            'review_notes' => 'nullable|string',
        ]);

        $overrideRequest = OverrideRequest::with('transaction')->findOrFail($id);
        $overrideRequest->status = $request->status;
        $overrideRequest->review_notes = $request->review_notes;
        $overrideRequest->reviewed_by = Auth::id();
        $overrideRequest->reviewed_at = now();
        $overrideRequest->save();

        // Apply changes if approved
        if ($request->status === 'approved') {
            $changes = json_decode($overrideRequest->changes, true);
            $transaction = $overrideRequest->transaction;

            if (isset($changes['amount'])) $transaction->amount = $changes['amount'];
            if (isset($changes['description'])) $transaction->description = $changes['description'];
            if (isset($changes['type'])) $transaction->type = $changes['type'];

            $transaction->approved_by = Auth::id();
            $transaction->type = 'Override';
            $transaction->save();
        }

        return response()->json($overrideRequest);
    }
}
