<?php

use App\Http\Controllers\Api\V1\Admin\ChallengeAdminController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\ChallengeController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\LeaderboardController;
use App\Http\Controllers\Api\V1\ProfileController;
use App\Http\Controllers\Api\V1\SubmissionController;
use App\Http\Middleware\EnsureAdmin;
use Illuminate\Support\Facades\Route;

// Health / Status endpoint
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'service' => 'CodeArena API',
        'timestamp' => now()->toIso8601String(),
        'execution_provider' => env('JUDGE0_URL') ? 'Judge0 CE' : 'Safe Local Engine (Fallback)',
    ]);
});

// V1 Routes
Route::prefix('v1')->group(function () {

    // Health
    Route::get('/health', function () {
        return response()->json([
            'status' => 'ok',
            'version' => 'v1',
            'timestamp' => now()->toIso8601String(),
        ]);
    });

    // Authentication (Rate-limited)
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

    // Public Challenges & Run Code
    Route::get('/challenges', [ChallengeController::class, 'index']);
    Route::get('/challenges/{slug}', [ChallengeController::class, 'show']);
    Route::post('/challenges/{challenge}/run', [ChallengeController::class, 'run'])
        ->middleware('throttle:30,1');

    // Protected Challenge Submission
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/challenges/{challenge}/submit', [ChallengeController::class, 'submit'])
            ->middleware('throttle:15,1');

        // Submissions
        Route::get('/submissions', [SubmissionController::class, 'index']);
        Route::get('/submissions/{submission}', [SubmissionController::class, 'show']);

        // Dashboard Stats
        Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
    });

    // Public Leaderboard & User Profiles
    Route::get('/leaderboard', [LeaderboardController::class, 'index']);
    Route::get('/users/{username}', [ProfileController::class, 'show']);

    // Admin Protected Endpoints
    Route::prefix('admin')->middleware(['auth:sanctum', EnsureAdmin::class])->group(function () {
        Route::apiResource('challenges', ChallengeAdminController::class);
    });
});
