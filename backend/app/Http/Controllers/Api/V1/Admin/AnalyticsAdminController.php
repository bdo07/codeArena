<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Challenge;
use App\Models\Submission;
use App\Models\User;
use App\Services\LanguageCatalogService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class AnalyticsAdminController extends Controller
{
    public function __construct(
        protected LanguageCatalogService $languageService
    ) {}

    /**
     * Get platform administration analytics
     */
    public function index(): JsonResponse
    {
        $totalUsers = User::count();
        $totalChallenges = Challenge::count();
        $publishedChallenges = Challenge::where('is_published', true)->count();
        $totalSubmissions = Submission::count();
        $acceptedSubmissions = Submission::where('status', Submission::STATUS_ACCEPTED)->count();

        $acceptanceRate = $totalSubmissions > 0
            ? round(($acceptedSubmissions / $totalSubmissions) * 100, 1)
            : 0;

        // Submissions by status
        $statusBreakdown = Submission::selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        // Challenges by category
        $categoryBreakdown = Challenge::selectRaw('category, count(*) as count')
            ->groupBy('category')
            ->pluck('count', 'category');

        // Challenges by difficulty
        $difficultyBreakdown = Challenge::selectRaw('difficulty, count(*) as count')
            ->groupBy('difficulty')
            ->pluck('count', 'difficulty');

        // Challenges by type
        $typeBreakdown = Challenge::selectRaw('challenge_type, count(*) as count')
            ->groupBy('challenge_type')
            ->pluck('count', 'challenge_type');

        // Recent 7 days activity
        $recentDays = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i)->toDateString();
            $count = Submission::whereDate('created_at', $date)->count();
            $recentDays[] = [
                'date' => $date,
                'submissions' => $count,
            ];
        }

        // Judge0 / Evaluator health
        $evaluatorHealth = $this->languageService->checkJudge0Status();

        return response()->json([
            'overview' => [
                'total_users' => $totalUsers,
                'total_challenges' => $totalChallenges,
                'published_challenges' => $publishedChallenges,
                'total_submissions' => $totalSubmissions,
                'acceptance_rate' => $acceptanceRate,
            ],
            'status_breakdown' => $statusBreakdown,
            'category_breakdown' => $categoryBreakdown,
            'difficulty_breakdown' => $difficultyBreakdown,
            'type_breakdown' => $typeBreakdown,
            'activity_trend' => $recentDays,
            'evaluator_health' => $evaluatorHealth,
        ]);
    }
}
