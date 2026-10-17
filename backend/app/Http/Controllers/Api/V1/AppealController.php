<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AccountAppeal;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AppealController extends Controller
{
    /**
     * Submit an appeal for a suspended or banned account.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'reason' => 'required|string|min:10|max:2000',
            'contact_email' => 'nullable|email|max:255',
            'username' => 'nullable|string|max:100',
        ]);

        $user = $request->user();

        // If not authenticated (e.g. permanently banned user whose token was revoked)
        if (! $user) {
            $usernameOrEmail = $validated['username'] ?? $validated['contact_email'] ?? null;
            if (! $usernameOrEmail) {
                return response()->json([
                    'message' => 'Please provide your account username or email to submit an appeal.',
                ], 422);
            }

            $user = User::withTrashed()
                ->where('username', strtolower($usernameOrEmail))
                ->orWhere('email', strtolower($usernameOrEmail))
                ->first();

            if (! $user) {
                return response()->json([
                    'message' => 'Account not found with provided identifier.',
                ], 404);
            }
        }

        // Check if there is already a pending appeal
        $existingPending = AccountAppeal::where('user_id', $user->id)
            ->where('status', AccountAppeal::STATUS_PENDING)
            ->first();

        if ($existingPending) {
            return response()->json([
                'message' => 'You already have an appeal submitted and pending review by our moderation team.',
                'appeal' => $existingPending,
            ], 422);
        }

        $appeal = AccountAppeal::create([
            'user_id' => $user->id,
            'status' => AccountAppeal::STATUS_PENDING,
            'reason' => $validated['reason'],
            'contact_email' => $validated['contact_email'] ?? $user->email,
        ]);

        return response()->json([
            'message' => 'Your appeal has been received and is in the review queue.',
            'appeal' => $appeal,
        ], 201);
    }

    /**
     * Get the current authenticated user's latest appeal.
     */
    public function myAppeal(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $appeal = AccountAppeal::where('user_id', $user->id)
            ->latest()
            ->first();

        return response()->json([
            'appeal' => $appeal,
        ]);
    }
}
