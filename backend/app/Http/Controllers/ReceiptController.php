<?php

namespace App\Http\Controllers;

use App\Models\Receipt;
use Illuminate\Http\Request;

class ReceiptController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'transaction_id' => 'required|exists:transactions,id',
            'payer_name' => 'required|string|max:100',
            'receipt_number' => 'required|string|max:50|unique:receipts,receipt_number',
        ]);

        // Add issued_at timestamp
        $validated['issued_at'] = now();

        $receipt = Receipt::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Receipt created successfully',
            'data' => $receipt
        ]);
    }

    // Add index method for getting receipts
    public function index()
    {
        $receipts = Receipt::with('transaction')->get();
        return response()->json($receipts);
    }

    // Update receipt
    public function update(Request $request, $id)
    {
        $receipt = Receipt::findOrFail($id);

        $validated = $request->validate([
            'payer_name' => 'sometimes|required|string|max:100',
            'receipt_number' => 'sometimes|required|string|max:50|unique:receipts,receipt_number,' . $id,
            'issued_at' => 'sometimes|required|date',
        ]);

        $receipt->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Receipt updated successfully',
            'data' => $receipt
        ]);
    }

    // Delete receipt
    public function destroy($id)
    {
        $receipt = Receipt::findOrFail($id);
        $receipt->delete();

        return response()->json([
            'success' => true,
            'message' => 'Receipt deleted successfully'
        ]);
    }
}
