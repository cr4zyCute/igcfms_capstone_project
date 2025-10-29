<?php

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "Checking indexes on receipts table:\n";
$indexes = DB::select("SHOW INDEX FROM receipts");

foreach ($indexes as $index) {
    echo sprintf("  - %s (Column: %s, Unique: %s)\n", 
        $index->Key_name, 
        $index->Column_name, 
        $index->Non_unique ? 'No' : 'Yes'
    );
}

echo "\nChecking for duplicate receipt numbers:\n";
$duplicates = DB::table('receipts')
    ->select('receipt_number', DB::raw('COUNT(*) as count'))
    ->groupBy('receipt_number')
    ->having('count', '>', 1)
    ->get();

if ($duplicates->isEmpty()) {
    echo "  No duplicates found!\n";
} else {
    foreach ($duplicates as $dup) {
        echo "  - " . $dup->receipt_number . " (Count: " . $dup->count . ")\n";
    }
}
