<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\SubmissionResource;
use App\Models\Submission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubmissionController extends Controller
{
    /**
     * Get paginated submissions for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Submission::where('user_id', $user->id)
            ->with(['challenge', 'testResults.testCase'])
            ->orderBy('created_at', 'desc');

        if ($challengeId = $request->input('challenge_id')) {
            $query->where('challenge_id', $challengeId);
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $perPage = max(1, min(50, (int) $request->input('per_page', 15)));
        $submissions = $query->paginate($perPage);

        return response()->json([
            'data' => SubmissionResource::collection($submissions),
            'meta' => [
                'current_page' => $submissions->currentPage(),
                'last_page' => $submissions->lastPage(),
                'per_page' => $submissions->perPage(),
                'total' => $submissions->total(),
            ],
        ]);
    }

    /**
     * Get single submission details.
     * Enforces strict authorization: user must own submission or be admin.
     */
    public function show(Submission $submission, Request $request): JsonResponse
    {
        $user = $request->user();

        if ($submission->user_id !== $user->id && !$user->isAdmin()) {
            return response()->json([
                'message' => 'You are not authorized to view this submission.'
            ], 403);
        }

        $submission->load(['challenge', 'testResults.testCase', 'user']);

        return response()->json([
            'submission' => new SubmissionResource($submission),
        ]);
    }
}
