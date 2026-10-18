<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\InterviewService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InterviewController extends Controller
{
    public function __construct(
        protected InterviewService $interviewService
    ) {}

    /**
     * Start a new timed mock interview session.
     */
    public function start(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'topic' => 'nullable|string|in:algorithms,frontend,backend,sql,fullstack',
            'difficulty' => 'nullable|string|in:Beginner,Easy,Medium,Hard,Expert',
            'duration_minutes' => 'nullable|integer|in:15,30,60',
        ]);

        $user = $request->user('sanctum');
        $sessionData = $this->interviewService->startSession($validated, $user);

        return response()->json([
            'status' => 'success',
            'data' => $sessionData,
        ]);
    }

    /**
     * Autosave intermediate draft answer.
     */
    public function saveAnswer(Request $request, string $token): JsonResponse
    {
        $validated = $request->validate([
            'question_id' => 'required|integer',
            'answer' => 'nullable|string',
        ]);

        $user = $request->user('sanctum');
        $saved = $this->interviewService->saveAnswer(
            $token,
            $validated['question_id'],
            $validated['answer'] ?? '',
            $user
        );

        return response()->json([
            'status' => 'success',
            'saved' => $saved,
        ]);
    }

    /**
     * Submit and finish interview session, calculate score and generate report.
     */
    public function finish(Request $request, string $token): JsonResponse
    {
        $validated = $request->validate([
            'answers' => 'nullable|array',
        ]);

        $user = $request->user('sanctum');
        $result = $this->interviewService->finishSession(
            $token,
            $validated['answers'] ?? [],
            $user
        );

        return response()->json([
            'status' => 'success',
            'data' => $result,
        ]);
    }

    /**
     * Get past interview history for authenticated user.
     */
    public function history(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Authentication required.',
            ], 401);
        }

        $history = $this->interviewService->getHistory($user);

        return response()->json([
            'status' => 'success',
            'data' => $history,
        ]);
    }

    /**
     * Get single completed interview report.
     */
    public function result(Request $request, string $token): JsonResponse
    {
        $user = $request->user('sanctum');
        $session = \App\Models\InterviewSession::where('session_token', $token)->firstOrFail();

        if ($session->user_id !== null) {
            if (! $user || ($user->id !== $session->user_id && ! $user->isAdmin())) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Unauthorized to view this private interview report.',
                ], 403);
            }
        }

        $report = $this->interviewService->formatCompletedResult($session);

        return response()->json([
            'status' => 'success',
            'data' => $report,
        ]);
    }
}
