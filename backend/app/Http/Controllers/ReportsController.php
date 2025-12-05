<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Report;
use Illuminate\Support\Facades\Auth;
use App\Services\ActivityTracker;

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

        // Track report generation
        ActivityTracker::trackReportGeneration($request->report_type, Auth::user(), [
            'report_id' => $report->id,
            'date_from' => $request->date_from,
            'date_to' => $request->date_to,
            'department' => $request->department,
            'category' => $request->category,
            'format' => $request->format ?? 'pdf',
        ]);

        // Load the relationship before returning
        return response()->json($report->load('generatedBy'), 201);
    }

    // Year-End Closing - Archive current year data
    public function yearEndClosing(Request $request)
    {
        $request->validate([
            'year' => 'required|integer|min:2000|max:2100',
            'stats' => 'required|array',
            'transactions' => 'nullable|array',
            'monthlyData' => 'nullable|array',
            'departmentStats' => 'nullable|array',
            'auditLogs' => 'nullable|array',
            'archivedAt' => 'required|date_format:Y-m-d\TH:i:s.000\Z'
        ]);

        try {
            // Create a year-end closing report
            $report = Report::create([
                'report_type' => 'year-end-closing',
                'date_from' => $request->year . '-01-01',
                'date_to' => $request->year . '-12-31',
                'department' => 'System',
                'category' => 'Year-End Closing',
                'include_transactions' => true,
                'include_overrides' => true,
                'format' => 'json',
                'generated_by' => Auth::id(),
                'file_path' => null,
                'generated_at' => now(),
                'data' => json_encode([
                    'year' => $request->year,
                    'stats' => $request->stats,
                    'transactions' => $request->transactions ?? [],
                    'monthlyData' => $request->monthlyData ?? [],
                    'departmentStats' => $request->departmentStats ?? [],
                    'auditLogs' => $request->auditLogs ?? [],
                    'archivedAt' => $request->archivedAt
                ])
            ]);

            // Track year-end closing activity
            ActivityTracker::trackReportGeneration('year-end-closing', Auth::user(), [
                'report_id' => $report->id,
                'year' => $request->year,
                'archived_at' => $request->archivedAt
            ]);

            return response()->json([
                'success' => true,
                'message' => "Year-End Closing for {$request->year} completed successfully.",
                'report' => $report->load('generatedBy')
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Year-End Closing failed: ' . $e->getMessage()
            ], 500);
        }
    }

    // Get Year-End Closing history
    public function yearEndHistory()
    {
        $closings = Report::where('report_type', 'year-end-closing')
            ->with('generatedBy')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($closings);
    }
}
