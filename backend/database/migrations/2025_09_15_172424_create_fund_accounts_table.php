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
        Schema::create('fund_accounts', function (Blueprint $table) {
            $table->id();
            $table->string('name', 255);
            $table->string('code', 50)->unique();
            $table->text('description')->nullable();
            $table->decimal('initial_balance', 15, 2)->default(0);
            $table->decimal('current_balance', 15, 2)->default(0);
            $table->enum('account_type', ['Revenue', 'Expense', 'Asset', 'Liability', 'Equity']);
            $table->string('department', 100)->nullable();
            $table->boolean('is_active')->default(1);
            $table->timestamp('last_reconciled_at')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();


            $table->foreign('created_by')->references('id')->on('users');
        });
    }


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fund_accounts');
    }
};
