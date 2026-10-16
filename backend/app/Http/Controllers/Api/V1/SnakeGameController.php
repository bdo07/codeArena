<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\SnakeGame;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SnakeGameController extends Controller
{
    /**
     * Start a new Snake game session for the authenticated user.
     */
    public function start(Request $request): JsonResponse
    {
        $user = $request->user();

        $sessionId = (string) Str::uuid();
        $game = SnakeGame::create([
            'user_id' => $user->id,
            'session_id' => $sessionId,
            'started_at' => now(),
            'status' => 'in_progress',
            'score' => 0,
            'apples_eaten' => 0,
            'moves_count' => 0,
            'duration_seconds' => 0,
            'is_verified' => true,
            'is_imported' => false,
        ]);

        return response()->json([
            'session_id' => $sessionId,
            'started_at' => $game->started_at->toIso8601String(),
        ], 201);
    }

    /**
     * Complete and record a finished game session with fair score verification.
     */
    public function finish(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'session_id' => ['required', 'string'],
            'score' => ['required', 'integer', 'min:0', 'max:100000'],
            'apples_eaten' => ['required', 'integer', 'min:0', 'max:10000'],
            'moves_count' => ['required', 'integer', 'min:0'],
        ]);

        $user = $request->user();

        $game = SnakeGame::where('session_id', $validated['session_id'])
            ->where('user_id', $user->id)
            ->first();

        if (! $game) {
            return response()->json([
                'message' => 'Game session not found or does not belong to the authenticated user.',
            ], 404);
        }

        if ($game->status === 'completed') {
            return response()->json([
                'message' => 'This game session has already been recorded.',
            ], 409);
        }

        $endedAt = now();
        $durationSeconds = max(1, $endedAt->diffInSeconds($game->started_at));

        // Score Verification Strategy:
        // 1. Each apple is worth 10 points. If score does not match apples * 10, mark unverified.
        // 2. Minimum plausible time & moves per apple: at least 1 move per apple and 0.2s minimum per apple.
        $score = $validated['score'];
        $apples = $validated['apples_eaten'];
        $moves = $validated['moves_count'];

        $isVerified = true;
        $expectedScore = $apples * 10;

        if ($score !== $expectedScore) {
            $isVerified = false;
        }

        if ($apples > 0 && ($moves < $apples || $durationSeconds < ($apples * 0.2))) {
            $isVerified = false;
        }

        $game->update([
            'score' => $score,
            'apples_eaten' => $apples,
            'moves_count' => $moves,
            'duration_seconds' => $durationSeconds,
            'ended_at' => $endedAt,
            'status' => 'completed',
            'is_verified' => $isVerified,
        ]);

        return response()->json([
            'message' => 'Game session recorded successfully.',
            'game' => $game,
            'stats' => $this->getUserStats($user->id),
        ]);
    }

    /**
     * Retrieve the authenticated user's personal Snake statistics.
     */
    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = $this->getUserStats($user->id, withRecent: true);

        return response()->json($data);
    }

    /**
     * Allow safe import of a guest personal best score, clearly flagged as unverified/imported.
     */
    public function importGuestScore(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'score' => ['required', 'integer', 'min:10', 'max:50000'],
            'apples_eaten' => ['required', 'integer', 'min:1', 'max:5000'],
        ]);

        $user = $request->user();

        // Check if user already has an imported score equal or greater to avoid duplicate spamming
        $existingImport = SnakeGame::where('user_id', $user->id)
            ->where('is_imported', true)
            ->where('score', '>=', $validated['score'])
            ->first();

        if (! $existingImport) {
            $sessionId = (string) Str::uuid();
            SnakeGame::create([
                'user_id' => $user->id,
                'session_id' => $sessionId,
                'score' => $validated['score'],
                'apples_eaten' => $validated['apples_eaten'],
                'moves_count' => 0,
                'duration_seconds' => 0,
                'status' => 'completed',
                'is_verified' => false,
                'is_imported' => true,
                'started_at' => now(),
                'ended_at' => now(),
            ]);
        }

        return response()->json([
            'message' => 'Guest score imported as unverified record.',
            'stats' => $this->getUserStats($user->id, withRecent: true),
        ]);
    }

    /**
     * Compute aggregate Snake statistics for a given user.
     */
    private function getUserStats(int $userId, bool $withRecent = false): array
    {
        $query = SnakeGame::where('user_id', $userId)->where('status', 'completed');

        $totalGames = (clone $query)->count();
        $highScore = (clone $query)->max('score') ?? 0;
        $cumulativeScore = (clone $query)->sum('score') ?? 0;
        $avgScore = $totalGames > 0 ? round((clone $query)->avg('score'), 1) : 0;
        $applesTotal = (clone $query)->sum('apples_eaten') ?? 0;

        $result = [
            'total_games' => $totalGames,
            'high_score' => $highScore,
            'cumulative_score' => $cumulativeScore,
            'average_score' => $avgScore,
            'apples_eaten_total' => $applesTotal,
        ];

        if ($withRecent) {
            $result['recent_games'] = (clone $query)
                ->orderBy('ended_at', 'desc')
                ->limit(5)
                ->get()
                ->map(fn ($g) => [
                    'id' => $g->id,
                    'session_id' => $g->session_id,
                    'score' => $g->score,
                    'apples_eaten' => $g->apples_eaten,
                    'moves_count' => $g->moves_count,
                    'duration_seconds' => $g->duration_seconds,
                    'is_verified' => (bool) $g->is_verified,
                    'is_imported' => (bool) $g->is_imported,
                    'ended_at' => $g->ended_at?->toIso8601String(),
                ]);
        }

        return $result;
    }
}
