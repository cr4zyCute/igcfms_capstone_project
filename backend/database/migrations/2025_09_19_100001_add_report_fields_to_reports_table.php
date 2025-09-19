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
        Schema::table('reports', function (Blueprint $table) {
            $table->date('date_from')->nullable()->after('report_type');
            $table->date('date_to')->nullable()->after('date_from');
            $table->string('department', 100)->nullable()->after('date_to');
            $table->string('category', 100)->nullable()->after('department');
            $table->boolean('include_transactions')->default(true)->after('category');
            $table->boolean('include_overrides')->default(false)->after('include_transactions');
            $table->string('format', 50)->default('pdf')->after('include_overrides');
            $table->string('file_size', 50)->nullable()->after('file_path');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::table('reports', function (Blueprint $table) {
            $table->dropColumn([
                'date_from',
                'date_to',
                'department',
                'category',
                'include_transactions',
                'include_overrides',
                'format',
                'file_size'
            ]);
        });
    }
};
