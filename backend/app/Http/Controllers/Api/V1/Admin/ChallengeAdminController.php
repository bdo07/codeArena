<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreChallengeRequest;
use App\Http\Requests\UpdateChallengeRequest;
use App\Http\Resources\Api\V1\ChallengeAdminResource;
use App\Models\Challenge;
use App\Models\Tag;
use App\Models\TestCase;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ChallengeAdminController extends Controller
{
    /**
     * List all challenges for administration.
     */
    public function index(Request $request): JsonResponse
    {
        $challenges = Challenge::with(['tags', 'testCases'])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'data' => ChallengeAdminResource::collection($challenges),
            'meta' => [
                'current_page' => $challenges->currentPage(),
                'last_page' => $challenges->lastPage(),
                'total' => $challenges->total(),
            ],
        ]);
    }

    /**
     * Get single challenge with all test cases (public and hidden).
     */
    public function show(Challenge $challenge): JsonResponse
    {
        $challenge->load(['tags', 'testCases']);

        return response()->json([
            'challenge' => new ChallengeAdminResource($challenge),
        ]);
    }

    /**
     * Create a new challenge with test cases.
     */
    public function store(StoreChallengeRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $challenge = DB::transaction(function () use ($validated, $request) {
            $challengeData = $validated;
            unset($challengeData['tags'], $challengeData['test_cases']);
            $challengeData['created_by'] = $request->user()->id;

            $challenge = Challenge::create($challengeData);

            // Tags
            if (! empty($validated['tags'])) {
                $tagIds = [];
                foreach ($validated['tags'] as $tagName) {
                    $tag = Tag::firstOrCreate(
                        ['slug' => Str::slug($tagName)],
                        ['name' => $tagName]
                    );
                    $tagIds[] = $tag->id;
                }
                $challenge->tags()->sync($tagIds);
            }

            // Test cases
            foreach ($validated['test_cases'] as $index => $tc) {
                TestCase::create([
                    'challenge_id' => $challenge->id,
                    'input_data' => $tc['input_data'],
                    'expected_output' => $tc['expected_output'],
                    'is_sample' => $tc['is_sample'] ?? false,
                    'points' => $tc['points'] ?? 10,
                    'position' => $index + 1,
                ]);
            }

            return $challenge->load(['tags', 'testCases']);
        });

        return response()->json([
            'message' => 'Challenge created successfully.',
            'challenge' => new ChallengeAdminResource($challenge),
        ], 201);
    }

    /**
     * Update an existing challenge and its test cases.
     */
    public function update(UpdateChallengeRequest $request, Challenge $challenge): JsonResponse
    {
        $validated = $request->validated();

        $updated = DB::transaction(function () use ($challenge, $validated) {
            $challengeData = $validated;
            unset($challengeData['tags'], $challengeData['test_cases']);

            $challenge->update($challengeData);

            // Tags
            if (isset($validated['tags'])) {
                $tagIds = [];
                foreach ($validated['tags'] as $tagName) {
                    $tag = Tag::firstOrCreate(
                        ['slug' => Str::slug($tagName)],
                        ['name' => $tagName]
                    );
                    $tagIds[] = $tag->id;
                }
                $challenge->tags()->sync($tagIds);
            }

            // Test cases replacement if provided
            if (isset($validated['test_cases'])) {
                $challenge->testCases()->delete();
                foreach ($validated['test_cases'] as $index => $tc) {
                    TestCase::create([
                        'challenge_id' => $challenge->id,
                        'input_data' => $tc['input_data'],
                        'expected_output' => $tc['expected_output'],
                        'is_sample' => $tc['is_sample'] ?? false,
                        'points' => $tc['points'] ?? 10,
                        'position' => $index + 1,
                    ]);
                }
            }

            return $challenge->fresh(['tags', 'testCases']);
        });

        return response()->json([
            'message' => 'Challenge updated successfully.',
            'challenge' => new ChallengeAdminResource($updated),
        ]);
    }

    /**
     * Delete a challenge.
     */
    public function destroy(Challenge $challenge): JsonResponse
    {
        $challenge->delete();

        return response()->json([
            'message' => 'Challenge deleted successfully.',
        ]);
    }
}
