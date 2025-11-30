<?php

namespace App\Http\Controllers;

use App\Models\RecipientAccount;
use App\Models\FundAccount;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;

class RecipientAccountController extends Controller
{
    /**
     * Display a listing of recipient accounts
     */
    public function index(Request $request): JsonResponse
    {
        $query = RecipientAccount::with('fundAccount');

        // Filter by type if provided
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        // Filter by status if provided
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Search functionality
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('contact_person', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $recipients = $query->orderBy('created_at', 'desc')->get();

        // Compute disbursement totals per recipient
        $recipients->transform(function ($recipient) {
            $txQuery = Transaction::where('recipient_account_id', $recipient->id)
                ->where('type', 'Disbursement');

            $recipient->total_transactions = (int) $txQuery->count();
            // Use ABS to present positive totals for paid-out amounts
            $recipient->total_amount = (float) $txQuery->sum(DB::raw('ABS(amount)'));
            return $recipient;
        });

        return response()->json([
            'success' => true,
            'data' => $recipients
        ]);
    }

    /**
     * Store a newly created recipient account
     */
    public function store(Request $request): JsonResponse
    {
        $rules = [
            'name' => 'required|string|max:255',
            'type' => 'required|in:disbursement,collection',
            'contact_person' => 'required|string|max:255',
            'email' => 'required|email|unique:recipient_accounts,email',
            'phone' => 'required|string|max:20',
            'address' => 'required|string',
            'fund_code' => 'nullable|string|max:50',
            'description' => 'nullable|string',
            'fund_account_id' => 'nullable|exists:fund_accounts,id',
            'id_number' => 'nullable|string|max:50',
            'bank_account' => 'nullable|string|max:100',
            'bank_name' => 'nullable|string|max:255',
            'account_number' => 'nullable|string|max:100',
            'account_type' => 'nullable|string|max:50',
        ];

        // Add conditional validation based on type
        if ($request->type === 'collection') {
            $rules['fund_code'] = 'required|string|max:50';
            $rules['description'] = 'required|string';
        }

        $validated = $request->validate($rules);

        // Map account_number -> bank_account if provided
        if (empty($validated['bank_account']) && $request->filled('account_number')) {
            $validated['bank_account'] = $request->input('account_number');
        }

        try {
            $recipient = RecipientAccount::create($validated);
            $recipient->load('fundAccount');

            return response()->json([
                'success' => true,
                'message' => 'Recipient account created successfully',
                'data' => $recipient
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create recipient account',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified recipient account
     */
    public function show(RecipientAccount $recipientAccount): JsonResponse
    {
        $recipientAccount->load('fundAccount');

        // Include computed totals
        $txQuery = Transaction::where('recipient_account_id', $recipientAccount->id)
            ->where('type', 'Disbursement');
        $recipientAccount->total_transactions = (int) $txQuery->count();
        $recipientAccount->total_amount = (float) $txQuery->sum(DB::raw('ABS(amount)'));

        return response()->json([
            'success' => true,
            'data' => $recipientAccount
        ]);
    }

    /**
     * Update the specified recipient account
     */
    public function update(Request $request, RecipientAccount $recipientAccount): JsonResponse
    {
        $rules = [
            'name' => 'required|string|max:255',
            'type' => 'required|in:disbursement,collection',
            'contact_person' => 'required|string|max:255',
            'email' => [
                'required',
                'email',
                Rule::unique('recipient_accounts')->ignore($recipientAccount->id)
            ],
            'phone' => 'required|string|max:20',
            'address' => 'required|string',
            'fund_code' => 'nullable|string|max:50',
            'description' => 'nullable|string',
            'fund_account_id' => 'nullable|exists:fund_accounts,id',
            'id_number' => 'nullable|string|max:50',
            'bank_account' => 'nullable|string|max:100',
            'bank_name' => 'nullable|string|max:255',
            'account_number' => 'nullable|string|max:100',
            'account_type' => 'nullable|string|max:50',
        ];

        // Add conditional validation based on type
        if ($request->type === 'collection') {
            $rules['fund_code'] = 'required|string|max:50';
            $rules['description'] = 'required|string';
        }

        $validated = $request->validate($rules);

        // Map account_number -> bank_account if provided
        if (empty($validated['bank_account']) && $request->filled('account_number')) {
            $validated['bank_account'] = $request->input('account_number');
        }

        try {
            $recipientAccount->update($validated);
            $recipientAccount->load('fundAccount');

            return response()->json([
                'success' => true,
                'message' => 'Recipient account updated successfully',
                'data' => $recipientAccount
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update recipient account',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified recipient account
     */
    public function destroy(RecipientAccount $recipientAccount): JsonResponse
    {
        try {
            $recipientAccount->delete();

            return response()->json([
                'success' => true,
                'message' => 'Recipient account deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete recipient account',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Toggle recipient account status
     */
    public function toggleStatus(RecipientAccount $recipientAccount): JsonResponse
    {
        try {
            $newStatus = $recipientAccount->status === 'active' ? 'inactive' : 'active';
            $recipientAccount->update(['status' => $newStatus]);

            return response()->json([
                'success' => true,
                'message' => "Recipient account {$newStatus}",
                'data' => $recipientAccount
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to toggle status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get fund accounts for dropdown
     */
    public function getFundAccounts(): JsonResponse
    {
        $fundAccounts = FundAccount::where('status', 'active')
            ->select('id', 'account_name', 'account_number', 'balance')
            ->orderBy('account_name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $fundAccounts
        ]);
    }

    /**
     * Get statistics
     */
    public function getStats(): JsonResponse
    {
        $stats = [
            'total' => RecipientAccount::count(),
            'disbursement' => RecipientAccount::where('type', 'disbursement')->count(),
            'collection' => RecipientAccount::where('type', 'collection')->count(),
            'active' => RecipientAccount::where('status', 'active')->count(),
            'inactive' => RecipientAccount::where('status', 'inactive')->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }

    /**
     * Get transactions for a specific recipient account
     */
    public function getTransactions(RecipientAccount $recipientAccount): JsonResponse
    {
        try {
            $transactions = Transaction::where('recipient_account_id', $recipientAccount->id)
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $transactions
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch transactions',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
