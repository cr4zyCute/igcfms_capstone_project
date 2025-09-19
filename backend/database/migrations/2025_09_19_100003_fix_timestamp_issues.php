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
        // Fix disbursements table - ensure it has proper timestamps
        if (Schema::hasTable('disbursements')) {
            Schema::table('disbursements', function (Blueprint $table) {
                // Add created_at and updated_at if they don't exist
                if (!Schema::hasColumn('disbursements', 'created_at')) {
                    $table->timestamps();
                }
            });
        }

        // Fix reports table - ensure it has proper timestamps
        if (Schema::hasTable('reports')) {
            Schema::table('reports', function (Blueprint $table) {
                // Add created_at and updated_at if they don't exist
                if (!Schema::hasColumn('reports', 'created_at')) {
                    $table->timestamps();
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        // We won't remove timestamps in down method to avoid data loss
    }
};
