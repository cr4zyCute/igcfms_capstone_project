<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class PasswordChangeController extends Controller
{
    /**
     * Change user password and disable force_password_change flag
     */
    public function changePassword(Request $request)
    {
        $user = Auth::user();

        $request->validate([
            'current_password' => 'required|string',
            'new_password' => [
                'required',
                'string',
                'min:8',
                'confirmed',
                'different:current_password',
            ],
        ], [
            'new_password.different' => 'New password must be different from current password',
            'new_password.confirmed' => 'Password confirmation does not match',
            'current_password.required' => 'Current password is required',
        ]);

        // Verify current password
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Current password is incorrect',
            ], 401);
        }

        // Update password and disable force change flag
        $user->update([
            'password' => Hash::make($request->new_password),
            'force_password_change' => false,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully. You can now use the system.',
            'force_password_change' => false,
        ]);
    }

    /**
     * Get current user's force_password_change status
     */
    public function getStatus(Request $request)
    {
        $user = Auth::user();

        return response()->json([
            'force_password_change' => $user->force_password_change,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
        ]);
    }
}
