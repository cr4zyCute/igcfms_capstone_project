<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Transaction;
use App\Models\Disbursement;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Services\ActivityTracker;

class DisbursementController extends Controller
{
    // Get all disbursements
    public function index()
    {
        $disbursements = Disbursement::with('transaction')->get();
        return response()->json($disbursements);
    }

    // Create a new disbursement (cheque)
    public function store(Request $request)
    {
        $request->validate([
            'transaction_id' => 'required|exists:transactions,id',
            'payee_name' => 'required|string|max:100',
            'method' => 'required|in:Cash,Cheque',
            'cheque_number' => 'nullable|string|max:50|unique:disbursements,cheque_number',
            'bank_name' => 'nullable|string|max:255',
            'account_number' => 'nullable|string|max:100',
            'amount' => 'nullable|numeric|min:0',
            'issue_date' => 'nullable|date',
            'memo' => 'nullable|string',
            'fund_account_id' => 'nullable|exists:fund_accounts,id',
        ]);

        try {
            DB::beginTransaction();

            // Create disbursement record
            $disbursement = Disbursement::create([
                'transaction_id' => $request->transaction_id,
                'payee_name' => $request->payee_name,
                'method' => $request->method,
                'cheque_number' => $request->cheque_number,
                'bank_name' => $request->bank_name,
                'account_number' => $request->account_number,
                'amount' => $request->amount,
                'issue_date' => $request->issue_date ?: now()->toDateString(),
                'memo' => $request->memo,
                'fund_account_id' => $request->fund_account_id,
                'issued_by' => Auth::id(),
                'issued_at' => now(),
            ]);

            // Update the transaction to mark it as processed
            $transaction = Transaction::find($request->transaction_id);
            if ($transaction) {
                $transaction->approved_by = Auth::id();
                $transaction->save();
            }

            DB::commit();

            // Track disbursement activity
            ActivityTracker::log(
                $request->method === 'Cheque' ? 'cheque_issued' : 'disbursement_created',
                Auth::user()->name . " (" . Auth::user()->role . ") issued a " . strtolower($request->method) . " disbursement of ₱" . number_format($request->amount, 2) . " to " . $request->payee_name,
                Auth::user(),
                [
                    'disbursement_id' => $disbursement->id,
                    'transaction_id' => $request->transaction_id,
                    'payee_name' => $request->payee_name,
                    'method' => $request->method,
                    'amount' => $request->amount,
                    'cheque_number' => $request->cheque_number,
                    'bank_name' => $request->bank_name,
                ]
            );

            return response()->json($disbursement->load('transaction'), 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create disbursement',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Get disbursements with cheque method
    public function cheques()
    {
        $cheques = Disbursement::where('method', 'Cheque')
            ->with('transaction')
            ->orderBy('issued_at', 'desc')
            ->get();
        
        return response()->json($cheques);
    }

    // Show specific disbursement
    public function show($id)
    {
        $disbursement = Disbursement::with('transaction')->findOrFail($id);
        return response()->json($disbursement);
    }
}
