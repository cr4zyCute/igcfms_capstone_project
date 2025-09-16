<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\RegistrationRequest;
use App\Mail\RegistrationApprovedMail;
use App\Mail\RegistrationRejectedMail;
use Illuminate\Support\Facades\Mail;

class AdminController extends Controller
{
    public function approve($id)
    {
        $request = RegistrationRequest::find($id);

        if (!$request) {
            return response()->json(['message' => 'Registration request not found'], 404);
        }

        // Approve the request
        $request->status = 'approved';
        $request->approved_by = 1;
        $request->approved_at = now();
        $request->save();

        // Create a user account from approved registration
        $user = \App\Models\User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => $request->password,
            'role' => $request->role,
        ]);
        Mail::to($user->email)->send(new RegistrationApprovedMail($user));
        return response()->json([
            'message' => 'Registration request approved and user created',
            'user' => $user
        ], 200);
    }

    public function reject($id, Request $request)
    {
        $registration = RegistrationRequest::findOrFail($id);

        // Optionally, capture rejection reason from request
        $reason = $request->input('reason', 'No reason provided');

        $registration->status = 'rejected';
        $registration->rejection_reason = $reason;
        $registration->approved_by = 1;
        $registration->save();

        // Send rejection email to the user
        Mail::to($registration->email)->send(new RegistrationRejectedMail($registration, $reason));

        return response()->json([
            'message' => 'Registration request rejected and user notified.'
        ]);
    }
}
