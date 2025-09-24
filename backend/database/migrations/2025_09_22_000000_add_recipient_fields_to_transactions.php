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
        Schema::table('transactions', function (Blueprint $table) {
            $table->unsignedBigInteger('recipient_account_id')->nullable()->after('recipient');
            $table->string('purpose')->nullable()->after('recipient_account_id');
            
            // Add foreign key constraint
            $table->foreign('recipient_account_id')->references('id')->on('recipient_accounts')->onDelete('set null');
            
            // Add index for better performance
            $table->index('recipient_account_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropForeign(['recipient_account_id']);
            $table->dropIndex(['recipient_account_id']);
            $table->dropColumn(['recipient_account_id', 'purpose']);
        });
    }
};
