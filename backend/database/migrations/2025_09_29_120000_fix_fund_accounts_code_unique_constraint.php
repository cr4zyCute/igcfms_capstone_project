<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * This migration fixes the unique constraint on fund_accounts.code
     * to allow reuse of codes when records are soft-deleted.
     */
    public function up(): void
    {
        // Drop the existing unique constraint on code
        Schema::table('fund_accounts', function (Blueprint $table) {
            $table->dropUnique(['code']);
        });

        // Create a partial unique index that only applies to non-deleted records
        // This allows the same code to exist in soft-deleted records
        DB::statement('CREATE UNIQUE INDEX fund_accounts_code_unique_not_deleted ON fund_accounts (code) WHERE deleted_at IS NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop the partial unique index
        DB::statement('DROP INDEX IF EXISTS fund_accounts_code_unique_not_deleted');
        
        // Restore the original unique constraint
        Schema::table('fund_accounts', function (Blueprint $table) {
            $table->unique('code');
        });
    }
};
