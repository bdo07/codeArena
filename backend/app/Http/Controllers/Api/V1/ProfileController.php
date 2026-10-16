<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\UserResource;
use App\Models\Submission;
use App\Models\User;
use App\Models\UserChallengeProgress;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    /**
     * Get public profile by username.
     * Exposes only public information; respects user activity privacy settings.
     */
    public function show(string $username, Request $request): JsonResponse
    {
        $user = User::where('username', strtolower($username))
            ->with(['badges', 'streak'])
            ->firstOrFail();

        $authUser = $request->user('sanctum');
        $isOwner = $authUser && $authUser->id === $user->id;

        // Statistics
        $acceptedCount = Submission::where('user_id', $user->id)
            ->where('status', Submission::STATUS_ACCEPTED)
            ->count();

        $totalSubmissions = Submission::where('user_id', $user->id)->count();
        $successRate = $totalSubmissions > 0 ? round(($acceptedCount / $totalSubmissions) * 100, 1) : 0;

        $solvedProgressCount = UserChallengeProgress::where('user_id', $user->id)
            ->whereNotNull('solved_at')
            ->count();

        // Solved challenges & activity (conditioned on privacy setting or ownership)
        $isActivityPublic = (bool) ($user->is_activity_public ?? true);
        $showActivity = $isActivityPublic || $isOwner;

        $solvedChallenges = [];
        $recentActivity = [];

        if ($showActivity) {
            $solvedProgress = UserChallengeProgress::where('user_id', $user->id)
                ->whereNotNull('solved_at')
                ->with('challenge.tags')
                ->orderBy('solved_at', 'desc')
                ->take(30)
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

            $recentSubmissions = Submission::where('user_id', $user->id)
                ->with('challenge:id,title,slug,difficulty')
                ->orderBy('created_at', 'desc')
                ->take(10)
                ->get();

            $recentActivity = $recentSubmissions->map(function ($s) {
                return [
                    'id' => $s->id,
                    'challenge_id' => $s->challenge_id,
                    'challenge_title' => $s->challenge?->title,
                    'challenge_slug' => $s->challenge?->slug,
                    'challenge_difficulty' => $s->challenge?->difficulty,
                    'language' => $s->language,
                    'status' => $s->status,
                    'score' => $s->score,
                    'execution_time_ms' => $s->execution_time_ms,
                    'submitted_at' => $s->submitted_at?->toIso8601String() ?? $s->created_at?->toIso8601String(),
                ];
            });
        }

        return response()->json([
            'profile' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'avatar_url' => $user->avatar_url,
                'tagline' => $user->tagline,
                'bio' => $user->bio,
                'location' => $user->location,
                'website_url' => $user->website_url,
                'github_url' => $user->github_url,
                'linkedin_url' => $user->linkedin_url,
                'favorite_languages' => $user->favorite_languages ?? [],
                'is_activity_public' => $isActivityPublic,
                'xp' => $user->xp,
                'level' => $user->calculateLevel(),
                'role' => $user->role,
                'joined_at' => $user->created_at?->toIso8601String(),
                'solved_count' => $solvedProgressCount,
                'accepted_count' => $acceptedCount,
                'total_submissions' => $totalSubmissions,
                'success_rate' => $successRate,
                'streak' => [
                    'current_streak' => $user->streak?->current_streak ?? 0,
                    'longest_streak' => $user->streak?->longest_streak ?? 0,
                    'last_activity_date' => $user->streak?->last_activity_date?->toDateString(),
                ],
                'badges' => $user->badges->map(fn ($b) => [
                    'id' => $b->id,
                    'name' => $b->name,
                    'slug' => $b->slug,
                    'description' => $b->description,
                    'icon' => $b->icon,
                    'earned_at' => $b->pivot?->earned_at,
                ]),
                'solved_challenges' => $solvedChallenges,
                'recent_activity' => $recentActivity,
                'is_owner' => $isOwner,
            ],
        ]);
    }

    /**
     * Update authenticated user's profile details.
     */
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:100'],
            'username' => [
                'required',
                'string',
                'alpha_dash',
                'min:3',
                'max:30',
                Rule::unique('users', 'username')->ignore($user->id),
            ],
            'tagline' => ['nullable', 'string', 'max:100'],
            'bio' => ['nullable', 'string', 'max:300'],
            'location' => ['nullable', 'string', 'max:100'],
            'website_url' => ['nullable', 'string', 'url', 'max:255'],
            'github_url' => ['nullable', 'string', 'url', 'max:255'],
            'linkedin_url' => ['nullable', 'string', 'url', 'max:255'],
            'favorite_languages' => ['nullable', 'array', 'max:10'],
            'favorite_languages.*' => ['string', 'max:30'],
            'is_activity_public' => ['nullable', 'boolean'],
        ]);

        $validated['username'] = strtolower($validated['username']);

        $user->update($validated);
        $user->refresh();

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user' => new UserResource($user->load('badges')),
        ]);
    }

    /**
     * Upload and update user avatar.
     * Validates safe image formats (JPEG, PNG, WebP) and maximum 2MB size.
     */
    public function uploadAvatar(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpeg,png,jpg,webp', 'max:2048'],
        ], [
            'avatar.required' => 'Please select an image file to upload.',
            'avatar.image' => 'The uploaded file must be a valid image.',
            'avatar.mimes' => 'Avatar must be a JPEG, PNG, or WebP image.',
            'avatar.max' => 'Avatar image must not exceed 2 MB.',
        ]);

        $file = $request->file('avatar');
        $extension = $file->getClientOriginalExtension() ?: 'png';
        $safeFilename = Str::uuid()->toString() . '.' . strtolower($extension);

        // Store in public avatars directory
        $storedPath = $file->storeAs('avatars', $safeFilename, 'public');

        // Delete old avatar if it existed on the public disk
        if ($user->avatar && $user->avatar !== $storedPath && Storage::disk('public')->exists($user->avatar)) {
            Storage::disk('public')->delete($user->avatar);
        }

        $user->avatar = $storedPath;
        $user->save();
        $user->refresh();

        return response()->json([
            'message' => 'Avatar uploaded successfully.',
            'avatar_url' => $user->avatar_url,
            'user' => new UserResource($user->load('badges')),
        ]);
    }

    /**
     * Delete/reset user avatar to default fallback.
     */
    public function deleteAvatar(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if ($user->avatar && Storage::disk('public')->exists($user->avatar)) {
            Storage::disk('public')->delete($user->avatar);
        }

        $user->avatar = null;
        $user->save();
        $user->refresh();

        return response()->json([
            'message' => 'Avatar removed successfully.',
            'avatar_url' => null,
            'user' => new UserResource($user->load('badges')),
        ]);
    }
}

