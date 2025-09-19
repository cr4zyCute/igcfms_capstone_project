<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ActivityLog;
use App\Services\ActivityTracker;

class ActivityLogController extends Controller
{
    /**
     * Get activity logs for admin dashboard
     */
    public function index(Request $request)
    {
        $query = ActivityLog::query()->with('user');

        // Filter by user role
        if ($request->filled('role')) {
            $query->where('user_role', $request->role);
        }

        // Filter by activity type
        if ($request->filled('type')) {
            $query->where('activity_type', $request->type);
        }

        // Filter by date range
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        // Default to recent activities (last 30 days)
        if (!$request->filled('date_from') && !$request->filled('date_to')) {
            $query->where('created_at', '>=', now()->subDays(30));
        }

        $activities = $query->orderBy('created_at', 'desc')
                           ->paginate($request->get('per_page', 50));

        return response()->json($activities);
    }

    /**
     * Get activity statistics for dashboard
     */
    public function statistics(Request $request)
    {
        $period = $request->get('period', '7'); // Default to 7 days

        $stats = [
            'total_activities' => ActivityLog::where('created_at', '>=', now()->subDays($period))->count(),
            'login_activities' => ActivityLog::where('activity_type', ActivityLog::ACTIVITY_LOGIN)
                                            ->where('created_at', '>=', now()->subDays($period))
                                            ->count(),
            'failed_logins' => ActivityLog::where('activity_type', ActivityLog::ACTIVITY_LOGIN_FAILED)
                                         ->where('created_at', '>=', now()->subDays($period))
                                         ->count(),
            'transactions' => ActivityLog::whereIn('activity_type', [
                                ActivityLog::ACTIVITY_COLLECTION,
                                ActivityLog::ACTIVITY_DISBURSEMENT
                            ])
                            ->where('created_at', '>=', now()->subDays($period))
                            ->count(),
            'override_requests' => ActivityLog::where('activity_type', ActivityLog::ACTIVITY_OVERRIDE_REQUEST)
                                             ->where('created_at', '>=', now()->subDays($period))
                                             ->count(),
        ];

        // Activity by role
        $activityByRole = ActivityLog::where('created_at', '>=', now()->subDays($period))
                                    ->selectRaw('user_role, COUNT(*) as count')
                                    ->groupBy('user_role')
                                    ->get()
                                    ->pluck('count', 'user_role');

        // Activity by type
        $activityByType = ActivityLog::where('created_at', '>=', now()->subDays($period))
                                    ->selectRaw('activity_type, COUNT(*) as count')
                                    ->groupBy('activity_type')
                                    ->get()
                                    ->pluck('count', 'activity_type');

        // Recent critical activities
        $criticalActivities = ActivityLog::whereIn('activity_type', [
                                ActivityLog::ACTIVITY_LOGIN_FAILED,
                                ActivityLog::ACTIVITY_OVERRIDE_REQUEST,
                                ActivityLog::ACTIVITY_USER_CREATED
                            ])
                            ->where('created_at', '>=', now()->subDays($period))
                            ->orderBy('created_at', 'desc')
                            ->limit(10)
                            ->get();

        return response()->json([
            'statistics' => $stats,
            'activity_by_role' => $activityByRole,
            'activity_by_type' => $activityByType,
            'critical_activities' => $criticalActivities,
            'period_days' => $period,
        ]);
    }

    /**
     * Get recent activities for dashboard widget
     */
    public function recent(Request $request)
    {
        $limit = $request->get('limit', 10);
        
        $activities = ActivityLog::with('user')
                                ->orderBy('created_at', 'desc')
                                ->limit($limit)
                                ->get();

        return response()->json($activities);
    }

    /**
     * Get user-specific activities
     */
    public function userActivities(Request $request, $userId)
    {
        $activities = ActivityLog::where('user_id', $userId)
                                ->orderBy('created_at', 'desc')
                                ->paginate($request->get('per_page', 20));

        return response()->json($activities);
    }

    /**
     * Manual activity logging (for testing or special cases)
     */
    public function store(Request $request)
    {
        $request->validate([
            'activity_type' => 'required|string',
            'description' => 'required|string',
            'details' => 'nullable|array',
        ]);

        $activity = ActivityTracker::log(
            $request->activity_type,
            $request->description,
            auth()->user(),
            $request->details ?? [],
            $request
        );

        return response()->json([
            'success' => true,
            'message' => 'Activity logged successfully',
            'data' => $activity
        ], 201);
    }
}
