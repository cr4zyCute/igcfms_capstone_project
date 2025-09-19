<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use App\Models\OverrideRequest;

class OverrideRequestNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public $overrideRequest;
    public $transaction;
    public $requestedBy;

    /**
     * Create a new message instance.
     */
    public function __construct(OverrideRequest $overrideRequest)
    {
        $this->overrideRequest = $overrideRequest;
        $this->transaction = $overrideRequest->transaction;
        $this->requestedBy = $overrideRequest->requestedBy;
    }

    /**
     * Build the message.
     */
    public function build()
    {
        return $this->subject('New Override Request - IGCFMS')
                    ->view('emails.override-request-notification')
                    ->with([
                        'overrideRequest' => $this->overrideRequest,
                        'transaction' => $this->transaction,
                        'requestedBy' => $this->requestedBy,
                    ]);
    }
}
