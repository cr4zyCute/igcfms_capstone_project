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

        // Limit results
        $limit = $request->get('limit', 50);
        $notifications = $query->orderBy('created_at', 'desc')
                              ->limit($limit)
                              ->get();

        $unreadCount = Notification::where('user_id', $user->id)
                                  ->where('is_read', false)
                                  ->count();

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
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
