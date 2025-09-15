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
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['Collection', 'Disbursement', 'Override']);
            $table->decimal('amount', 15, 2);
            $table->text('description')->nullable();
            $table->string('recipient', 255)->nullable();
            $table->string('department', 100)->nullable();
            $table->string('category', 100)->nullable();
            $table->string('reference', 100)->nullable();
            $table->string('receipt_no', 50)->nullable();
            $table->string('reference_no', 50)->nullable();
            $table->unsignedBigInteger('fund_account_id')->nullable();
            $table->enum('mode_of_payment', ['Cash', 'Cheque', 'Bank Transfer']);
            $table->unsignedBigInteger('created_by');
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamps();

            $table->foreign('fund_account_id')->references('id')->on('fund_accounts');
            $table->foreign('created_by')->references('id')->on('users');
            $table->foreign('approved_by')->references('id')->on('users');
        });
    }


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
