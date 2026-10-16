<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeaderboardController extends Controller
{
    /**
     * Get global leaderboard ranked by XP and solved challenges with stable tie-breaking.
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = max(1, min(100, (int) $request->input('per_page', 20)));

        $users = User::withCount([
            'progress as solved_count' => function ($q) {
                $q->whereNotNull('solved_at');
            },
        ])
            ->with('badges')
            ->orderBy('xp', 'desc')
            ->orderBy('solved_count', 'desc')
            ->orderBy('id', 'asc')
            ->paginate($perPage);

        $startRank = ($users->currentPage() - 1) * $users->perPage();

        $rankedItems = $users->map(function ($user, $index) use ($startRank) {
            return [
                'rank' => $startRank + $index + 1,
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'avatar_url' => $user->avatar_url,
                'xp' => $user->xp,
                'level' => $user->calculateLevel(),
                'solved_count' => $user->solved_count,
                'badges' => $user->badges->map(fn ($b) => [
                    'id' => $b->id,
                    'name' => $b->name,
                    'slug' => $b->slug,
                    'icon' => $b->icon,
                ]),
            ];
        });

        return response()->json([
            'data' => $rankedItems,
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
        ]);
    }
}
