<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class FixDuplicateReceipts extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'receipts:fix-duplicates {--date= : Specific date in YYYYMMDD format}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fix duplicate receipt numbers in the database';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $dateFilter = $this->option('date');
        
        $this->info('Searching for duplicate receipt numbers...');
        
        // Build query for duplicates
        $query = DB::table('receipts')
            ->select('receipt_number', DB::raw('COUNT(*) as count'))
            ->groupBy('receipt_number')
            ->having('count', '>', 1);
        
        // If date is specified, filter by that date pattern
        if ($dateFilter) {
            $query->where('receipt_number', 'like', '%' . $dateFilter . '%');
        }
        
        $duplicates = $query->get();
        
        if ($duplicates->isEmpty()) {
            $this->info('No duplicate receipt numbers found.');
            return Command::SUCCESS;
        }
        
        $this->info('Found ' . $duplicates->count() . ' duplicate receipt numbers.');
        
        foreach ($duplicates as $duplicate) {
            $this->line('Fixing duplicate: ' . $duplicate->receipt_number);
            
            // Get all receipts with this duplicate number
            $receiptsWithDuplicate = DB::table('receipts')
                ->where('receipt_number', $duplicate->receipt_number)
                ->orderBy('id')
                ->get();
            
            // Keep the first one, update the rest
            $counter = 1;
            foreach ($receiptsWithDuplicate as $index => $receipt) {
                if ($index > 0) { // Skip the first one
                    // Extract the base receipt number and date
                    if (preg_match('/^(RCPT-\d{8})-\d{4}/', $receipt->receipt_number, $matches)) {
                        $baseNumber = $matches[1];
                        
                        // Find the next available number for this date
                        $nextNumber = $this->getNextAvailableNumber($baseNumber);
                        $newReceiptNumber = $baseNumber . '-' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
                    } else {
                        // Fallback for non-standard format
                        $newReceiptNumber = $receipt->receipt_number . '-FIX' . $counter;
                        
                        // Make sure the new number doesn't exist
                        while (DB::table('receipts')->where('receipt_number', $newReceiptNumber)->exists()) {
                            $counter++;
                            $newReceiptNumber = $receipt->receipt_number . '-FIX' . $counter;
                        }
                    }
                    
                    // Update the receipt
                    DB::table('receipts')
                        ->where('id', $receipt->id)
                        ->update(['receipt_number' => $newReceiptNumber]);
                    
                    // Also update the corresponding transaction if it exists
                    $transaction = DB::table('transactions')
                        ->where('id', $receipt->transaction_id)
                        ->first();
                    
                    if ($transaction) {
                        DB::table('transactions')
                            ->where('id', $receipt->transaction_id)
                            ->update(['receipt_no' => $newReceiptNumber]);
                    }
                    
                    $this->info('  Updated receipt #' . $receipt->id . ' to: ' . $newReceiptNumber);
                    $counter++;
                }
            }
        }
        
        $this->info('Duplicate receipt numbers fixed successfully.');
        
        return Command::SUCCESS;
    }
    
    /**
     * Get the next available number for a given base receipt number
     */
    private function getNextAvailableNumber($baseNumber)
    {
        $maxNumber = DB::table('receipts')
            ->where('receipt_number', 'like', $baseNumber . '-%')
            ->selectRaw("MAX(CAST(SUBSTRING_INDEX(receipt_number, '-', -1) AS UNSIGNED)) as max_num")
            ->value('max_num');
        
        return ($maxNumber ?? 0) + 1;
    }
}
