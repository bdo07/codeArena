<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\GitPlaygroundService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GitPlaygroundController extends Controller
{
    public function __construct(
        protected GitPlaygroundService $gitPlaygroundService
    ) {}

    /**
     * Get user progress across Git scenarios.
     * Publicly accessible: returns empty progress for guests.
     */
    public function progress(Request $request): JsonResponse
    {
        $user = $request->user('sanctum');
        $data = $this->gitPlaygroundService->getProgress($user);

        return response()->json([
            'status' => 'success',
            'data' => $data,
        ]);
    }

    /**
     * Record scenario completion and award XP.
     * Requires authentication.
     */
    public function complete(Request $request, string $scenarioId): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Authentication required.',
            ], 401);
        }

        $commandsCount = (int) $request->input('commands_count', 1);
        $result = $this->gitPlaygroundService->completeScenario($user, $scenarioId, $commandsCount);

        return response()->json([
            'status' => 'success',
            'data' => $result,
        ]);
    }
}
