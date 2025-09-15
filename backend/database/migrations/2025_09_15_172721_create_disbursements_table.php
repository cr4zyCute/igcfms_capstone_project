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
        Schema::create('disbursements', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('transaction_id');
            $table->string('payee_name', 100);
            $table->enum('method', ['Cash', 'Cheque']);
            $table->string('cheque_number', 50)->nullable();
            $table->timestamp('issued_at')->useCurrent();
            $table->foreign('transaction_id')->references('id')->on('transactions');
        });
    }


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('disbursements');
    }
};
