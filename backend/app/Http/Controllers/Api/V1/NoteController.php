<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Challenge;
use App\Models\ChallengeNote;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NoteController extends Controller
{
    /**
     * Get user's private note for a challenge
     */
    public function show(Challenge $challenge, Request $request): JsonResponse
    {
        $user = $request->user();
        $note = ChallengeNote::where('user_id', $user->id)
            ->where('challenge_id', $challenge->id)
            ->first();

        return response()->json([
            'content' => $note?->content ?? '',
            'updated_at' => $note?->updated_at?->toIso8601String(),
        ]);
    }

    /**
     * Save/update user's private note for a challenge
     */
    public function store(Challenge $challenge, Request $request): JsonResponse
    {
        $user = $request->user();
        $request->validate([
            'content' => 'nullable|string|max:10000',
        ]);

        $note = ChallengeNote::updateOrCreate(
            [
                'user_id' => $user->id,
                'challenge_id' => $challenge->id,
            ],
            [
                'content' => $request->input('content', ''),
            ]
        );

        return response()->json([
            'message' => 'Note saved successfully.',
            'content' => $note->content,
            'updated_at' => $note->updated_at->toIso8601String(),
        ]);
    }
}
