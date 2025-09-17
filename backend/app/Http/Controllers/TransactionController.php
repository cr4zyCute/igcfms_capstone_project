<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TransactionController extends Controller
{
    public function index(Request $request)
    {
        // Start query builder
        $query = Transaction::with(['creator', 'fundAccount']);

        // Apply role-based filters
        if ($request->has('type') && in_array($request->type, ['Collection', 'Disbursement'])) {
            $query->where('type', $request->type);
        }

        // Apply other filters
        if ($request->has('department')) {
            $query->where('department', 'like', '%' . $request->department . '%');
        }

        if ($request->has('modeOfPayment')) {
            $query->where('mode_of_payment', $request->modeOfPayment);
        }

        if ($request->has('dateFrom') && $request->has('dateTo')) {
            $query->whereBetween('created_at', [$request->dateFrom, $request->dateTo]);
        }

        // Get results
        $transactions = $query->orderBy('created_at', 'desc')->get();

        return response()->json($transactions);
    }

    public function requestOverride(Request $request)
    {
        $validated = $request->validate([
            'transaction_id' => 'required|exists:transactions,id',
            'reason' => 'required|string|min:10',
            'requested_by' => 'required|exists:users,id'
        ]);

        // Create override request (you need to create this model)
        $override = OverrideRequest::create([
            'transaction_id' => $validated['transaction_id'],
            'requested_by' => $validated['requested_by'],
            'reason' => $validated['reason'],
            'status' => 'pending'
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Override request submitted for approval',
            'data' => $override
        ]);
    }
}
