<?php

use App\Http\Controllers\Api\V1\Admin\AnalyticsAdminController;
use App\Http\Controllers\Api\V1\Admin\AppealAdminController;
use App\Http\Controllers\Api\V1\Admin\AuditLogAdminController;
use App\Http\Controllers\Api\V1\Admin\ChallengeAdminController;
use App\Http\Controllers\Api\V1\Admin\UserAdminController;
use App\Http\Controllers\Api\V1\AppealController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\ChallengeController;
use App\Http\Controllers\Api\V1\CollectionController;
use App\Http\Controllers\Api\V1\ContestController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\DiscussionController;
use App\Http\Controllers\Api\V1\GitPlaygroundController;
use App\Http\Controllers\Api\V1\InterviewController;
use App\Http\Controllers\Api\V1\LanguageController;
use App\Http\Controllers\Api\V1\LeaderboardController;
use App\Http\Controllers\Api\V1\LearningReportController;
use App\Http\Controllers\Api\V1\NoteController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\ProfileController;
use App\Http\Controllers\Api\V1\QuestController;
use App\Http\Controllers\Api\V1\RoadmapController;
use App\Http\Controllers\Api\V1\ShareableCardController;
use App\Http\Controllers\Api\V1\SnakeGameController;
use App\Http\Controllers\Api\V1\SubmissionController;
use App\Http\Middleware\EnsureAccountActive;
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

    // 10. CodeArena Quest (Public map exploration & progression)
    Route::get('/quests', [QuestController::class, 'index']);
    Route::get('/quests/progression', [QuestController::class, 'progression']);
    Route::get('/quests/{slug}', [QuestController::class, 'show']);

    // 11. Git Playground
    Route::get('/git-playground/progress', [GitPlaygroundController::class, 'progress']);

    // 12. Mock Technical Interviews
    Route::post('/interviews/start', [InterviewController::class, 'start'])
        ->middleware('throttle:30,1');
    Route::post('/interviews/{token}/save-answer', [InterviewController::class, 'saveAnswer'])
        ->middleware('throttle:60,1');
    Route::post('/interviews/{token}/finish', [InterviewController::class, 'finish'])
        ->middleware('throttle:30,1');
    Route::get('/interviews/{token}/result', [InterviewController::class, 'result']);

    // 13. Public Shareable Progress Card
    Route::get('/share-card/public/{token}', [ShareableCardController::class, 'showPublic'])
        ->middleware('throttle:60,1');

    // 14. Account Appeals (Submission for suspended/banned users)
    Route::post('/appeals', [AppealController::class, 'store'])
        ->middleware('throttle:10,1');

    // Authenticated Endpoints
    Route::middleware('auth:sanctum')->group(function () {

        // Appeals status check
        Route::get('/appeals/my-appeal', [AppealController::class, 'myAppeal']);

        // Notifications
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);

        // User Submissions History & Reports (Read)
        Route::get('/submissions', [SubmissionController::class, 'index']);
        Route::get('/submissions/{submission}', [SubmissionController::class, 'show']);
        Route::get('/reports/learning', [LearningReportController::class, 'show']);
        Route::get('/reports/learning/{userId}', [LearningReportController::class, 'show']);
        Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
        Route::get('/interviews/history', [InterviewController::class, 'history']);
        Route::get('/snake/stats', [SnakeGameController::class, 'stats']);
        Route::get('/challenges/{challenge}/note', [NoteController::class, 'show']);
        Route::get('/share-card/settings', [ShareableCardController::class, 'getSettings']);

        // State-Modifying Actions Guarded by EnsureAccountActive
        Route::middleware(EnsureAccountActive::class)->group(function () {

            // Git Playground Progress & XP
            Route::post('/git-playground/scenarios/{id}/complete', [GitPlaygroundController::class, 'complete'])
                ->middleware('throttle:30,1');

            // Quest Rewards & Progress
            Route::post('/quests/stages/{id}/claim', [QuestController::class, 'claimStageReward'])
                ->middleware('throttle:30,1');
            Route::post('/quests/daily-missions/{id}/claim', [QuestController::class, 'claimDailyMission'])
                ->middleware('throttle:30,1');

            // Profile Management (Self)
            Route::put('/profile', [ProfileController::class, 'update']);
            Route::post('/profile/avatar', [ProfileController::class, 'uploadAvatar']);
            Route::delete('/profile/avatar', [ProfileController::class, 'deleteAvatar']);

            // Snake Arcade Game Endpoints
            Route::post('/snake/start', [SnakeGameController::class, 'start'])
                ->middleware('throttle:60,1');
            Route::post('/snake/finish', [SnakeGameController::class, 'finish'])
                ->middleware('throttle:60,1');
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

            // Shareable Achievement Cards
            Route::put('/share-card/settings', [ShareableCardController::class, 'updateSettings']);
            Route::post('/share-card/regenerate-token', [ShareableCardController::class, 'regenerateToken']);
        });
    });

    // Admin Protected Endpoints
    Route::prefix('admin')->middleware(['auth:sanctum', EnsureAdmin::class])->group(function () {
        Route::get('/analytics', [AnalyticsAdminController::class, 'index']);
        Route::post('/challenges/import', [ChallengeAdminController::class, 'import']);
        Route::get('/challenges/export', [ChallengeAdminController::class, 'export']);
        Route::apiResource('challenges', ChallengeAdminController::class);

        // User Management & Moderation
        Route::get('/users', [UserAdminController::class, 'index']);
        Route::get('/users/{id}', [UserAdminController::class, 'show']);
        Route::post('/users/{id}/warn', [UserAdminController::class, 'warn']);
        Route::post('/users/{id}/suspend', [UserAdminController::class, 'suspend']);
        Route::post('/users/{id}/unsuspend', [UserAdminController::class, 'unsuspend']);
        Route::post('/users/{id}/ban', [UserAdminController::class, 'ban']);
        Route::post('/users/{id}/unban', [UserAdminController::class, 'unban']);
        Route::put('/users/{id}/role', [UserAdminController::class, 'updateRole']);
        Route::delete('/users/{id}', [UserAdminController::class, 'destroy']);
        Route::post('/users/{id}/restore', [UserAdminController::class, 'restore']);
        Route::delete('/users/{id}/force', [UserAdminController::class, 'forceDelete']);

        // Moderation Audit Logs (Append-only)
        Route::get('/audit-logs', [AuditLogAdminController::class, 'index']);
        Route::get('/audit-logs/{id}', [AuditLogAdminController::class, 'show']);

        // Appeals Review
        Route::get('/appeals', [AppealAdminController::class, 'index']);
        Route::post('/appeals/{id}/review', [AppealAdminController::class, 'review']);
    });
});
