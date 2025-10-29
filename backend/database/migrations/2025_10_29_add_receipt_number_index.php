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
        // First check if the index already exists
        $indexExists = DB::select("SHOW INDEX FROM receipts WHERE Key_name = 'receipts_receipt_number_unique'");
        
        if (empty($indexExists)) {
            // Add the unique index if it doesn't exist
            Schema::table('receipts', function (Blueprint $table) {
                $table->unique('receipt_number', 'receipts_receipt_number_unique');
            });
        }
        
        // Also add an index on transaction receipt_no for better performance
        $transactionIndexExists = DB::select("SHOW INDEX FROM transactions WHERE Key_name = 'transactions_receipt_no_index'");
        
        if (empty($transactionIndexExists)) {
            Schema::table('transactions', function (Blueprint $table) {
                $table->index('receipt_no', 'transactions_receipt_no_index');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('receipts', function (Blueprint $table) {
            $table->dropUnique('receipts_receipt_number_unique');
        });
        
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropIndex('transactions_receipt_no_index');
        });
    }
};
