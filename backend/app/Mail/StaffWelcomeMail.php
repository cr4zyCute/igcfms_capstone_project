<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class StaffWelcomeMail extends Mailable
{
    use Queueable, SerializesModels;

    public $name;
    public $email;
    public $password;
    public $role;

    public function __construct(string $name, string $email, string $password, string $role)
    {
        $this->name = $name;
        $this->email = $email;
        $this->password = $password;
        $this->role = $role;
    }

    public function build()
    {
        return $this->subject('Welcome to IGCFMS - Your Account Credentials')
                    ->view('emails.staff-welcome')
                    ->with([
                        'name' => $this->name,
                        'email' => $this->email,
                        'password' => $this->password,
                        'role' => $this->role,
                    ]);
    }
}
