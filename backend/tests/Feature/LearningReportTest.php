<?php

namespace Tests\Feature;

use App\Models\Challenge;
use App\Models\InterviewSession;
use App\Models\Submission;
use App\Models\User;
use App\Models\UserChallengeProgress;
use App\Models\UserGitPlaygroundProgress;
use App\Models\UserStreak;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LearningReportTest extends TestCase
{
    use RefreshDatabase;

    public function test_learning_report_requires_authentication(): void
    {
        $response = $this->getJson('/api/v1/reports/learning');
        $response->assertStatus(401);
    }

    public function test_authenticated_user_can_retrieve_own_learning_report(): void
    {
        $user = User::factory()->create([
            'xp' => 450,
        ]);

        UserStreak::create([
            'user_id' => $user->id,
            'current_streak' => 5,
            'longest_streak' => 12,
            'last_activity_date' => now()->toDateString(),
        ]);

        $challenge = Challenge::factory()->create([
            'category' => 'algorithms',
            'difficulty' => 'Medium',
            'is_published' => true,
        ]);

        // Create user progress & submissions
        UserChallengeProgress::create([
            'user_id' => $user->id,
            'challenge_id' => $challenge->id,
            'best_score' => 100,
            'attempts_count' => 2,
            'solved_at' => now(),
        ]);

        Submission::create([
            'user_id' => $user->id,
            'challenge_id' => $challenge->id,
            'language' => 'python',
            'code' => 'def solve(): return True',
            'status' => 'accepted',
        ]);

        // Create Git Playground progress
        UserGitPlaygroundProgress::create([
            'user_id' => $user->id,
            'scenario_id' => 'first-commit',
            'commands_count' => 4,
            'xp_earned' => 25,
            'completed_at' => now(),
        ]);

        // Create Interview session
        InterviewSession::create([
            'user_id' => $user->id,
            'session_token' => 'test-token-uuid-1',
            'topic' => 'algorithms',
            'difficulty' => 'Medium',
            'duration_minutes' => 30,
            'started_at' => now()->subMinutes(25),
            'completed_at' => now(),
            'status' => 'completed',
            'score' => 85,
            'passed' => true,
            'xp_awarded' => 100,
            'feedback_summary' => ['grade' => 'Hire / Mid-Level'],
        ]);

        $response = $this->actingAs($user)->getJson('/api/v1/reports/learning?range=30d');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'range' => '30d',
                    'overview' => [
                        'challenges_solved' => 1,
                        'current_streak' => 5,
                        'best_streak' => 12,
                    ],
                    'git_playground' => [
                        'scenarios_completed' => 1,
                        'commands_executed' => 4,
                        'xp_earned' => 25,
                    ],
                    'interview' => [
                        'sessions_completed' => 1,
                        'sessions_passed' => 1,
                        'pass_rate' => 100,
                    ],
                ],
            ]);

        $this->assertArrayHasKey('activity_timeline', $response->json('data'));
        $this->assertArrayHasKey('skill_breakdown', $response->json('data'));
        $this->assertArrayHasKey('methodology', $response->json('data'));
    }

    public function test_learning_report_respects_time_ranges(): void
    {
        $user = User::factory()->create();

        $response7d = $this->actingAs($user)->getJson('/api/v1/reports/learning?range=7d');
        $response7d->assertStatus(200)->assertJsonPath('data.range', '7d');

        $responseAll = $this->actingAs($user)->getJson('/api/v1/reports/learning?range=all');
        $responseAll->assertStatus(200)->assertJsonPath('data.range', 'all');
    }

    public function test_user_cannot_view_another_users_learning_report(): void
    {
        $userA = User::factory()->create(['role' => 'user']);
        $userB = User::factory()->create(['role' => 'user']);

        $response = $this->actingAs($userA)->getJson("/api/v1/reports/learning/{$userB->id}");
        $response->assertStatus(403);
    }

    public function test_admin_can_view_any_users_learning_report(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $user = User::factory()->create(['role' => 'user']);

        $response = $this->actingAs($admin)->getJson("/api/v1/reports/learning/{$user->id}");
        $response->assertStatus(200)
            ->assertJsonPath('data.user.id', $user->id);
    }

    public function test_empty_state_handled_gracefully_with_zero_activity(): void
    {
        $freshUser = User::factory()->create(['xp' => 0]);

        $response = $this->actingAs($freshUser)->getJson('/api/v1/reports/learning');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'overview' => [
                        'challenges_attempted' => 0,
                        'challenges_solved' => 0,
                        'completion_rate' => 0,
                        'total_submissions' => 0,
                        'accepted_submissions' => 0,
                        'accuracy_rate' => 0,
                        'active_days_count' => 0,
                    ],
                    'git_playground' => [
                        'scenarios_completed' => 0,
                    ],
                    'interview' => [
                        'sessions_completed' => 0,
                    ],
                ],
            ]);
    }
}
