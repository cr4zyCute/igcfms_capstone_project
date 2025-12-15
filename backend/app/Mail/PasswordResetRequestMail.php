<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PasswordResetRequestMail extends Mailable
{
    use Queueable, SerializesModels;

    public $user;
    public $resetRequest;
    public $approvalLink;

    /**
     * Create a new message instance.
     */
    public function __construct($user, $resetRequest, $approvalLink)
    {
        $this->user = $user;
        $this->resetRequest = $resetRequest;
        $this->approvalLink = $approvalLink;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Password Reset Request - Action Required',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.password-reset-request',
            with: [
                'user' => $this->user,
                'resetRequest' => $this->resetRequest,
                'approvalLink' => $this->approvalLink,
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
