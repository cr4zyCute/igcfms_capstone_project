<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\RegistrationRequest;
use App\Mail\NewRegistrationRequestMail;
use Illuminate\Support\Facades\Auth;
use App\Services\ActivityTracker;
use Illuminate\Support\Facades\Mail;

class AuthController extends Controller
{
    // Login
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|string|email|max:255',
            'password' => 'required|string|max:255',
        ]);

        // Sanitize email input
        $email = filter_var(strtolower(trim($request->email)), FILTER_SANITIZE_EMAIL);
        
        // Use parameterized query (Eloquent already does this, but being explicit)
        $user = User::where('email', $email)->first();

        // Check if user exists (email validation)
        if (!$user) {
            // Track failed login attempt
            ActivityTracker::trackFailedLogin($request->email, $request);
            return response()->json([
                'message' => 'Email not found',
                'error_type' => 'email'
            ], 401);
        }

        // Check if password is correct
        if (!Hash::check($request->password, $user->password)) {
            // Track failed login attempt
            ActivityTracker::trackFailedLogin($request->email, $request);
            return response()->json([
                'message' => 'Incorrect password',
                'error_type' => 'password'
            ], 401);
        }

        // Create token
        $token = $user->createToken('auth_token')->plainTextToken;

        // Track successful login asynchronously to avoid blocking
        // Consider using Laravel Jobs for this in production
        try {
            ActivityTracker::trackLogin($user, $request);
        } catch (\Exception $e) {
            // Log error but don't fail the login
            \Log::error('Failed to track login activity: ' . $e->getMessage());
        }

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'role' => $user->role,
            'force_password_change' => $user->force_password_change,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
        ]);
    }

    // Logout
    public function logout(Request $request)
    {
        $user = $request->user();
        
        // Track logout activity
        ActivityTracker::trackLogout($user, $request);
        
        $user->tokens()->delete();
        return response()->json(['message' => 'Logged out successfully']);
    }
    // Register method
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:100|regex:/^[a-zA-Z\s\-\.]+$/',
            'email' => 'required|email|max:255|unique:users|unique:registration_requests',
            'password' => 'required|string|min:6|max:255|confirmed',
            'role' => 'required|in:Collecting Officer,Disbursing Officer,Cashier,Admin'
        ]);

        // Sanitize inputs
        $name = trim(strip_tags($request->name));
        $email = filter_var(strtolower(trim($request->email)), FILTER_SANITIZE_EMAIL);

        // Create registration request
        $registrationRequest = RegistrationRequest::create([
            'name' => $name,
            'email' => $email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'status' => 'pending'
        ]);

        // Send email to admin
        // try {
        //     Mail::to('igcfmsa@gmail.com')->send(new NewRegistrationRequestMail($registrationRequest));
        // } catch (\Exception $e) {
        //     Log::error('Email sending failed: ' . $e->getMessage()); 
        // }

        // return response()->json([
        //     'message' => 'Registration request submitted for admin approval.'
        // ], 201);

        try {
            Mail::to('igcfmsa@gmail.com')
                ->send(new \App\Mail\NewRegistrationRequestMail($registrationRequest));
            $emailSent = true;
        } catch (\Exception $e) {
            Log::error('Email sending failed: ' . $e->getMessage());
            $emailSent = false;
        }


        return response()->json([
            'message' => $emailSent
                ? 'Registration request submitted and email sent to admin.'
                : 'Registration submitted, but failed to send email. Please contact admin.',
        ], $emailSent ? 201 : 500);
    }
}
