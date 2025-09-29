<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\FundAccount;
use App\Models\Transaction;
use App\Services\ActivityTracker;
use Illuminate\Support\Facades\Auth;

class FundAccountController extends Controller
{
    // List all fund accounts (only non-deleted and active)
    public function index()
    {
        $accounts = FundAccount::where('is_active', true)
            ->get() // This automatically excludes soft-deleted records
            ->map(function ($account) {
                $transactionsSum = $account->transactions()->sum('amount');
                $account->current_balance = $account->initial_balance + $transactionsSum;
                return $account;
            });

        return response()->json($accounts);
    }



    // Show a single fund account with computed current_balance and transactions
    public function show($id)
    {
        $account = FundAccount::with('transactions')->find($id);

        if (!$account) {
            return response()->json(['message' => 'Fund account not found.'], 404);
        }

        // Compute current_balance from initial_balance + sum(transactions.amount)
        $transactionsSum = $account->transactions()->sum('amount');
        $account->current_balance = $account->initial_balance + $transactionsSum;

        return response()->json($account);
    }

    // Create a new fund account
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'initial_balance' => 'required|numeric|min:0',
            'account_type' => 'required|in:Revenue,Expense,Asset,Liability,Equity',
            'department' => 'nullable|string|max:255',
        ]);

        // Auto-generate account code (includes soft-deleted records to avoid duplicates)
        $accountCode = FundAccount::getNextAccountCode($request->account_type);

        $account = FundAccount::create([
            'name' => $request->name,
            'code' => $accountCode,
            'description' => $request->description,
            'initial_balance' => $request->initial_balance,
            'current_balance' => $request->initial_balance, 
            'account_type' => $request->account_type,
            'department' => $request->department,
            'created_by' => Auth::id(),
        ]);

        // Track fund account creation
        ActivityTracker::trackFundAccount($account, Auth::user(), 'created');

        return response()->json($account, 201);
    }


    public function update(Request $request, $id)
    {
        $account = FundAccount::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'code' => "required|string|max:50|unique:fund_accounts,code,$id",
            'description' => 'nullable|string',
            'initial_balance' => 'required|numeric|min:0',
            'account_type' => 'required|in:Revenue,Expense,Asset,Liability,Equity',
            'department' => 'nullable|string|max:255',
        ]);

        // Only allow these fields to be updated
        $account->update($request->only([
            'name',
            'code',
            'description',
            'initial_balance',
            'account_type',
            'department'
        ]));

        // Track fund account update
        ActivityTracker::trackFundAccount($account, Auth::user(), 'updated');

        return response()->json(['message' => 'Fund account updated successfully']);
    }

    public function updateBalance(Request $request, $id)
    {
        $account = FundAccount::find($id);

        if (!$account) {
            return response()->json(['message' => 'Fund account not found.'], 404);
        }

        $validated = $request->validate([
            'balance' => 'required|numeric',
        ]);

        $account->current_balance = $validated['balance'];
        $account->save();

        ActivityTracker::trackFundAccount($account, Auth::user(), 'balance_updated');

        return response()->json([
            'message' => 'Fund account balance updated successfully.',
            'current_balance' => $account->current_balance,
        ]);
    }


    // Delete a fund account
    public function destroy($id)
    {
        $account = FundAccount::withCount('transactions')->find($id);

        if (!$account) {
            return response()->json(['message' => 'Fund account not found'], 404);
        }

        // If there are transactions, don't hard delete – just deactivate
        if ($account->transactions_count > 0) {
            $account->is_active = false;
            $account->save();

            // Track fund account deactivation
            ActivityTracker::trackFundAccount($account, Auth::user(), 'deactivated');

            return response()->json([
                'message' => 'Fund account has transactions and has been deactivated.'
            ], 200);
        }

        // No transactions, safe to soft delete
        $account->delete();

        // Track fund account deletion
        ActivityTracker::trackFundAccount($account, Auth::user(), 'deleted');

        return response()->json(['message' => 'Fund account deleted successfully'], 200);
    }

    /**
     * Get all accounts including soft-deleted ones (for debugging/admin purposes)
     * This can help verify that the code generation is working correctly
     */
    public function getAllWithDeleted()
    {
        $accounts = FundAccount::withTrashed()
            ->orderBy('code')
            ->get()
            ->map(function ($account) {
                return [
                    'id' => $account->id,
                    'code' => $account->code,
                    'name' => $account->name,
                    'account_type' => $account->account_type,
                    'is_active' => $account->is_active,
                    'deleted_at' => $account->deleted_at,
                    'status' => $account->deleted_at ? 'soft_deleted' : ($account->is_active ? 'active' : 'inactive')
                ];
            });

        return response()->json([
            'message' => 'All accounts (including soft-deleted)',
            'accounts' => $accounts,
            'total_count' => $accounts->count(),
            'active_count' => $accounts->where('status', 'active')->count(),
            'inactive_count' => $accounts->where('status', 'inactive')->count(),
            'deleted_count' => $accounts->where('status', 'soft_deleted')->count(),
        ]);
    }
}
