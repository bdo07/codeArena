<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Challenge;
use App\Models\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CollectionController extends Controller
{
    /**
     * List user collections and public collections
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $collections = Collection::where(function ($q) use ($user) {
            $q->where('is_public', true);
            if ($user) {
                $q->orWhere('user_id', $user->id);
            }
        })
        ->withCount('challenges')
        ->orderByDesc('created_at')
        ->get();

        return response()->json(['data' => $collections]);
    }

    /**
     * Create custom collection
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'description' => 'nullable|string|max:500',
            'icon' => 'nullable|string|max:50',
            'is_public' => 'boolean',
        ]);

        $collection = Collection::create([
            'user_id' => $user->id,
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']) . '-' . Str::random(5),
            'description' => $validated['description'] ?? null,
            'icon' => $validated['icon'] ?? 'Bookmark',
            'is_public' => $validated['is_public'] ?? false,
        ]);

        return response()->json(['data' => $collection], 201);
    }

    /**
     * Show collection details with challenges
     */
    public function show(int $id, Request $request): JsonResponse
    {
        $user = $request->user('sanctum');

        $collection = Collection::with(['challenges' => function ($q) {
            $q->where('is_published', true)->with('tags');
        }])->findOrFail($id);

        if (!$collection->is_public && (!$user || $user->id !== $collection->user_id)) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        return response()->json(['data' => $collection]);
    }

    /**
     * Add challenge to collection
     */
    public function addChallenge(int $id, Request $request): JsonResponse
    {
        $user = $request->user();
        $collection = Collection::where('user_id', $user->id)->findOrFail($id);

        $request->validate([
            'challenge_id' => 'required|exists:challenges,id',
        ]);

        $challengeId = $request->input('challenge_id');
        if (!$collection->challenges()->where('challenges.id', $challengeId)->exists()) {
            $collection->challenges()->attach($challengeId, [
                'position' => $collection->challenges()->count() + 1,
            ]);
        }

        return response()->json(['message' => 'Challenge added to collection.']);
    }

    /**
     * Remove challenge from collection
     */
    public function removeChallenge(int $id, int $challengeId, Request $request): JsonResponse
    {
        $user = $request->user();
        $collection = Collection::where('user_id', $user->id)->findOrFail($id);

        $collection->challenges()->detach($challengeId);

        return response()->json(['message' => 'Challenge removed from collection.']);
    }
}
