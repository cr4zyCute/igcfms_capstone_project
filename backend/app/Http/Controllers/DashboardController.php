<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function summary()
    {
        $totalUsers = DB::table('users')->count();
        $activeFunds = DB::table('fund_accounts')->where('is_active', 1)->count();
        $totalRevenue = DB::table('transactions')->where('type', 'Collection')->sum('amount');
        $totalExpense = DB::table('transactions')->where('type', 'Disbursement')->sum('amount');
        $todayTransactions = DB::table('transactions')
            ->whereDate('created_at', now())
            ->count();

        return response()->json([
            'totalUsers' => $totalUsers,
            'activeFunds' => $activeFunds,
            'totalRevenue' => $totalRevenue,
            'totalExpense' => $totalExpense,
            'todayTransactions' => $todayTransactions,
        ]);
    }

    public function dailyRevenue()
    {
        $revenues = DB::table('transactions')
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('SUM(amount) as amount'))
            ->where('type', 'Collection')
            ->groupBy('date')
            ->orderByDesc('date')
            ->limit(7)
            ->get();

        return response()->json($revenues->reverse()->values());
    }

    public function fundDistribution()
    {
        $funds = DB::table('fund_accounts')
            ->where('is_active', 1)
            ->select('name', DB::raw('current_balance as value'))
            ->get();

        return response()->json($funds);
    }

    public function recentLogs()
    {
        $logs = DB::table('audit_logs')
            ->join('users', 'audit_logs.user_id', '=', 'users.id')
            ->orderByDesc('audit_logs.created_at')
            ->limit(10)
            ->select('audit_logs.id', 'users.name as user', 'audit_logs.action', 'audit_logs.created_at')
            ->get();

        return response()->json($logs);
    }
}
