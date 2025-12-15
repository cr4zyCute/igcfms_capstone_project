<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Notification;
use App\Services\WebSocketBroadcaster;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    protected $broadcaster;

    public function __construct(WebSocketBroadcaster $broadcaster)
    {
        $this->broadcaster = $broadcaster;
    }

    // Get notifications for the authenticated user
    public function index(Request $request)
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $query = Notification::where('user_id', $user->id)->with('user');

        // Filter by read status
        if ($request->filled('unread_only')) {
            $query->where('is_read', false);
        }

        // Check if pagination is requested
        $page = $request->get('page');
        $perPage = $request->get('per_page', 50);
        
        // Get total count for pagination info
        $totalCount = Notification::where('user_id', $user->id)->count();
        
        $unreadCount = Notification::where('user_id', $user->id)
                                  ->where('is_read', false)
                                  ->count();

        // If 'all' is requested, return all notifications (for frontend that handles its own pagination)
        if ($request->get('limit') === 'all' || $request->get('all') === 'true') {
            $notifications = $query->orderBy('created_at', 'desc')->get();
            
            return response()->json([
                'notifications' => $notifications,
                'unread_count' => $unreadCount,
                'total_count' => $totalCount,
            ]);
        }

        // If page is specified, use Laravel pagination
        if ($page) {
            $paginated = $query->orderBy('created_at', 'desc')->paginate($perPage);
            
            return response()->json([
                'notifications' => $paginated->items(),
                'unread_count' => $unreadCount,
                'total_count' => $totalCount,
                'pagination' => [
                    'current_page' => $paginated->currentPage(),
                    'last_page' => $paginated->lastPage(),
                    'per_page' => $paginated->perPage(),
                    'total' => $paginated->total(),
                ],
            ]);
        }

        // Default: limit results (backward compatible)
        $limit = $request->get('limit', 50);
        $notifications = $query->orderBy('created_at', 'desc')
                              ->limit($limit)
                              ->get();

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
            'total_count' => $totalCount,
        ]);
    }

    // Mark notification as read
    public function markAsRead($id)
    {
        $notification = Notification::where('user_id', Auth::id())
            ->where('id', $id)
            ->firstOrFail();

        $notification->update(['is_read' => true]);

        return response()->json(['message' => 'Notification marked as read']);
    }

    // Mark all notifications as read
    public function markAllAsRead()
    {
        Notification::where('user_id', Auth::id())
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json(['message' => 'All notifications marked as read']);
    }

    // Get unread count
    public function getUnreadCount()
    {
        $user = Auth::user();
        $count = Notification::where('user_id', $user->id)
            ->unread()
            ->count();

        \Log::info("Unread count for user", [
            'user_id' => $user->id,
            'user_role' => $user->role,
            'unread_count' => $count,
        ]);

        return response()->json(['unread_count' => $count]);
    }

    // Create notification (internal use)
    public static function createNotification($userId, $type, $title, $message, $data = null)
    {
        return Notification::create([
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'data' => $data,
            'created_at' => now(),
        ]);
    }
}
