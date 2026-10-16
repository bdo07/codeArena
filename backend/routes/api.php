<?php

use App\Http\Controllers\Api\V1\Admin\AnalyticsAdminController;
use App\Http\Controllers\Api\V1\Admin\ChallengeAdminController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\ChallengeController;
use App\Http\Controllers\Api\V1\CollectionController;
use App\Http\Controllers\Api\V1\ContestController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\DiscussionController;
use App\Http\Controllers\Api\V1\LanguageController;
use App\Http\Controllers\Api\V1\LeaderboardController;
use App\Http\Controllers\Api\V1\NoteController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\ProfileController;
use App\Http\Controllers\Api\V1\QuestController;
use App\Http\Controllers\Api\V1\RoadmapController;
use App\Http\Controllers\Api\V1\SnakeGameController;
use App\Http\Controllers\Api\V1\SubmissionController;
use App\Http\Middleware\EnsureAdmin;
use Illuminate\Support\Facades\Route;

// Global Health Check
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'service' => 'CodeArena API',
        'timestamp' => now()->toIso8601String(),
        'execution_provider' => env('JUDGE0_URL') ? 'Judge0 CE' : 'Safe Local Engine (Fallback)',
    ]);
});

// V1 API Routes
Route::prefix('v1')->group(function () {

    // Health
    Route::get('/health', function () {
        return response()->json([
            'status' => 'ok',
            'version' => 'v1',
            'timestamp' => now()->toIso8601String(),
        ]);
    });

    // 1. Authentication
    Route::prefix('auth')->group(function () {
        Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
        Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

        Route::middleware('auth:sanctum')->group(function () {
            Route::post('/logout', [AuthController::class, 'logout']);
            Route::get('/me', [AuthController::class, 'me']);
        });
    });

    // Current user alias (/api/v1/user)
    Route::middleware('auth:sanctum')->get('/user', [AuthController::class, 'me']);

    // 2. Languages & Technologies Catalog
    Route::get('/languages', [LanguageController::class, 'index']);

    // 3. Daily Challenge
    Route::get('/daily-challenge', [ChallengeController::class, 'daily']);

    // 4. Challenges & Safe Runners
    Route::get('/challenges', [ChallengeController::class, 'index']);
    Route::get('/challenges/{slug}', [ChallengeController::class, 'show']);
    Route::post('/challenges/{challenge}/run', [ChallengeController::class, 'run'])
        ->middleware('throttle:30,1');
    Route::post('/challenges/{challenge}/run-sql', [ChallengeController::class, 'runSql'])
        ->middleware('throttle:30,1');

    // 5. Community Discussions (Public read)
    Route::get('/challenges/{challenge}/discussions', [DiscussionController::class, 'index']);

    // 6. Roadmaps & Learning Tracks
    Route::get('/roadmaps', [RoadmapController::class, 'index']);
    Route::get('/roadmaps/{slug}', [RoadmapController::class, 'show']);

    // 7. Contests (Public read)
    Route::get('/contests', [ContestController::class, 'index']);
    Route::get('/contests/{slug}', [ContestController::class, 'show']);
    Route::get('/contests/{slug}/leaderboard', [ContestController::class, 'leaderboard']);

    // 8. Collections (Public read)
    Route::get('/collections', [CollectionController::class, 'index']);
    Route::get('/collections/{id}', [CollectionController::class, 'show']);

    // 9. Public Leaderboard & User Profiles
    Route::get('/leaderboard', [LeaderboardController::class, 'index']);
    Route::get('/users/{username}', [ProfileController::class, 'show']);
    Route::get('/profile/{username}', [ProfileController::class, 'show']);

    // Authenticated Endpoints
    Route::middleware('auth:sanctum')->group(function () {

        // Profile Management (Self)
        Route::put('/profile', [ProfileController::class, 'update']);
        Route::post('/profile/avatar', [ProfileController::class, 'uploadAvatar']);
        Route::delete('/profile/avatar', [ProfileController::class, 'deleteAvatar']);

        // Snake Arcade Game Endpoints
        Route::post('/snake/start', [SnakeGameController::class, 'start'])
            ->middleware('throttle:60,1');
        Route::post('/snake/finish', [SnakeGameController::class, 'finish'])
            ->middleware('throttle:60,1');
        Route::get('/snake/stats', [SnakeGameController::class, 'stats']);
        Route::post('/snake/import-guest-score', [SnakeGameController::class, 'importGuestScore'])
            ->middleware('throttle:15,1');

        // Challenge Submissions (Grading & XP)
        Route::post('/challenges/{challenge}/submit', [ChallengeController::class, 'submit'])
            ->middleware('throttle:15,1');
        Route::post('/challenges/{challenge}/submit-sql', [ChallengeController::class, 'submitSql'])
            ->middleware('throttle:15,1');
        Route::post('/challenges/{challenge}/submit-quiz', [ChallengeController::class, 'submitQuiz'])
            ->middleware('throttle:15,1');
        Route::post('/challenges/{challenge}/quiz/submit', [ChallengeController::class, 'submitQuiz'])
            ->middleware('throttle:15,1');
        Route::post('/challenges/{challenge}/bookmark', [ChallengeController::class, 'toggleBookmark']);

        // Private Notes
        Route::get('/challenges/{challenge}/note', [NoteController::class, 'show']);
        Route::post('/challenges/{challenge}/note', [NoteController::class, 'store']);

        // Discussion Actions
        Route::post('/challenges/{challenge}/discussions', [DiscussionController::class, 'store']);
        Route::post('/discussions/{id}/replies', [DiscussionController::class, 'reply']);
        Route::post('/discussions/{id}/like', [DiscussionController::class, 'toggleLikeDiscussion']);
        Route::post('/discussion-replies/{id}/like', [DiscussionController::class, 'toggleLikeReply']);

        // Collection Management
        Route::post('/collections', [CollectionController::class, 'store']);
        Route::post('/collections/{id}/challenges', [CollectionController::class, 'addChallenge']);
        Route::delete('/collections/{id}/challenges/{challengeId}', [CollectionController::class, 'removeChallenge']);

        // Contest Registration
        Route::post('/contests/{slug}/register', [ContestController::class, 'register']);

        // Notifications
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);

        // User Submissions History
        Route::get('/submissions', [SubmissionController::class, 'index']);
        Route::get('/submissions/{submission}', [SubmissionController::class, 'show']);

        // Dashboard Stats
        Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
    });

    // Admin Protected Endpoints
    Route::prefix('admin')->middleware(['auth:sanctum', EnsureAdmin::class])->group(function () {
        Route::get('/analytics', [AnalyticsAdminController::class, 'index']);
        Route::post('/challenges/import', [ChallengeAdminController::class, 'import']);
        Route::get('/challenges/export', [ChallengeAdminController::class, 'export']);
        Route::apiResource('challenges', ChallengeAdminController::class);
    });
});
