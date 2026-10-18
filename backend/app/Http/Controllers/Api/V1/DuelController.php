<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Challenge;
use App\Models\CodeDuel;
use App\Models\User;
use App\Services\SubmissionService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DuelController extends Controller
{
    public function __construct(
        protected SubmissionService $submissionService
    ) {}

    /**
     * List duels for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $tab = $request->input('tab', 'active');

        $query = CodeDuel::with(['creator', 'opponent', 'challenge', 'winner'])
            ->orderBy('created_at', 'desc');

        if ($tab === 'invites') {
            // Invites received waiting for response
            $query->where('opponent_id', $user->id)
                ->where('status', CodeDuel::STATUS_PENDING);
        } elseif ($tab === 'active') {
            // Active or pending duels user participates in
            $query->where(function ($q) use ($user) {
                $q->where('creator_id', $user->id)
                  ->orWhere('opponent_id', $user->id);
            })->whereIn('status', [CodeDuel::STATUS_PENDING, CodeDuel::STATUS_ACTIVE]);
        } else {
            // History: completed, timed_out, declined, canceled
            $query->where(function ($q) use ($user) {
                $q->where('creator_id', $user->id)
                  ->orWhere('opponent_id', $user->id);
            })->whereIn('status', [
                CodeDuel::STATUS_COMPLETED,
                CodeDuel::STATUS_TIMED_OUT,
                CodeDuel::STATUS_DECLINED,
                CodeDuel::STATUS_CANCELED,
            ]);
        }

        $duels = $query->paginate(15);

        // Apply any timeouts on fetched active items
        foreach ($duels->items() as $duel) {
            $duel->checkAndApplyTimeout();
        }

        return response()->json([
            'data' => $duels->items(),
            'meta' => [
                'current_page' => $duels->currentPage(),
                'last_page' => $duels->lastPage(),
                'total' => $duels->total(),
            ],
        ]);
    }

    /**
     * Create a new duel.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'opponent_username' => 'nullable|string|exists:users,username',
            'challenge_id' => 'nullable|integer|exists:challenges,id',
            'difficulty' => 'nullable|string|in:Beginner,Easy,Medium,Hard,Expert',
            'language' => 'nullable|string|max:30',
            'duration_seconds' => 'nullable|integer|min:180|max:3600',
        ]);

        $opponent = null;
        if (!empty($validated['opponent_username'])) {
            $opponent = User::where('username', $validated['opponent_username'])->first();
            if ($opponent && $opponent->id === $user->id) {
                return response()->json([
                    'message' => 'You cannot challenge yourself to a duel.',
                ], 422);
            }
        }

        // Prevent spamming: check if user already has an active duel in progress
        $activeDuelCount = CodeDuel::where(function ($q) use ($user) {
            $q->where('creator_id', $user->id)
              ->orWhere('opponent_id', $user->id);
        })->where('status', CodeDuel::STATUS_ACTIVE)->count();

        if ($activeDuelCount >= 3) {
            return response()->json([
                'message' => 'You already have 3 active duels in progress. Please complete them before creating a new one.',
            ], 429);
        }

        // Select or pick challenge
        $challengeId = $validated['challenge_id'] ?? null;
        if (!$challengeId) {
            $difficulty = $validated['difficulty'] ?? 'Medium';
            $challenge = Challenge::where('is_published', true)
                ->where('challenge_type', 'code')
                ->where('difficulty', $difficulty)
                ->inRandomOrder()
                ->first();

            if (!$challenge) {
                $challenge = Challenge::where('is_published', true)
                    ->where('challenge_type', 'code')
                    ->first();
            }

            if (!$challenge) {
                return response()->json([
                    'message' => 'No published code challenges available for duels.',
                ], 422);
            }

            $challengeId = $challenge->id;
        }

        $durationSeconds = $validated['duration_seconds'] ?? 900;
        $language = $validated['language'] ?? 'python';

        $duel = CodeDuel::create([
            'creator_id' => $user->id,
            'opponent_id' => $opponent?->id,
            'challenge_id' => $challengeId,
            'status' => CodeDuel::STATUS_PENDING,
            'language' => $language,
            'duration_seconds' => $durationSeconds,
            'creator_score' => 0,
            'opponent_score' => 0,
        ]);

        $duel->load(['creator', 'opponent', 'challenge']);

        return response()->json([
            'message' => 'Duel created successfully.',
            'duel' => $duel,
        ], 201);
    }

    /**
     * Get duel details and state for polling.
     */
    public function show(string $uuid, Request $request): JsonResponse
    {
        $user = $request->user();

        $duel = CodeDuel::where('uuid', $uuid)
            ->with(['creator', 'opponent', 'challenge.sampleTestCases', 'winner', 'creatorSubmission', 'opponentSubmission'])
            ->firstOrFail();

        // Check and apply timeout if active and time limit reached
        if ($duel->checkAndApplyTimeout()) {
            $duel->load(['winner', 'creator', 'opponent']);
        }

        $isParticipant = $user && $duel->isParticipant($user);

        // Security: spectator can only view active or completed duels
        if (!$isParticipant && !in_array($duel->status, [CodeDuel::STATUS_ACTIVE, CodeDuel::STATUS_COMPLETED, CodeDuel::STATUS_TIMED_OUT])) {
            return response()->json([
                'message' => 'Unauthorized to view this duel.',
            ], 403);
        }

        $now = Carbon::now();
        $timeRemainingSeconds = 0;
        if ($duel->status === CodeDuel::STATUS_ACTIVE && $duel->ends_at) {
            $timeRemainingSeconds = max(0, $now->diffInSeconds($duel->ends_at, false));
        }

        $myRole = 'spectator';
        if ($user) {
            if ($duel->isCreator($user)) {
                $myRole = 'creator';
            } elseif ($duel->isOpponent($user)) {
                $myRole = 'opponent';
            }
        }

        // Mask opponent's active source code until match is completed
        $creatorCode = ($duel->status === CodeDuel::STATUS_COMPLETED || $duel->status === CodeDuel::STATUS_TIMED_OUT || $myRole === 'creator')
            ? $duel->creator_code
            : null;

        $opponentCode = ($duel->status === CodeDuel::STATUS_COMPLETED || $duel->status === CodeDuel::STATUS_TIMED_OUT || $myRole === 'opponent')
            ? $duel->opponent_code
            : null;

        return response()->json([
            'duel' => [
                'id' => $duel->id,
                'uuid' => $duel->uuid,
                'status' => $duel->status,
                'language' => $duel->language,
                'duration_seconds' => $duel->duration_seconds,
                'started_at' => $duel->started_at?->toIso8601String(),
                'ends_at' => $duel->ends_at?->toIso8601String(),
                'time_remaining_seconds' => $timeRemainingSeconds,
                'result_reason' => $duel->result_reason,
                'winner' => $duel->winner ? [
                    'id' => $duel->winner->id,
                    'name' => $duel->winner->name,
                    'username' => $duel->winner->username,
                    'avatar_url' => $duel->winner->avatar_url,
                ] : null,
            ],
            'challenge' => [
                'id' => $duel->challenge->id,
                'title' => $duel->challenge->title,
                'slug' => $duel->challenge->slug,
                'description' => $duel->challenge->description,
                'difficulty' => $duel->challenge->difficulty,
                'category' => $duel->challenge->category,
                'starter_code' => $duel->challenge->starter_code,
                'sample_test_cases' => $duel->challenge->sampleTestCases->map(fn ($tc) => [
                    'id' => $tc->id,
                    'input_data' => $tc->input_data,
                    'expected_output' => $tc->expected_output,
                    'explanation' => $tc->explanation,
                ]),
            ],
            'creator' => [
                'id' => $duel->creator->id,
                'name' => $duel->creator->name,
                'username' => $duel->creator->username,
                'avatar_url' => $duel->creator->avatar_url,
                'score' => $duel->creator_score,
                'submitted_at' => $duel->creator_submitted_at?->toIso8601String(),
                'has_submitted' => $duel->creator_submitted_at !== null,
                'code' => $creatorCode,
                'submission_status' => $duel->creatorSubmission?->status,
            ],
            'opponent' => $duel->opponent ? [
                'id' => $duel->opponent->id,
                'name' => $duel->opponent->name,
                'username' => $duel->opponent->username,
                'avatar_url' => $duel->opponent->avatar_url,
                'score' => $duel->opponent_score,
                'submitted_at' => $duel->opponent_submitted_at?->toIso8601String(),
                'has_submitted' => $duel->opponent_submitted_at !== null,
                'code' => $opponentCode,
                'submission_status' => $duel->opponentSubmission?->status,
            ] : null,
            'my_role' => $myRole,
        ]);
    }

    /**
     * Accept a pending duel invitation.
     */
    public function accept(string $uuid, Request $request): JsonResponse
    {
        $user = $request->user();

        $duel = CodeDuel::where('uuid', $uuid)->firstOrFail();

        // If open challenge with no assigned opponent, first user to accept takes opponent slot
        if (!$duel->opponent_id && $duel->creator_id !== $user->id) {
            $duel->opponent_id = $user->id;
        }

        if (!$duel->isOpponent($user)) {
            return response()->json([
                'message' => 'Only the invited opponent can accept this duel.',
            ], 403);
        }

        if ($duel->status !== CodeDuel::STATUS_PENDING) {
            return response()->json([
                'message' => 'This duel invitation is no longer pending.',
            ], 400);
        }

        $now = Carbon::now();
        $duel->status = CodeDuel::STATUS_ACTIVE;
        $duel->started_at = $now;
        $duel->ends_at = $now->copy()->addSeconds($duel->duration_seconds);
        $duel->save();

        $duel->load(['creator', 'opponent', 'challenge']);

        return response()->json([
            'message' => 'Duel accepted! Match is now active.',
            'duel' => $duel,
        ]);
    }

    /**
     * Decline a pending duel invitation.
     */
    public function decline(string $uuid, Request $request): JsonResponse
    {
        $user = $request->user();

        $duel = CodeDuel::where('uuid', $uuid)->firstOrFail();

        if (!$duel->isOpponent($user)) {
            return response()->json([
                'message' => 'Only the invited opponent can decline this duel.',
            ], 403);
        }

        if ($duel->status !== CodeDuel::STATUS_PENDING) {
            return response()->json([
                'message' => 'This duel is not in pending status.',
            ], 400);
        }

        $duel->status = CodeDuel::STATUS_DECLINED;
        $duel->result_reason = "{$user->username} declined the invitation.";
        $duel->save();

        return response()->json([
            'message' => 'Duel invitation declined.',
            'duel' => $duel,
        ]);
    }

    /**
     * Cancel a pending duel invitation.
     */
    public function cancel(string $uuid, Request $request): JsonResponse
    {
        $user = $request->user();

        $duel = CodeDuel::where('uuid', $uuid)->firstOrFail();

        if (!$duel->isCreator($user)) {
            return response()->json([
                'message' => 'Only the duel creator can cancel this invitation.',
            ], 403);
        }

        if ($duel->status !== CodeDuel::STATUS_PENDING) {
            return response()->json([
                'message' => 'Only pending duels can be canceled.',
            ], 400);
        }

        $duel->status = CodeDuel::STATUS_CANCELED;
        $duel->result_reason = "Creator canceled the duel before start.";
        $duel->save();

        return response()->json([
            'message' => 'Duel canceled.',
            'duel' => $duel,
        ]);
    }

    /**
     * Forfeit an active duel.
     */
    public function forfeit(string $uuid, Request $request): JsonResponse
    {
        $user = $request->user();

        $duel = CodeDuel::where('uuid', $uuid)->firstOrFail();

        if (!$duel->isParticipant($user)) {
            return response()->json([
                'message' => 'You are not a participant in this duel.',
            ], 403);
        }

        if ($duel->status !== CodeDuel::STATUS_ACTIVE) {
            return response()->json([
                'message' => 'Only active duels can be forfeited.',
            ], 400);
        }

        $winner = $duel->isCreator($user) ? $duel->opponent : $duel->creator;

        $duel->status = CodeDuel::STATUS_COMPLETED;
        $duel->winner_id = $winner?->id;
        $duel->result_reason = "{$user->username} surrendered. {$winner?->username} won by forfeit.";
        $duel->save();

        return response()->json([
            'message' => 'You forfeited the duel.',
            'duel' => $duel,
        ]);
    }

    /**
     * Submit code solution for duel evaluation.
     */
    public function submit(string $uuid, Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'source_code' => 'required|string|max:64000',
        ]);

        $sourceCode = $validated['source_code'];

        $duel = CodeDuel::where('uuid', $uuid)->with('challenge')->firstOrFail();

        if (!$duel->isParticipant($user)) {
            return response()->json([
                'message' => 'You are not authorized to submit for this duel.',
            ], 403);
        }

        // Check if timeout expired
        if ($duel->checkAndApplyTimeout() || $duel->status !== CodeDuel::STATUS_ACTIVE) {
            return response()->json([
                'message' => 'This duel is no longer active.',
            ], 400);
        }

        // Execute untrusted code safely through existing isolated CodeExecutionService via SubmissionService
        $execResult = $this->submissionService->submitSolution(
            $user,
            $duel->challenge,
            $duel->language,
            $sourceCode
        );

        $submission = $execResult['submission'];
        $score = $submission->score;
        $isAccepted = $submission->isAccepted();
        $now = Carbon::now();

        // Transactionally update duel state and evaluate win condition
        DB::transaction(function () use ($duel, $user, $score, $isAccepted, $submission, $sourceCode, $now) {
            $lockedDuel = CodeDuel::where('id', $duel->id)->lockForUpdate()->first();

            if ($lockedDuel->status !== CodeDuel::STATUS_ACTIVE) {
                return;
            }

            $isCreator = $lockedDuel->isCreator($user);

            if ($isCreator) {
                $lockedDuel->creator_score = max($lockedDuel->creator_score, $score);
                $lockedDuel->creator_submission_id = $submission->id;
                $lockedDuel->creator_submitted_at = $now;
                $lockedDuel->creator_code = $sourceCode;
            } else {
                $lockedDuel->opponent_score = max($lockedDuel->opponent_score, $score);
                $lockedDuel->opponent_submission_id = $submission->id;
                $lockedDuel->opponent_submitted_at = $now;
                $lockedDuel->opponent_code = $sourceCode;
            }

            $elapsedSeconds = $lockedDuel->started_at ? $now->diffInSeconds($lockedDuel->started_at) : 0;

            // Win condition check: If player scores 100% (Accepted)
            if ($isAccepted) {
                $opponentScore = $isCreator ? $lockedDuel->opponent_score : $lockedDuel->creator_score;
                $opponentSubmittedAt = $isCreator ? $lockedDuel->opponent_submitted_at : $lockedDuel->creator_submitted_at;

                if ($opponentScore < 100) {
                    // Winner! Solved first
                    $lockedDuel->status = CodeDuel::STATUS_COMPLETED;
                    $lockedDuel->winner_id = $user->id;
                    $lockedDuel->result_reason = "{$user->username} solved the challenge with 100% score in {$elapsedSeconds}s!";
                } else {
                    // Both scored 100%! Compare timestamps
                    if ($opponentSubmittedAt && $now->lessThan($opponentSubmittedAt)) {
                        $lockedDuel->status = CodeDuel::STATUS_COMPLETED;
                        $lockedDuel->winner_id = $user->id;
                        $lockedDuel->result_reason = "{$user->username} solved the challenge faster!";
                    }
                }
            } else {
                // If both players have made their submission and time is low, check for complete resolution
                if ($lockedDuel->creator_submitted_at && $lockedDuel->opponent_submitted_at) {
                    if ($lockedDuel->creator_score > $lockedDuel->opponent_score) {
                        $lockedDuel->status = CodeDuel::STATUS_COMPLETED;
                        $lockedDuel->winner_id = $lockedDuel->creator_id;
                        $lockedDuel->result_reason = "{$lockedDuel->creator->username} scored higher ({$lockedDuel->creator_score} vs {$lockedDuel->opponent_score}).";
                    } elseif ($lockedDuel->opponent_score > $lockedDuel->creator_score) {
                        $lockedDuel->status = CodeDuel::STATUS_COMPLETED;
                        $lockedDuel->winner_id = $lockedDuel->opponent_id;
                        $lockedDuel->result_reason = "{$lockedDuel->opponent->username} scored higher ({$lockedDuel->opponent_score} vs {$lockedDuel->creator_score}).";
                    }
                }
            }

            $lockedDuel->save();
        });

        $duel->refresh();

        return response()->json([
            'message' => 'Code submitted and evaluated.',
            'submission' => [
                'id' => $submission->id,
                'status' => $submission->status,
                'score' => $submission->score,
                'execution_time_ms' => $submission->execution_time_ms,
                'memory_kb' => $submission->memory_kb,
                'error_message' => $submission->error_message,
                'test_results' => $submission->testResults->map(fn ($tr) => [
                    'id' => $tr->id,
                    'status' => $tr->status,
                    'execution_time_ms' => $tr->execution_time_ms,
                    'points_awarded' => $tr->points_awarded,
                ]),
            ],
            'duel_status' => $duel->status,
            'winner_id' => $duel->winner_id,
            'result_reason' => $duel->result_reason,
        ]);
    }
}
