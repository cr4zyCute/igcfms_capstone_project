<?php

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

// Find the duplicate receipt
$duplicate = DB::table('receipts')
    ->where('receipt_number', 'RCPT-20251028-0001')
    ->orderBy('id', 'desc')
    ->first();

if ($duplicate) {
    echo "Found duplicate receipt with ID: " . $duplicate->id . "\n";
    
    // Find the next available number for today
    $today = '20251028';
    $maxNumber = DB::table('receipts')
        ->where('receipt_number', 'like', 'RCPT-' . $today . '-%')
        ->selectRaw("MAX(CAST(SUBSTRING(receipt_number, 15, 4) AS UNSIGNED)) as max_num")
        ->value('max_num');
    
    $nextNumber = ($maxNumber ?? 0) + 1;
    $newReceiptNumber = 'RCPT-' . $today . '-' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
    
    echo "Updating to new receipt number: " . $newReceiptNumber . "\n";
    
    // Update the receipt
    DB::table('receipts')
        ->where('id', $duplicate->id)
        ->update(['receipt_number' => $newReceiptNumber]);
    
    // Also update the corresponding transaction
    if ($duplicate->transaction_id) {
        DB::table('transactions')
            ->where('id', $duplicate->transaction_id)
            ->update(['receipt_no' => $newReceiptNumber]);
        echo "Updated transaction ID: " . $duplicate->transaction_id . "\n";
    }
    
    echo "Successfully fixed duplicate receipt!\n";
} else {
    echo "No duplicate receipt found with number RCPT-20251028-0001\n";
    
    // Check if there are any receipts for this date
    $receiptsForDate = DB::table('receipts')
        ->where('receipt_number', 'like', 'RCPT-20251028-%')
        ->count();
    
    echo "Total receipts for date 20251028: " . $receiptsForDate . "\n";
    
    if ($receiptsForDate > 0) {
        $allReceipts = DB::table('receipts')
            ->where('receipt_number', 'like', 'RCPT-20251028-%')
            ->pluck('receipt_number');
        
        echo "Existing receipt numbers:\n";
        foreach ($allReceipts as $receipt) {
            echo "  - " . $receipt . "\n";
        }
    }
}
