<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class CashierController extends Controller
{
    public function dashboard()
    {
        $totalCollections = DB::table('transactions')
            ->where('type', 'Collection')
            ->sum('amount');

        // Total Disbursements (sum of 'Disbursement' transactions)
        $totalDisbursements = DB::table('transactions')
            ->where('type', 'Disbursement')
            ->sum('amount');

        // Active Funds (count of fund_accounts where is_active = 1)
        $activeFunds = DB::table('fund_accounts')
            ->where('is_active', 1)
            ->count();

        // Today's Transactions (count for today)
        $today = Carbon::today();
        $todayTransactions = DB::table('transactions')
            ->whereDate('created_at', $today)
            ->count();

        // Recent Transactions (last 10, join with users for 'by' field)
        $transactions = DB::table('transactions as t')
            ->leftJoin('users as u', 't.created_by', '=', 'u.id')
            ->select(
                't.id',
                't.type',
                't.amount',
                'u.name as by',
                't.created_at'
            )
            ->orderByDesc('t.created_at')
            ->limit(10)
            ->get();

        return response()->json([
            'kpis' => [
                'totalCollections' => $totalCollections,
                'totalDisbursements' => $totalDisbursements,
                'activeFunds' => $activeFunds,
                'todayTransactions' => $todayTransactions,
            ],
            'transactions' => $transactions,
        ]);
    }
}
