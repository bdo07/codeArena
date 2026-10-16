<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\RunCodeRequest;
use App\Http\Requests\SubmitCodeRequest;
use App\Http\Resources\Api\V1\ChallengeResource;
use App\Http\Resources\Api\V1\SubmissionResource;
use App\Models\Challenge;
use App\Models\Collection;
use App\Models\DailyCompletion;
use App\Models\Submission;
use App\Models\Tag;
use App\Models\UserChallengeProgress;
use App\Services\GamificationService;
use App\Services\SqlExecutionService;
use App\Services\SubmissionService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChallengeController extends Controller
{
    public function __construct(
        protected SubmissionService $submissionService,
        protected SqlExecutionService $sqlService,
        protected GamificationService $gamificationService
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
            $formatted = ucfirst(strtolower($difficulty));
            if (in_array($formatted, ['Beginner', 'Easy', 'Medium', 'Hard', 'Expert'])) {
                $query->where('difficulty', $formatted);
            }
        }

        // Category filter
        if ($category = $request->input('category')) {
            $query->where('category', $category);
        }

        // Challenge Type filter (code, sql, web, quiz)
        if ($type = $request->input('challenge_type')) {
            $query->where('challenge_type', $type);
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
            } elseif ($status === 'bookmarked') {
                $query->whereHas('collections', function ($q) use ($user) {
                    $q->where('user_id', $user->id);
                });
            }
        }

        // Sorting
        $sortBy = $request->input('sort', 'newest');
        switch ($sortBy) {
            case 'difficulty_asc':
                $query->orderByRaw("CASE difficulty WHEN 'Beginner' THEN 1 WHEN 'Easy' THEN 2 WHEN 'Medium' THEN 3 WHEN 'Hard' THEN 4 WHEN 'Expert' THEN 5 END ASC");
                break;
            case 'difficulty_desc':
                $query->orderByRaw("CASE difficulty WHEN 'Expert' THEN 1 WHEN 'Hard' THEN 2 WHEN 'Medium' THEN 3 WHEN 'Easy' THEN 4 WHEN 'Beginner' THEN 5 END ASC");
                break;
            case 'title':
                $query->orderBy('title', 'asc');
                break;
            case 'newest':
            default:
                $query->orderBy('created_at', 'desc');
                break;
        }

        $perPage = max(1, min(50, (int) $request->input('per_page', 12)));
        $challenges = $query->paginate($perPage);

        // Fetch user progress and bookmarks if logged in
        $userProgress = [];
        $bookmarkedIds = [];

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

            // Favorites collection
            $favCollection = Collection::where('user_id', $user->id)->where('name', 'Favorites')->first();
            if ($favCollection) {
                $bookmarkedIds = $favCollection->challenges()->whereIn('challenges.id', $challengeIds)->pluck('challenges.id')->toArray();
            }
        }

        // Real counts for filter chips
        $categoryCounts = Challenge::where('is_published', true)
            ->selectRaw('category, count(*) as count')
            ->groupBy('category')
            ->pluck('count', 'category');

        $difficultyCounts = Challenge::where('is_published', true)
            ->selectRaw('difficulty, count(*) as count')
            ->groupBy('difficulty')
            ->pluck('count', 'difficulty');

        $typeCounts = Challenge::where('is_published', true)
            ->selectRaw('challenge_type, count(*) as count')
            ->groupBy('challenge_type')
            ->pluck('count', 'challenge_type');

        return response()->json([
            'data' => ChallengeResource::collection($challenges),
            'meta' => [
                'current_page' => $challenges->currentPage(),
                'last_page' => $challenges->lastPage(),
                'per_page' => $challenges->perPage(),
                'total' => $challenges->total(),
                'category_counts' => $categoryCounts,
                'difficulty_counts' => $difficultyCounts,
                'type_counts' => $typeCounts,
            ],
            'tags' => Tag::orderBy('name')->get(['id', 'name', 'slug']),
            'user_progress' => $userProgress,
            'bookmarked_ids' => $bookmarkedIds,
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
        $isBookmarked = false;

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

            $favCollection = Collection::where('user_id', $user->id)->where('name', 'Favorites')->first();
            if ($favCollection) {
                $isBookmarked = $favCollection->challenges()->where('challenges.id', $challenge->id)->exists();
            }
        }

        return response()->json([
            'challenge' => new ChallengeResource($challenge),
            'user_progress' => $progressData,
            'is_bookmarked' => $isBookmarked,
        ]);
    }

    /**
     * Run code against public sample test cases.
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

    /**
     * Run SQL in isolated sandbox.
     */
    public function runSql(Request $request, Challenge $challenge): JsonResponse
    {
        $request->validate([
            'query' => 'required|string|max:5000',
        ]);

        $schema = $challenge->sql_schema ?? '';
        $seed = $challenge->sql_seed ?? '';
        $query = $request->input('query');
        $reference = $challenge->sql_solution;

        $result = $this->sqlService->execute($schema, $seed, $query, $reference);

        return response()->json($result);
    }

    /**
     * Submit SQL solution for grading and XP.
     */
    public function submitSql(Request $request, Challenge $challenge): JsonResponse
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $request->validate([
            'query' => 'required|string|max:5000',
        ]);

        $schema = $challenge->sql_schema ?? '';
        $seed = $challenge->sql_seed ?? '';
        $query = $request->input('query');
        $reference = $challenge->sql_solution;

        $result = $this->sqlService->execute($schema, $seed, $query, $reference);

        $status = $result['passed'] ? Submission::STATUS_ACCEPTED : ($result['error'] ? Submission::STATUS_RUNTIME_ERROR : Submission::STATUS_WRONG_ANSWER);
        $score = $result['passed'] ? 100 : 0;

        $submission = Submission::create([
            'user_id' => $user->id,
            'challenge_id' => $challenge->id,
            'language' => 'sql',
            'source_code' => $query,
            'status' => $status,
            'score' => $score,
            'execution_time_ms' => (int) $result['execution_time_ms'],
            'memory_kb' => 1024,
            'submitted_at' => Carbon::now(),
            'finished_at' => Carbon::now(),
            'error_message' => $result['error'],
        ]);

        $gamification = $this->gamificationService->awardProgressAndXp($user, $challenge, $submission);

        return response()->json([
            'result' => $result,
            'submission' => new SubmissionResource($submission),
            'gamification' => $gamification,
        ]);
    }

    /**
     * Submit Quiz answers for grading.
     */
    public function submitQuiz(Request $request, Challenge $challenge): JsonResponse
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $request->validate([
            'answers' => 'required|array',
        ], [
            'answers.required' => 'The answers field is required. Please provide answers to the quiz questions.',
        ]);

        $userAnswers = $request->input('answers');
        $quizData = $challenge->quiz_data;
        $questions = [];
        if (is_array($quizData)) {
            $questions = isset($quizData['questions']) ? $quizData['questions'] : $quizData;
        } elseif (is_string($quizData)) {
            $decoded = json_decode($quizData, true);
            $questions = isset($decoded['questions']) ? $decoded['questions'] : ($decoded ?: []);
        }

        $total = count($questions);
        if ($total === 0) {
            return response()->json(['message' => 'No questions found for this quiz challenge.'], 400);
        }

        $correct = 0;
        $review = [];

        foreach ($questions as $index => $q) {
            $qId = $q['id'] ?? (string)$index;
            $correctAns = $q['correct_index'] ?? $q['answer'] ?? 0;
            $userAns = $userAnswers[$qId] ?? ($userAnswers[(string)$index] ?? ($userAnswers[$index] ?? null));
            $isCorrect = ($userAns !== null && (int)$userAns === (int)$correctAns);

            if ($isCorrect) {
                $correct++;
            }

            $review[] = [
                'id' => $qId,
                'user_answer' => $userAns,
                'correct_answer' => $correctAns,
                'is_correct' => $isCorrect,
                'explanation' => $q['explanation'] ?? null,
            ];
        }

        $percentage = $total > 0 ? round(($correct / $total) * 100) : 0;
        $passed = $percentage >= 70; // 70% passing threshold
        $status = $passed ? Submission::STATUS_ACCEPTED : Submission::STATUS_WRONG_ANSWER;

        $submission = Submission::create([
            'user_id' => $user->id,
            'challenge_id' => $challenge->id,
            'language' => 'quiz',
            'source_code' => json_encode($userAnswers),
            'status' => $status,
            'score' => $percentage,
            'execution_time_ms' => 10,
            'memory_kb' => 512,
            'submitted_at' => Carbon::now(),
            'finished_at' => Carbon::now(),
        ]);

        $gamification = $this->gamificationService->awardProgressAndXp($user, $challenge, $submission);

        return response()->json([
            'passed' => $passed,
            'score' => $percentage,
            'correct_count' => $correct,
            'total_questions' => $total,
            'review' => $review,
            'submission' => new SubmissionResource($submission),
            'gamification' => $gamification,
        ]);
    }

    /**
     * Get Daily Challenge with streak status.
     */
    public function daily(Request $request): JsonResponse
    {
        $today = Carbon::today()->toDateString();
        $challenge = Challenge::where('is_published', true)
            ->where(function ($q) use ($today) {
                $q->where('daily_date', $today)
                    ->orWhere('is_daily', true);
            })
            ->first();

        // Fallback to first challenge if no specific daily
        if (! $challenge) {
            $challenge = Challenge::where('is_published', true)->first();
        }

        $user = $request->user('sanctum');
        $isCompletedToday = false;
        $streakInfo = [
            'current_streak' => 0,
            'longest_streak' => 0,
            'last_activity_date' => null,
        ];

        if ($user) {
            $streakInfo = $this->gamificationService->getUserStreakInfo($user);
            $isCompletedToday = DailyCompletion::where('user_id', $user->id)
                ->where('completed_date', $today)
                ->exists();
        }

        return response()->json([
            'challenge' => $challenge ? new ChallengeResource($challenge) : null,
            'is_completed_today' => $isCompletedToday,
            'streak' => $streakInfo,
        ]);
    }

    /**
     * Toggle bookmark (Favorites collection).
     */
    public function toggleBookmark(Request $request, Challenge $challenge): JsonResponse
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $collection = Collection::firstOrCreate(
            ['user_id' => $user->id, 'name' => 'Favorites'],
            ['slug' => 'favorites', 'description' => 'Your favorite saved challenges', 'icon' => 'Bookmark', 'is_public' => false]
        );

        $isAttached = $collection->challenges()->where('challenges.id', $challenge->id)->exists();

        if ($isAttached) {
            $collection->challenges()->detach($challenge->id);
            $bookmarked = false;
        } else {
            $collection->challenges()->attach($challenge->id);
            $bookmarked = true;
        }

        return response()->json([
            'bookmarked' => $bookmarked,
            'message' => $bookmarked ? 'Challenge bookmarked.' : 'Bookmark removed.',
        ]);
    }
}
