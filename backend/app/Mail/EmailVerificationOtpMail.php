<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class EmailVerificationOtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public $otp;
    public $name;

    public function __construct(string $otp, string $name = 'User')
    {
        $this->otp = $otp;
        $this->name = $name;
    }

    public function build()
    {
        return $this->subject('Email Verification OTP - IGCFMS')
                    ->view('emails.email-verification-otp')
                    ->with([
                        'otp' => $this->otp,
                        'name' => $this->name,
                    ]);
    }
}
