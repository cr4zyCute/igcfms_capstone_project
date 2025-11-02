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
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            // Track failed login attempt
            ActivityTracker::trackFailedLogin($request->email, $request);
            return response()->json(['message' => 'Invalid login credentials'], 401);
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
            'name' => 'required|string',
            'email' => 'required|email|unique:users|unique:registration_requests',
            'password' => 'required|string|min:6|confirmed',
            'role' => 'required|in:Collecting Officer,Disbursing Officer,Cashier,Admin'
        ]);

        // Create registration request
        $registrationRequest = RegistrationRequest::create([
            'name' => $request->name,
            'email' => $request->email,
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
