<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\FundAccount;
use App\Models\Transaction;
use App\Services\ActivityTracker;
use Illuminate\Support\Facades\Auth;

class FundAccountController extends Controller
{
    // List all fund accounts
    public function index()
    {
        $accounts = FundAccount::where('is_active', true)
            ->get()
            ->map(function ($account) {
                $transactionsSum = $account->transactions()->sum('amount');
                $account->current_balance = $account->initial_balance + $transactionsSum;
                return $account;
            });

        return response()->json($accounts);
    }



    // Show transactions of a single fund account
    public function show($id)
    {
        $account = FundAccount::with('transactions')->find($id);

        if (!$account) {
            return response()->json(['message' => 'Fund account not found.'], 404);
        }

        return response()->json($account->transactions);
    }

    // Create a new fund account
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:fund_accounts,code',
            'description' => 'nullable|string',
            'initial_balance' => 'required|numeric|min:0',
            'account_type' => 'required|in:Revenue,Expense,Asset,Liability,Equity',
            'department' => 'nullable|string|max:255',
        ]);

        $account = FundAccount::create([
            'name' => $request->name,
            'code' => $request->code,
            'description' => $request->description,
            'initial_balance' => $request->initial_balance,
            'account_type' => $request->account_type,
            'department' => $request->department,
            'created_by' => $request->created_by,
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

            return response()->json([
                'message' => 'Fund account has transactions successfully deleted.'
            ], 200);
        }

        // No transactions, safe to soft delete
        $account->delete();

        return response()->json(['message' => 'Fund account deleted successfully'], 200);
    }
}
