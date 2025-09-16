<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use App\Models\RegistrationRequest;

class RegistrationRejectedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $request;
    public $reason;

    public function __construct(RegistrationRequest $request, $reason = null)
    {
        $this->request = $request;
        $this->reason = $reason;
    }

    public function build()
    {
        return $this->subject('Your IGCFMS account request was rejected')
            ->view('emails.registration_rejected')
            ->with([
                'request' => $this->request,
                'reason' => $this->reason,
            ]);
    }
}
