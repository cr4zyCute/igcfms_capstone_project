<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\FundAccount;
use App\Models\Transaction;

class FundAccountController extends Controller
{
    // List all fund accounts
    public function index()
    {
        $accounts = FundAccount::all()->map(function ($account) {
            // Calculate current balance based on transactions
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

        return response()->json($account, 201);
    }
}
