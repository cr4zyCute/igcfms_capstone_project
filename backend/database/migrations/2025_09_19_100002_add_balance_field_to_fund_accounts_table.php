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
        Schema::table('fund_accounts', function (Blueprint $table) {
            // Add balance field if it doesn't exist (some components expect this)
            if (!Schema::hasColumn('fund_accounts', 'balance')) {
                $table->decimal('balance', 15, 2)->default(0)->after('current_balance');
            }
            
            // Add deleted_at for soft deletes if not exists
            if (!Schema::hasColumn('fund_accounts', 'deleted_at')) {
                $table->softDeletes();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::table('fund_accounts', function (Blueprint $table) {
            if (Schema::hasColumn('fund_accounts', 'balance')) {
                $table->dropColumn('balance');
            }
            if (Schema::hasColumn('fund_accounts', 'deleted_at')) {
                $table->dropSoftDeletes();
            }
        });
    }
};
