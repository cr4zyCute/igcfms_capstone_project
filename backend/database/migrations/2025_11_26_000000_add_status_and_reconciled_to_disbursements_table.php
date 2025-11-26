<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('disbursements', function (Blueprint $table) {
            $table->enum('status', ['Issued', 'Cleared', 'Cancelled'])
                ->default('Issued')
                ->after('issue_date');
            $table->boolean('reconciled')
                ->default(false)
                ->after('status');
            $table->timestamp('reconciled_at')
                ->nullable()
                ->after('reconciled');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('disbursements', function (Blueprint $table) {
            $table->dropColumn(['status', 'reconciled', 'reconciled_at']);
        });
    }
};
