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
        // Drop the existing unique constraint on code if it exists
        if ($this->indexExists('fund_accounts', 'fund_accounts_code_unique')) {
            Schema::table('fund_accounts', function (Blueprint $table) {
                $table->dropUnique('fund_accounts_code_unique');
            });
        }

        // Create a composite unique index that allows duplicates on soft-deleted rows
        if (! $this->indexExists('fund_accounts', 'fund_accounts_code_deleted_at_unique')) {
            Schema::table('fund_accounts', function (Blueprint $table) {
                $table->unique(['code', 'deleted_at'], 'fund_accounts_code_deleted_at_unique');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop the composite unique index
        if ($this->indexExists('fund_accounts', 'fund_accounts_code_deleted_at_unique')) {
            Schema::table('fund_accounts', function (Blueprint $table) {
                $table->dropUnique('fund_accounts_code_deleted_at_unique');
            });
        }

        // Restore the original unique constraint
        if (! $this->indexExists('fund_accounts', 'fund_accounts_code_unique')) {
            Schema::table('fund_accounts', function (Blueprint $table) {
                $table->unique('code');
            });
        }
    }

    protected function indexExists(string $table, string $index): bool
    {
        return DB::table('information_schema.statistics')
            ->where('table_schema', DB::connection()->getDatabaseName())
            ->where('table_name', $table)
            ->where('index_name', $index)
            ->exists();
    }
};
