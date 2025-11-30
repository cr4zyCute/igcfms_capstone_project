<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('receipts', function (Blueprint $table) {
            if (!Schema::hasColumn('receipts', 'status')) {
                $table->enum('status', ['Issued', 'Cancelled'])
                    ->default('Issued')
                    ->after('receipt_number');
            }

            if (!Schema::hasColumn('receipts', 'cancellation_reason')) {
                $table->text('cancellation_reason')->nullable()->after('status');
            }

            if (!Schema::hasColumn('receipts', 'cancelled_at')) {
                $table->timestamp('cancelled_at')->nullable()->after('cancellation_reason');
            }

            if (!Schema::hasColumn('receipts', 'cancelled_by')) {
                $table->unsignedBigInteger('cancelled_by')->nullable()->after('cancelled_at');
                $table->foreign('cancelled_by')->references('id')->on('users')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('receipts', function (Blueprint $table) {
            if (Schema::hasColumn('receipts', 'cancelled_by')) {
                $table->dropForeign(['cancelled_by']);
                $table->dropColumn('cancelled_by');
            }

            if (Schema::hasColumn('receipts', 'cancelled_at')) {
                $table->dropColumn('cancelled_at');
            }

            if (Schema::hasColumn('receipts', 'cancellation_reason')) {
                $table->dropColumn('cancellation_reason');
            }

            if (Schema::hasColumn('receipts', 'status')) {
                $table->dropColumn('status');
            }
        });
    }
};
