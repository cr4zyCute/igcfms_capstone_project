<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Report;
use Illuminate\Support\Facades\Auth;

class ReportsController extends Controller
{
    // List reports (Cashier sees own, Admin sees all)
    public function index()
    {
        $user = Auth::user();

        if ($user->role === 'Admin') {
            $reports = Report::with('generatedBy')->get();
        } else {
            $reports = Report::where('generated_by', $user->id)
                ->with('generatedBy')
                ->get();
        }

        // Make sure the relationship data is included
        return response()->json($reports);
    }

    // Generate new report
    public function store(Request $request)
    {
        $request->validate([
            'report_type' => 'required|in:daily,monthly,yearly',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
            'department' => 'nullable|string|max:100',
            'category' => 'nullable|string|max:100',
            'include_transactions' => 'nullable|boolean',
            'include_overrides' => 'nullable|boolean',
            'format' => 'nullable|in:pdf,excel,csv',
        ]);

        $report = Report::create([
            'report_type' => $request->report_type,
            'date_from' => $request->date_from,
            'date_to' => $request->date_to,
            'department' => $request->department,
            'category' => $request->category,
            'include_transactions' => $request->include_transactions ?? true,
            'include_overrides' => $request->include_overrides ?? false,
            'format' => $request->format ?? 'pdf',
            'generated_by' => Auth::id(),
            'file_path' => null,
            'generated_at' => now(),
        ]);

        // Load the relationship before returning
        return response()->json($report->load('generatedBy'), 201);
    }
}
