<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\PasswordResetRequest;
use App\Mail\PasswordResetRequestMail;
use App\Mail\TemporaryPasswordMail;
use App\Services\ActivityTracker;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Hash;

class PasswordResetController extends Controller
{
    /**
     * Request password reset
     * User submits email to request password reset
     */
    public function requestReset(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email|exists:users,email',
        ], [
            'email.exists' => 'This email is not registered in the system. Please check and try again.',
            'email.email' => 'Please enter a valid email address.',
            'email.required' => 'Email address is required.',
        ]);

        try {
            $user = User::where('email', $validated['email'])->first();

            // Check if there's already a pending request
            $existingRequest = PasswordResetRequest::where('user_id', $user->id)
                ->where('status', 'pending')
                ->first();

            if ($existingRequest) {
                return response()->json([
                    'success' => false,
                    'message' => 'A password reset request is already pending for this email. Please wait for the administrator to review and approve your request.',
                ], 400);
            }

            // Create new password reset request
            $resetRequest = PasswordResetRequest::create([
                'user_id' => $user->id,
                'email' => $user->email,
                'status' => 'pending',
            ]);

            // Send email to admin
            $adminEmail = env('ADMIN_EMAIL', 'igcfma@gmail.com');
            $backendUrl = env('APP_URL', 'http://localhost:8000');
            $approvalLink = $backendUrl . '/admin/password-reset/' . $resetRequest->id . '/approve';

            Mail::to($adminEmail)->send(new PasswordResetRequestMail($user, $resetRequest, $approvalLink));

            // Create notification for all admin users
            ActivityTracker::trackPasswordResetRequest($resetRequest, $user);

            return response()->json([
                'success' => true,
                'message' => 'Password reset request submitted successfully. Please wait for admin approval.',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Admin approves password reset request
     * Generates temporary password and sends to user
     */
    public function approveReset($id)
    {
        try {
            $resetRequest = PasswordResetRequest::findOrFail($id);

            // Check if already processed
            if ($resetRequest->status !== 'pending') {
                return response()->view('password-reset-response', [
                    'success' => false,
                    'message' => 'This request has already been processed.',
                ], 400);
            }

            // Generate temporary password
            $temporaryPassword = PasswordResetRequest::generateTemporaryPassword();

            // Update request
            $resetRequest->update([
                'temporary_password' => Hash::make($temporaryPassword),
                'status' => 'approved',
                'approved_at' => now(),
            ]);

            // Update user to require password change
            $user = $resetRequest->user;
            $user->update([
                'force_password_change' => true,
                'password' => Hash::make($temporaryPassword),
            ]);

            // Send temporary password to user
            Mail::to($user->email)->send(new TemporaryPasswordMail($user, $temporaryPassword));

            // Track the approval
            ActivityTracker::trackPasswordResetReview($resetRequest, 'approved');

            return response()->view('password-reset-response', [
                'success' => true,
                'message' => 'Password reset approved! Temporary password has been sent to ' . $user->email,
            ], 200);
        } catch (\Exception $e) {
            return response()->view('password-reset-response', [
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Admin rejects password reset request
     */
    public function rejectReset($id)
    {
        try {
            $resetRequest = PasswordResetRequest::findOrFail($id);

            // Check if already processed
            if ($resetRequest->status !== 'pending') {
                return response()->view('password-reset-response', [
                    'success' => false,
                    'message' => 'This request has already been processed.',
                ], 400);
            }

            // Update request status
            $resetRequest->update([
                'status' => 'rejected',
            ]);

            // Track the rejection
            ActivityTracker::trackPasswordResetReview($resetRequest, 'rejected');

            return response()->view('password-reset-response', [
                'success' => false,
                'message' => 'Password reset request has been rejected.',
            ], 200);
        } catch (\Exception $e) {
            return response()->view('password-reset-response', [
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get password reset request status
     */
    public function getStatus(Request $request)
    {
        try {
            $validated = $request->validate([
                'email' => 'required|email',
            ]);

            $resetRequest = PasswordResetRequest::where('email', $validated['email'])
                ->latest()
                ->first();

            if (!$resetRequest) {
                return response()->json([
                    'success' => true,
                    'status' => null,
                    'message' => 'No reset request found.',
                ], 200);
            }

            return response()->json([
                'success' => true,
                'status' => $resetRequest->status,
                'message' => 'Reset request status retrieved.',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get all pending password reset requests (for admin dashboard)
     */
    public function getPendingRequests()
    {
        try {
            $requests = PasswordResetRequest::where('status', 'pending')
                ->with('user')
                ->latest()
                ->get();

            return response()->json([
                'success' => true,
                'data' => $requests,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage(),
            ], 500);
        }
    }
}
