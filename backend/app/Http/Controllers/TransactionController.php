<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\OverrideRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use App\Services\ActivityTracker;

class TransactionController extends Controller
{
    // ... your other methods ...

    public function index(Request $request)
    {
        $query = Transaction::query()->with(['fundAccount', 'creator']);

        // Optional filter by comma-separated fund account IDs
        if ($request->filled('accountIds')) {
            $ids = collect(explode(',', (string) $request->query('accountIds')))
                ->map(fn($v) => (int) trim($v))
                ->filter(fn($v) => $v > 0)
                ->unique()
                ->values()
                ->all();

            if (!empty($ids)) {
                $query->whereIn('fund_account_id', $ids);
            }
        }

        $transactions = $query->orderByDesc('created_at')->get();

        return response()->json($transactions, 200);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|in:Collection,Disbursement',
            'amount' => 'required|numeric|min:0.01',
            'description' => 'nullable|string',
            'fund_account_id' => 'required|exists:fund_accounts,id',
            'mode_of_payment' => 'required|in:Cash,Cheque,Bank Transfer',
            'payer_name' => 'required_if:type,Collection|string|max:100',
            // Remove manual receipt_number requirement - we'll auto-generate
            'recipient' => 'required_if:type,Collection|string|max:100',
            'department' => 'required_if:type,Collection|string|max:100',
            'category' => 'required_if:type,Collection|string|max:100',
            'reference' => 'nullable|string|max:255',
            // Disbursement-specific (optional if schema supports it)
            'recipient_account_id' => 'nullable|exists:recipient_accounts,id',
            'purpose' => 'nullable|string',
        ]);

        // Get authenticated user
        $user = Auth::user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Authentication required'
            ], 401);
        }

        // Auto-generate receipt number and reference number (optimized)
        $today = now()->format('Ymd');
        $transactionType = $validated['type'];
        
        // Use single query to get both counts efficiently
        $counts = DB::table('transactions')
            ->selectRaw('
                COUNT(CASE WHEN DATE(created_at) = CURDATE() AND type = ? THEN 1 END) as daily_count,
                COUNT(CASE WHEN YEAR(created_at) = YEAR(NOW()) AND type = ? THEN 1 END) as yearly_count
            ', [$transactionType, $transactionType])
            ->first();
        
        $dailyCount = ($counts->daily_count ?? 0) + 1;
        $yearlyCount = ($counts->yearly_count ?? 0) + 1;
        
        $receiptNo = '';
        $referenceNo = '';
        
        if ($transactionType === 'Collection') {
            // RCPT-20250919-0001
            $receiptNo = 'RCPT-' . $today . '-' . str_pad($dailyCount, 4, '0', STR_PAD_LEFT);
            // COL-2025-0001 (yearly sequential for collections)
            $referenceNo = 'COL-' . now()->year . '-' . str_pad($yearlyCount, 4, '0', STR_PAD_LEFT);
        } else {
            // DIS-20250919-0001
            $receiptNo = 'DIS-' . $today . '-' . str_pad($dailyCount, 4, '0', STR_PAD_LEFT);
            // DIS-2025-0001 (yearly sequential for disbursements)
            $referenceNo = 'DIS-' . now()->year . '-' . str_pad($yearlyCount, 4, '0', STR_PAD_LEFT);
        }

        // Ensure amount sign: Disbursement should be negative, Collection positive
        $signedAmount = $validated['type'] === 'Disbursement'
            ? -abs($validated['amount'])
            : abs($validated['amount']);

        // Use database transaction for atomicity and better performance
        $transaction = DB::transaction(function () use ($validated, $signedAmount, $transactionType, $receiptNo, $referenceNo, $user) {
            // Create the transaction with auto-generated fields
            $transaction = Transaction::create([
                'type' => $validated['type'],
                'amount' => $signedAmount,
                'description' => $validated['description'] ?? ($transactionType . ' transaction'),
                'fund_account_id' => $validated['fund_account_id'],
                'mode_of_payment' => $validated['mode_of_payment'],
                'created_by' => $user->id,
                'receipt_no' => $receiptNo,
                'reference_no' => $referenceNo,
                'reference' => $validated['reference'] ?? $referenceNo,
                'recipient' => $validated['recipient'] ?? $validated['payer_name'] ?? null,
                'department' => $validated['department'] ?? null,
                'category' => $validated['category'] ?? null,
                'recipient_account_id' => $validated['recipient_account_id'] ?? null,
                'purpose' => $validated['purpose'] ?? null,
            ]);

            // If Collection → also create a receipt record
            if ($validated['type'] === 'Collection') {
                DB::table('receipts')->insert([
                    'transaction_id' => $transaction->id,
                    'payer_name' => $validated['payer_name'],
                    'receipt_number' => $receiptNo,
                    'issued_at' => now(),
                ]);
            }

            return $transaction;
        });

        // Track transaction activity (outside DB transaction for better performance)
        try {
            ActivityTracker::trackTransaction($transaction, $user);
        } catch (\Exception $e) {
            // Log but don't fail the transaction
            \Log::warning('Activity tracking failed: ' . $e->getMessage());
        }

        // Load relationships efficiently
        $transaction->load(['fundAccount:id,name,code', 'creator:id,name']);

        return response()->json([
            'success' => true,
            'message' => 'Transaction created successfully',
            'data' => $transaction
        ], 201);
    }
}
