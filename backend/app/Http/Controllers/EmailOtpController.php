<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use App\Mail\EmailVerificationOtpMail;

class EmailOtpController extends Controller
{
    /**
     * Send OTP to the provided email address
     */
    public function sendOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'name' => 'nullable|string|max:100',
        ]);

        $email = strtolower(trim($request->email));
        $name = $request->name ?? 'User';

        // Generate 5-digit OTP
        $otp = str_pad(random_int(0, 99999), 5, '0', STR_PAD_LEFT);

        // Store OTP in cache for 10 minutes
        $cacheKey = 'email_otp_' . md5($email);
        Cache::put($cacheKey, [
            'otp' => $otp,
            'attempts' => 0,
            'created_at' => now(),
        ], now()->addMinutes(10));

        // Log the OTP for testing purposes
        Log::info('=== OTP GENERATED ===', [
            'email' => $email,
            'otp' => $otp,
            'name' => $name,
            'expires_at' => now()->addMinutes(10),
        ]);

        try {
            Mail::to($email)->send(new EmailVerificationOtpMail($otp, $name));

            return response()->json([
                'success' => true,
                'message' => 'OTP sent successfully to ' . $email,
            ]);
        } catch (\Exception $e) {
            Log::error('OTP Send Error: ' . $e->getMessage(), [
                'email' => $email,
                'exception' => $e,
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to send OTP: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Verify the OTP entered by user
     */
    public function verifyOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'otp' => 'required|string|size:5',
        ]);

        $email = strtolower(trim($request->email));
        $cacheKey = 'email_otp_' . md5($email);

        $cachedData = Cache::get($cacheKey);

        if (!$cachedData) {
            return response()->json([
                'success' => false,
                'message' => 'OTP has expired. Please request a new one.',
            ], 400);
        }

        // Check max attempts (3 attempts allowed)
        if ($cachedData['attempts'] >= 3) {
            Cache::forget($cacheKey);
            return response()->json([
                'success' => false,
                'message' => 'Too many failed attempts. Please request a new OTP.',
            ], 400);
        }

        if ($cachedData['otp'] !== $request->otp) {
            // Increment attempts
            $cachedData['attempts']++;
            Cache::put($cacheKey, $cachedData, now()->addMinutes(10));

            $remainingAttempts = 3 - $cachedData['attempts'];
            return response()->json([
                'success' => false,
                'message' => "Invalid OTP. {$remainingAttempts} attempt(s) remaining.",
            ], 400);
        }

        // OTP verified successfully - remove from cache
        Cache::forget($cacheKey);

        return response()->json([
            'success' => true,
            'message' => 'Email verified successfully.',
            'verified' => true,
        ]);
    }
}
