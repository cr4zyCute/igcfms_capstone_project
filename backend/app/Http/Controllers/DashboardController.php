<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function summary()
    {
        // Total users (excluding inactive if needed)
        $totalUsers = DB::table('users')->where('status', 'active')->count();

        // Active fund accounts
        $activeFunds = DB::table('fund_accounts')->where('is_active', 1)->count();

        // Total revenue (Collections)
        $totalRevenue = DB::table('transactions')
            ->where('type', 'Collection')
            ->sum('amount');

        // Total expense (Disbursements)
        $totalExpense = DB::table('transactions')
            ->where('type', 'Disbursement')
            ->sum('amount');

        // Today's transactions (both collections and disbursements)
        $todayTransactions = DB::table('transactions')
            ->whereDate('created_at', Carbon::today())
            ->count();

        return response()->json([
            'totalUsers' => $totalUsers,
            'activeFunds' => $activeFunds,
            'totalRevenue' => (float)$totalRevenue,
            'totalExpense' => (float)$totalExpense,
            'todayTransactions' => $todayTransactions,
        ]);
    }

    public function dailyRevenue()
    {
        $revenues = DB::table('transactions')
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(amount) as amount')
            )
            ->where('type', 'Collection')
            ->where('created_at', '>=', Carbon::now()->subDays(7))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Format dates for better display
        $formattedRevenues = $revenues->map(function ($item) {
            return [
                'date' => Carbon::parse($item->date)->format('M d'),
                'amount' => (float)$item->amount
            ];
        });

        return response()->json($formattedRevenues);
    }

    public function fundDistribution()
    {
        $funds = DB::table('fund_accounts')
            ->where('is_active', 1)
            ->where('current_balance', '>', 0)
            ->select('name', DB::raw('CAST(current_balance as DECIMAL(15,2)) as value'))
            ->orderBy('current_balance', 'desc')
            ->get();

        return response()->json($funds);
    }

    public function recentLogs()
    {
        $logs = DB::table('audit_logs')
            ->join('users', 'audit_logs.user_id', '=', 'users.id')
            ->orderBy('audit_logs.created_at', 'desc')
            ->limit(10)
            ->select(
                'audit_logs.id',
                'users.name as user',
                'audit_logs.action',
                'audit_logs.details',
                'audit_logs.created_at'
            )
            ->get();

        return response()->json($logs);
    }

    // Additional useful dashboard methods
    public function recentTransactions()
    {
        $transactions = DB::table('transactions')
            ->join('users', 'transactions.created_by', '=', 'users.id')
            ->leftJoin('fund_accounts', 'transactions.fund_account_id', '=', 'fund_accounts.id')
            ->orderBy('transactions.created_at', 'desc')
            ->limit(10)
            ->select(
                'transactions.id',
                'transactions.type',
                'transactions.amount',
                'transactions.description',
                'transactions.reference_no',
                'transactions.receipt_no',
                'fund_accounts.name as fund_account',
                'users.name as created_by',
                'transactions.created_at'
            )
            ->get();

        return response()->json($transactions);
    }

    public function fundPerformance()
    {
        $performance = DB::table('transactions')
            ->join('fund_accounts', 'transactions.fund_account_id', '=', 'fund_accounts.id')
            ->select(
                'fund_accounts.name',
                'fund_accounts.code',
                DB::raw('SUM(CASE WHEN transactions.type = "Collection" THEN transactions.amount ELSE 0 END) as total_revenue'),
                DB::raw('SUM(CASE WHEN transactions.type = "Disbursement" THEN transactions.amount ELSE 0 END) as total_expense'),
                DB::raw('(SUM(CASE WHEN transactions.type = "Collection" THEN transactions.amount ELSE 0 END) - 
                         SUM(CASE WHEN transactions.type = "Disbursement" THEN transactions.amount ELSE 0 END)) as net_balance')
            )
            ->where('fund_accounts.is_active', 1)
            ->groupBy('fund_accounts.id', 'fund_accounts.name', 'fund_accounts.code')
            ->orderBy('net_balance', 'desc')
            ->get();

        return response()->json($performance);
    }

    public function topFundAccounts()
    {
        $accounts = DB::table('fund_accounts')
            ->orderByDesc('current_balance')
            ->limit(5)
            ->get();

        return response()->json($accounts);
    }

    public function monthlyRevenue()
    {
        $data = DB::table('transactions')
            ->selectRaw('DATE_FORMAT(created_at, "%Y-%m") as month, SUM(amount) as total')
            ->where('type', 'Collection')
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        return response()->json($data);
    }
}
