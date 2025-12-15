<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Mail\StaffWelcomeMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    // Fetch all users
    public function index()
    {
        return response()->json(User::all());
    }

    // Create a new user
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:100',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:6',
            'phone' => 'nullable|string|max:20',
            'role' => 'required|in:Cashier,Collecting Officer,Disbursing Officer,Admin',
            'department' => 'nullable|string|max:100'
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'phone' => $request->phone,
            'department' => $request->department,
            'status' => 'active',
            'force_password_change' => true  // Force new users to change password on first login
        ]);

        // Send welcome email with credentials
        try {
            Log::info('=== SENDING WELCOME EMAIL ===', [
                'name' => $user->name,
                'email' => $user->email,
                'password' => $request->password,
                'role' => $user->role,
            ]);
            
            Mail::to($user->email)->send(new StaffWelcomeMail(
                $user->name,
                $user->email,
                $request->password, // Send the plain password (before hashing)
                $user->role
            ));
            
            Log::info('Welcome email sent successfully to: ' . $user->email);
        } catch (\Exception $e) {
            // Log error but don't fail the user creation
            Log::error('Failed to send welcome email: ' . $e->getMessage(), [
                'email' => $user->email,
                'exception' => $e,
            ]);
        }

        return response()->json($user, 201);
    }

    // Toggle user status
    public function toggleStatus($id)
    {
        $user = User::findOrFail($id);
        $user->status = $user->status === 'active' ? 'inactive' : 'active';
        $user->save();

        return response()->json($user);
    }

    // Get current user profile
    public function getProfile(Request $request)
    {
        $user = Auth::user();
        
        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'department' => $user->department ?? '',
            'phone' => $user->phone ?? '',
            'status' => $user->status,
            'created_at' => $user->created_at,
            'updated_at' => $user->updated_at
        ]);
    }

    // Update a specific user (by admin)
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);
        
        $request->validate([
            'name' => 'required|string|max:100',
            'email' => [
                'required',
                'email',
                Rule::unique('users')->ignore($user->id)
            ],
            'phone' => 'nullable|string|max:20',
            'department' => 'nullable|string|max:100',
            'role' => 'required|in:Cashier,Collecting Officer,Disbursing Officer,Admin',
            'password' => 'nullable|string|min:6'
        ]);

        // Update user data
        $updateData = [
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'department' => $request->department,
            'role' => $request->role
        ];

        // Add password if provided
        if ($request->filled('password')) {
            $updateData['password'] = Hash::make($request->password);
        }

        $user->update($updateData);

        return response()->json([
            'message' => 'User updated successfully',
            'user' => $user
        ]);
    }

    // Delete a user
    public function destroy($id)
    {
        $user = User::findOrFail($id);
        $userName = $user->name;
        $user->delete();

        return response()->json([
            'message' => "User '{$userName}' has been deleted successfully"
        ]);
    }

    // Update current user profile
    public function updateProfile(Request $request)
    {
        $user = Auth::user();
        
        $request->validate([
            'name' => 'required|string|max:100',
            'email' => [
                'required',
                'email',
                Rule::unique('users')->ignore($user->id)
            ],
            'phone' => 'nullable|string|max:20',
            'department' => 'nullable|string|max:100',
            'current_password' => 'required_with:password',
            'password' => 'nullable|string|min:6|confirmed'
        ]);

        // If password is being changed, verify current password
        if ($request->filled('password')) {
            if (!Hash::check($request->current_password, $user->password)) {
                return response()->json([
                    'message' => 'Current password is incorrect'
                ], 422);
            }
        }

        // Update user data
        $updateData = [
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'department' => $request->department
        ];

        // Add password if provided
        if ($request->filled('password')) {
            $updateData['password'] = Hash::make($request->password);
        }

        $user->update($updateData);

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'department' => $user->department,
                'phone' => $user->phone,
                'status' => $user->status
            ]
        ]);
    }
}
