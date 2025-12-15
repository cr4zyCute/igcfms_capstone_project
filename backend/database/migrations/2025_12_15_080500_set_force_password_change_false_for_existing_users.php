<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Set force_password_change to false for all existing users
        DB::table('users')->update(['force_password_change' => false]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to true if needed
        DB::table('users')->update(['force_password_change' => true]);
    }
};
