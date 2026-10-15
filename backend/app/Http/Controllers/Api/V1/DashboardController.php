<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\SubmissionResource;
use App\Models\Challenge;
use App\Models\Submission;
use App\Models\UserChallengeProgress;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * Compute and return dynamic user dashboard statistics from actual database records.
     */
    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();

        // Count of unique solved challenges
        $solvedCount = UserChallengeProgress::where('user_id', $user->id)
            ->whereNotNull('solved_at')
            ->count();

        // Total submissions count
        $totalSubmissions = Submission::where('user_id', $user->id)->count();

        // Solved breakdown by difficulty
        $solvedDifficultyCounts = UserChallengeProgress::where('user_challenge_progress.user_id', $user->id)
            ->whereNotNull('solved_at')
            ->join('challenges', 'user_challenge_progress.challenge_id', '=', 'challenges.id')
            ->selectRaw('challenges.difficulty, count(*) as count')
            ->groupBy('challenges.difficulty')
            ->pluck('count', 'difficulty')
            ->toArray();

        // Total available challenges breakdown
        $totalDifficultyCounts = Challenge::where('is_published', true)
            ->selectRaw('difficulty, count(*) as count')
            ->groupBy('difficulty')
            ->pluck('count', 'difficulty')
            ->toArray();

        $difficulties = ['Easy', 'Medium', 'Hard'];
        $difficultyStats = [];
        foreach ($difficulties as $diff) {
            $solved = $solvedDifficultyCounts[$diff] ?? 0;
            $total = $totalDifficultyCounts[$diff] ?? 0;
            $difficultyStats[$diff] = [
                'solved' => $solved,
                'total' => $total,
                'percentage' => $total > 0 ? (int) round(($solved / $total) * 100) : 0,
            ];
        }

        // Recent 5 submissions
        $recentSubmissions = Submission::where('user_id', $user->id)
            ->with(['challenge', 'testResults.testCase'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'xp' => $user->xp,
                'level' => $user->calculateLevel(),
                'role' => $user->role,
                'badges' => $user->badges->map(fn ($b) => [
                    'id' => $b->id,
                    'name' => $b->name,
                    'slug' => $b->slug,
                    'description' => $b->description,
                    'icon' => $b->icon,
                    'earned_at' => $b->pivot?->earned_at,
                ]),
            ],
            'stats' => [
                'solved_count' => $solvedCount,
                'total_challenges' => Challenge::where('is_published', true)->count(),
                'total_submissions' => $totalSubmissions,
                'acceptance_rate' => $totalSubmissions > 0
                    ? (int) round((Submission::where('user_id', $user->id)->where('status', Submission::STATUS_ACCEPTED)->count() / $totalSubmissions) * 100)
                    : 0,
                'difficulty_breakdown' => $difficultyStats,
            ],
            'recent_submissions' => SubmissionResource::collection($recentSubmissions),
        ]);
    }
}
