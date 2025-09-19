<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use App\Models\OverrideRequest;

class OverrideRequestReviewedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $overrideRequest;
    public $transaction;
    public $reviewedBy;

    /**
     * Create a new message instance.
     */
    public function __construct(OverrideRequest $overrideRequest)
    {
        $this->overrideRequest = $overrideRequest;
        $this->transaction = $overrideRequest->transaction;
        $this->reviewedBy = $overrideRequest->reviewedBy;
    }

    /**
     * Build the message.
     */
    public function build()
    {
        $status = ucfirst($this->overrideRequest->status);
        
        return $this->subject("Override Request {$status} - IGCFMS")
                    ->view('emails.override-request-reviewed')
                    ->with([
                        'overrideRequest' => $this->overrideRequest,
                        'transaction' => $this->transaction,
                        'reviewedBy' => $this->reviewedBy,
                        'status' => $status,
                    ]);
    }
}
