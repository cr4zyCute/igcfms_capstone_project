<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;

class FixForcePasswordChange extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'fix:force-password-change';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Set force_password_change to false for all existing users';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        User::query()->update(['force_password_change' => false]);
        $this->info('✓ All existing users force_password_change set to false');
    }
}
