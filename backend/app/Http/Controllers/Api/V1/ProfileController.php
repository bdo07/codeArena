<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Submission;
use App\Models\User;
use App\Models\UserChallengeProgress;
use Illuminate\Http\JsonResponse;

class ProfileController extends Controller
{
    /**
     * Get public profile by username.
     */
    public function show(string $username): JsonResponse
    {
        $user = User::where('username', strtolower($username))
            ->with(['badges'])
            ->firstOrFail();

        $solvedProgress = UserChallengeProgress::where('user_id', $user->id)
            ->whereNotNull('solved_at')
            ->with('challenge.tags')
            ->orderBy('solved_at', 'desc')
            ->get();

        $solvedChallenges = $solvedProgress->map(function ($p) {
            return [
                'id' => $p->challenge->id,
                'title' => $p->challenge->title,
                'slug' => $p->challenge->slug,
                'difficulty' => $p->challenge->difficulty,
                'tags' => $p->challenge->tags->pluck('name'),
                'best_score' => $p->best_score,
                'solved_at' => $p->solved_at?->toIso8601String(),
            ];
        });

        $acceptedCount = Submission::where('user_id', $user->id)
            ->where('status', Submission::STATUS_ACCEPTED)
            ->count();

        $totalSubmissions = Submission::where('user_id', $user->id)->count();

        return response()->json([
            'profile' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'xp' => $user->xp,
                'level' => $user->calculateLevel(),
                'role' => $user->role,
                'joined_at' => $user->created_at?->toIso8601String(),
                'solved_count' => $solvedChallenges->count(),
                'accepted_count' => $acceptedCount,
                'total_submissions' => $totalSubmissions,
                'badges' => $user->badges->map(fn ($b) => [
                    'id' => $b->id,
                    'name' => $b->name,
                    'slug' => $b->slug,
                    'description' => $b->description,
                    'icon' => $b->icon,
                    'earned_at' => $b->pivot?->earned_at,
                ]),
                'solved_challenges' => $solvedChallenges,
            ],
        ]);
    }
}
