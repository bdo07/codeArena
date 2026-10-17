<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\WeaknessDetectorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WeaknessController extends Controller
{
    public function __construct(
        protected WeaknessDetectorService $weaknessService
    ) {}

    /**
     * Get smart weakness insights and recommendations for authenticated user (or targeted user for admin).
     */
    public function index(Request $request): JsonResponse
    {
        $currentUser = $request->user();
        if (!$currentUser) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $targetUser = $currentUser;
        if ($targetUserId = $request->query('user_id')) {
            $targetUserId = (int) $targetUserId;
            if ($targetUserId !== $currentUser->id) {
                if (!$currentUser->isAdmin()) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Unauthorized to view another user\'s private learning insights.',
                    ], 403);
                }

                $targetUser = User::find($targetUserId);
                if (!$targetUser) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'User not found.',
                    ], 404);
                }
            }
        }

        $forceFresh = $request->boolean('fresh', false);
        $insights = $this->weaknessService->detectWeaknesses($targetUser, $forceFresh);

        return response()->json([
            'status' => 'success',
            'data' => $insights,
        ]);
    }
}
