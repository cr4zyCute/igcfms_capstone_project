<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\AuditLog;

class AuditLogController extends Controller
{
    // Get all audit logs
    public function index()
    {
        $logs = AuditLog::with('user')->orderBy('created_at', 'desc')->get();
        return response()->json($logs);
    }

    // Create audit log
    public function store(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'action' => 'required|string|max:255',
            'details' => 'nullable|string',
        ]);

        $log = AuditLog::create([
            'user_id' => $request->user_id,
            'action' => $request->action,
            'details' => $request->details,
            'created_at' => now(),
        ]);

        return response()->json($log, 201);
    }
}
