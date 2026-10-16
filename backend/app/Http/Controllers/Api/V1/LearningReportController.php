<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\LearningReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LearningReportController extends Controller
{
    public function __construct(
        protected LearningReportService $reportService
    ) {}

    /**
     * Get learning analytics report for current authenticated user or targeted user (admin only).
     */
    public function show(Request $request, ?int $userId = null): JsonResponse
    {
        $currentUser = $request->user();
        if (!$currentUser) {
            return response()->json([
                'status' => 'error',
                'message' => 'Authentication required.',
            ], 401);
        }

        // Determine target user
        $targetUser = $currentUser;
        if ($userId && $userId !== $currentUser->id) {
            if (!$currentUser->isAdmin()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Unauthorized to access another user\'s private learning report.',
                ], 403);
            }
            $targetUser = User::findOrFail($userId);
        }

        $validated = $request->validate([
            'range' => 'nullable|string|in:7d,30d,90d,all,custom',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $report = $this->reportService->generateReport($targetUser, $validated);

        return response()->json([
            'status' => 'success',
            'data' => $report,
        ]);
    }
}
