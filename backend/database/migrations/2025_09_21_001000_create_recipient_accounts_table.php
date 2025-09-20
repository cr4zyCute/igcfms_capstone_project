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
        Schema::create('recipient_accounts', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('type', ['disbursement', 'collection']);
            $table->string('contact_person');
            $table->string('email')->unique();
            $table->string('phone');
            $table->text('address');
            
            // For disbursement recipients
            $table->string('tax_id')->nullable();
            $table->string('bank_account')->nullable();
            
            // For collection funds
            $table->string('fund_code')->nullable();
            $table->text('description')->nullable();
            $table->unsignedBigInteger('fund_account_id')->nullable();
            
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->integer('total_transactions')->default(0);
            $table->decimal('total_amount', 15, 2)->default(0.00);
            
            $table->timestamps();
            
            // Foreign key constraint
            $table->foreign('fund_account_id')->references('id')->on('fund_accounts')->onDelete('set null');
            
            // Indexes
            $table->index('type');
            $table->index('status');
            $table->index('fund_account_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('recipient_accounts');
    }
};
