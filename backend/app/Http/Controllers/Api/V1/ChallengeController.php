<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\RunCodeRequest;
use App\Http\Requests\SubmitCodeRequest;
use App\Http\Resources\Api\V1\ChallengeResource;
use App\Http\Resources\Api\V1\SubmissionResource;
use App\Models\Challenge;
use App\Models\Tag;
use App\Models\UserChallengeProgress;
use App\Services\SubmissionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChallengeController extends Controller
{
    public function __construct(
        protected SubmissionService $submissionService
    ) {}

    /**
     * Get published challenges with search, filters, sorting and pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Challenge::where('is_published', true)->with(['tags', 'sampleTestCases']);

        // Search query
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Difficulty filter
        if ($difficulty = $request->input('difficulty')) {
            if (in_array(ucfirst(strtolower($difficulty)), ['Easy', 'Medium', 'Hard'])) {
                $query->where('difficulty', ucfirst(strtolower($difficulty)));
            }
        }

        // Tag filter
        if ($tagSlug = $request->input('tag')) {
            $query->whereHas('tags', function ($q) use ($tagSlug) {
                $q->where('slug', $tagSlug);
            });
        }

        // Status filter (if user authenticated)
        $user = $request->user('sanctum');
        if ($user && $status = $request->input('status')) {
            if ($status === 'solved') {
                $query->whereHas('progress', function ($q) use ($user) {
                    $q->where('user_id', $user->id)->whereNotNull('solved_at');
                });
            } elseif ($status === 'attempted') {
                $query->whereHas('progress', function ($q) use ($user) {
                    $q->where('user_id', $user->id)->whereNull('solved_at');
                });
            } elseif ($status === 'unsolved') {
                $query->whereDoesntHave('progress', function ($q) use ($user) {
                    $q->where('user_id', $user->id)->whereNotNull('solved_at');
                });
            }
        }

        // Sorting
        $sortBy = $request->input('sort', 'newest');
        switch ($sortBy) {
            case 'difficulty_asc':
                $query->orderByRaw("CASE difficulty WHEN 'Easy' THEN 1 WHEN 'Medium' THEN 2 WHEN 'Hard' THEN 3 END ASC");
                break;
            case 'difficulty_desc':
                $query->orderByRaw("CASE difficulty WHEN 'Hard' THEN 1 WHEN 'Medium' THEN 2 WHEN 'Easy' THEN 3 END ASC");
                break;
            case 'title':
                $query->orderBy('title', 'asc');
                break;
            case 'newest':
            default:
                $query->orderBy('created_at', 'desc');
                break;
        }

        $perPage = max(1, min(50, (int) $request->input('per_page', 10)));
        $challenges = $query->paginate($perPage);

        // Fetch user progress mapping if logged in
        $userProgress = [];
        if ($user) {
            $challengeIds = $challenges->pluck('id');
            $progressRecords = UserChallengeProgress::where('user_id', $user->id)
                ->whereIn('challenge_id', $challengeIds)
                ->get()
                ->keyBy('challenge_id');

            foreach ($challengeIds as $id) {
                if (isset($progressRecords[$id])) {
                    $userProgress[$id] = [
                        'solved' => $progressRecords[$id]->solved_at !== null,
                        'best_score' => $progressRecords[$id]->best_score,
                        'attempts_count' => $progressRecords[$id]->attempts_count,
                    ];
                }
            }
        }

        return response()->json([
            'data' => ChallengeResource::collection($challenges),
            'meta' => [
                'current_page' => $challenges->currentPage(),
                'last_page' => $challenges->lastPage(),
                'per_page' => $challenges->perPage(),
                'total' => $challenges->total(),
            ],
            'tags' => Tag::orderBy('name')->get(['id', 'name', 'slug']),
            'user_progress' => $userProgress,
        ]);
    }

    /**
     * Get single challenge by slug.
     */
    public function show(string $slug, Request $request): JsonResponse
    {
        $challenge = Challenge::where('slug', $slug)
            ->where('is_published', true)
            ->with(['tags', 'sampleTestCases'])
            ->firstOrFail();

        $user = $request->user('sanctum');
        $progressData = null;

        if ($user) {
            $progress = UserChallengeProgress::where('user_id', $user->id)
                ->where('challenge_id', $challenge->id)
                ->first();

            if ($progress) {
                $progressData = [
                    'solved' => $progress->solved_at !== null,
                    'best_score' => $progress->best_score,
                    'attempts_count' => $progress->attempts_count,
                    'solved_at' => $progress->solved_at?->toIso8601String(),
                ];
            }
        }

        return response()->json([
            'challenge' => new ChallengeResource($challenge),
            'user_progress' => $progressData,
        ]);
    }

    /**
     * Run code against public sample test cases only.
     */
    public function run(RunCodeRequest $request, Challenge $challenge): JsonResponse
    {
        $validated = $request->validated();

        $results = $this->submissionService->runSampleTestCases(
            $challenge,
            $validated['language'],
            $validated['source_code']
        );

        return response()->json($results);
    }

    /**
     * Submit solution for full evaluation against all test cases.
     */
    public function submit(SubmitCodeRequest $request, Challenge $challenge): JsonResponse
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $validated = $request->validated();

        $evaluation = $this->submissionService->submitSolution(
            $user,
            $challenge,
            $validated['language'],
            $validated['source_code']
        );

        return response()->json([
            'submission' => new SubmissionResource($evaluation['submission']),
            'gamification' => $evaluation['gamification'],
            'is_demo_mode' => $evaluation['is_demo_mode'],
        ]);
    }
}
