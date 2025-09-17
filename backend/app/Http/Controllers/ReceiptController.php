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

        $receipt = Receipt::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Receipt created successfully',
            'data' => $receipt
        ]);
    }
}
