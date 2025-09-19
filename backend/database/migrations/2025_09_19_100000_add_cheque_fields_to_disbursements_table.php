<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::table('disbursements', function (Blueprint $table) {
            $table->string('bank_name', 255)->nullable()->after('cheque_number');
            $table->string('account_number', 100)->nullable()->after('bank_name');
            $table->decimal('amount', 15, 2)->nullable()->after('account_number');
            $table->date('issue_date')->nullable()->after('amount');
            $table->text('memo')->nullable()->after('issue_date');
            $table->unsignedBigInteger('fund_account_id')->nullable()->after('memo');
            $table->unsignedBigInteger('issued_by')->nullable()->after('fund_account_id');
            
            // Add foreign key constraints
            $table->foreign('fund_account_id')->references('id')->on('fund_accounts')->onDelete('set null');
            $table->foreign('issued_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::table('disbursements', function (Blueprint $table) {
            $table->dropForeign(['fund_account_id']);
            $table->dropForeign(['issued_by']);
            $table->dropColumn([
                'bank_name',
                'account_number', 
                'amount',
                'issue_date',
                'memo',
                'fund_account_id',
                'issued_by'
            ]);
        });
    }
};
