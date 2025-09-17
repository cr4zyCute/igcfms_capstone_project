<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\OverrideRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class TransactionController extends Controller
{
    // ... your other methods ...

    public function index(Request $request)
    {
        $query = Transaction::query()->with(['fundAccount', 'creator']);

        // Optional filter by comma-separated fund account IDs
        if ($request->filled('accountIds')) {
            $ids = collect(explode(',', (string) $request->query('accountIds')))
                ->map(fn($v) => (int) trim($v))
                ->filter(fn($v) => $v > 0)
                ->unique()
                ->values()
                ->all();

            if (!empty($ids)) {
                $query->whereIn('fund_account_id', $ids);
            }
        }

        $transactions = $query->orderByDesc('created_at')->get();

        return response()->json($transactions, 200);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|in:Collection,Disbursement',
            'amount' => 'required|numeric|min:0.01',
            'description' => 'nullable|string',
            'fund_account_id' => 'required|exists:fund_accounts,id',
            'mode_of_payment' => 'required|in:Cash,Cheque,Bank Transfer',
            'payer_name' => 'required_if:type,Collection|string|max:100',
            'receipt_number' => 'required_if:type,Collection|string|max:50|unique:receipts,receipt_number',
            'user_id' => 'sometimes|exists:users,id', // Change to 'sometimes' instead of 'required'
        ]);

        // Get user - try from request first, then fallback
        if (isset($validated['user_id'])) {
            $user = User::find($validated['user_id']);
        } else {
            // Fallback: use first user or handle error
            $user = User::first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found and no user_id provided'
                ], 404);
            }
        }

        // Create the transaction
        $transaction = Transaction::create([
            'type' => $validated['type'],
            'amount' => $validated['amount'],
            'description' => $validated['description'] ?? null,
            'fund_account_id' => $validated['fund_account_id'],
            'mode_of_payment' => $validated['mode_of_payment'],
            'created_by' => $user->id,
            'department' => $user->role === 'Collecting Officer' ? 'Collections' : null,
        ]);

        // If Collection → also issue a receipt
        if ($validated['type'] === 'Collection') {
            $transaction->receipt_no = $validated['receipt_number'];
            $transaction->save();

            DB::table('receipts')->insert([
                'transaction_id' => $transaction->id,
                'payer_name' => $validated['payer_name'],
                'receipt_number' => $validated['receipt_number'],
                'issued_at' => now(),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Transaction created successfully',
            'data' => $transaction->load(['fundAccount', 'creator'])
        ], 201);
    }
}
