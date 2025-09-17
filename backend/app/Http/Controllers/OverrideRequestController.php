<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\OverrideRequest;
use Illuminate\Support\Facades\Auth;

class OverrideRequestController extends Controller
{
    // Admin: List all override requests
    public function index()
    {
        $requests = OverrideRequest::with('requestedBy', 'reviewedBy')->get();
        return response()->json($requests);
    }

    // Cashier: List only their own requests
    public function myRequests()
    {
        $userId = Auth::id();
        $requests = OverrideRequest::where('requested_by', $userId)->with('reviewedBy')->get();
        return response()->json($requests);
    }

    // Cashier: Submit new override request
    public function store(Request $request)
    {
        $request->validate([
            'transaction_id' => 'required|exists:transactions,id',
            'reason' => 'required|string',
        ]);

        $overrideRequest = OverrideRequest::create([
            'transaction_id' => $request->transaction_id,
            'requested_by' => Auth::id(),
            'reason' => $request->reason,
            'status' => 'pending',
        ]);

        return response()->json($overrideRequest, 201);
    }

    // Admin: Approve/Reject request
    public function review(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:approved,rejected',
            'review_notes' => 'nullable|string',
        ]);

        $overrideRequest = OverrideRequest::findOrFail($id);
        $overrideRequest->status = $request->status;
        $overrideRequest->review_notes = $request->review_notes;
        $overrideRequest->reviewed_by = Auth::id();
        $overrideRequest->reviewed_at = now();
        $overrideRequest->save();

        return response()->json($overrideRequest);
    }
}
