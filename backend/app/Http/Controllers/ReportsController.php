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
        ]);

        $report = Report::create([
            'report_type' => $request->report_type,
            'generated_by' => Auth::id(),
            'file_path' => null,
            'generated_at' => now(), // Make sure to set generated_at
        ]);

        // Load the relationship before returning
        return response()->json($report->load('generatedBy'), 201);
    }
}
