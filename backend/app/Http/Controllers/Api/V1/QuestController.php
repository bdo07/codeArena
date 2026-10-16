<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\QuestPath;
use App\Models\QuestStage;
use App\Services\QuestService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QuestController extends Controller
{
    public function __construct(
        protected QuestService $questService
    ) {}

    /**
     * List all quest paths with current user's progress and active daily missions.
     * Accessible by guests and authenticated users alike.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user('sanctum');
        $data = $this->questService->getPathsWithProgress($user);

        return response()->json([
            'status' => 'success',
            'data' => $data,
        ]);
    }

    /**
     * Get detail and skill tree node map for a specific quest path.
     * Accessible by guests and authenticated users.
     */
    public function show(Request $request, string $slug): JsonResponse
    {
        $user = $request->user('sanctum');
        $pathDetail = $this->questService->getPathDetail($slug, $user);

        if (!$pathDetail) {
            return response()->json([
                'status' => 'error',
                'message' => 'Quest path not found.',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => $pathDetail,
        ]);
    }

    /**
     * Claim XP and badge rewards for completing all challenges in a stage.
     * Enforces prerequisite completion and prevents duplicate reward farming.
     */
    public function claimStageReward(Request $request, int $stageId): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Authentication required.',
            ], 401);
        }

        $stage = QuestStage::findOrFail($stageId);
        $result = $this->questService->claimStageReward($stage, $user);

        return response()->json([
            'status' => 'success',
            'data' => $result,
        ]);
    }

    /**
     * Claim reward for an accomplished daily mission.
     */
    public function claimDailyMission(Request $request, int $missionId): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Authentication required.',
            ], 401);
        }

        $result = $this->questService->claimDailyMission($missionId, $user);

        return response()->json([
            'status' => 'success',
            'data' => $result,
        ]);
    }

    /**
     * Get authenticated user's personal progression dashboard and deterministic challenge recommendation.
     */
    public function progression(Request $request): JsonResponse
    {
        $user = $request->user('sanctum');
        $progression = $this->questService->getProgressionDashboard($user);

        return response()->json([
            'status' => 'success',
            'data' => $progression,
        ]);
    }
}
