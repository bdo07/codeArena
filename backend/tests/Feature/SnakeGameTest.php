<?php

namespace Tests\Feature;

use App\Models\SnakeGame;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SnakeGameTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_user_cannot_access_snake_endpoints(): void
    {
        $this->postJson('/api/v1/snake/start')->assertStatus(401);
        $this->postJson('/api/v1/snake/finish', [
            'session_id' => 'fake-session',
            'score' => 10,
            'apples_eaten' => 1,
            'moves_count' => 5,
        ])->assertStatus(401);
        $this->getJson('/api/v1/snake/stats')->assertStatus(401);
    }

    public function test_authenticated_user_can_start_session(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/v1/snake/start');

        $response->assertStatus(201)
            ->assertJsonStructure(['session_id', 'started_at']);

        $sessionId = $response->json('session_id');

        $this->assertDatabaseHas('snake_games', [
            'user_id' => $user->id,
            'session_id' => $sessionId,
            'status' => 'in_progress',
        ]);
    }

    public function test_authenticated_user_can_finish_session_and_record_verified_score(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $startRes = $this->postJson('/api/v1/snake/start');
        $sessionId = $startRes->json('session_id');

        $finishRes = $this->postJson('/api/v1/snake/finish', [
            'session_id' => $sessionId,
            'score' => 50,
            'apples_eaten' => 5,
            'moves_count' => 25,
        ]);

        $finishRes->assertStatus(200)
            ->assertJsonPath('game.session_id', $sessionId)
            ->assertJsonPath('game.score', 50)
            ->assertJsonPath('game.is_verified', true)
            ->assertJsonPath('stats.total_games', 1)
            ->assertJsonPath('stats.high_score', 50);

        $this->assertDatabaseHas('snake_games', [
            'session_id' => $sessionId,
            'status' => 'completed',
            'score' => 50,
            'is_verified' => 1,
        ]);
    }

    public function test_session_cannot_be_finished_twice(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $startRes = $this->postJson('/api/v1/snake/start');
        $sessionId = $startRes->json('session_id');

        $this->postJson('/api/v1/snake/finish', [
            'session_id' => $sessionId,
            'score' => 30,
            'apples_eaten' => 3,
            'moves_count' => 15,
        ])->assertStatus(200);

        // Second submission should be rejected with 409
        $secondRes = $this->postJson('/api/v1/snake/finish', [
            'session_id' => $sessionId,
            'score' => 30,
            'apples_eaten' => 3,
            'moves_count' => 15,
        ]);

        $secondRes->assertStatus(409)
            ->assertJsonPath('message', 'This game session has already been recorded.');
    }

    public function test_user_cannot_finish_another_users_session(): void
    {
        $userA = User::factory()->create();
        $userB = User::factory()->create();

        Sanctum::actingAs($userA);
        $startRes = $this->postJson('/api/v1/snake/start');
        $sessionId = $startRes->json('session_id');

        // Switch to User B
        Sanctum::actingAs($userB);
        $finishRes = $this->postJson('/api/v1/snake/finish', [
            'session_id' => $sessionId,
            'score' => 10,
            'apples_eaten' => 1,
            'moves_count' => 10,
        ]);

        $finishRes->assertStatus(404);
    }

    public function test_suspicious_score_is_marked_unverified(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $startRes = $this->postJson('/api/v1/snake/start');
        $sessionId = $startRes->json('session_id');

        // Claiming 100 score (10 apples) with 0 moves
        $finishRes = $this->postJson('/api/v1/snake/finish', [
            'session_id' => $sessionId,
            'score' => 100,
            'apples_eaten' => 10,
            'moves_count' => 0,
        ]);

        $finishRes->assertStatus(200)
            ->assertJsonPath('game.is_verified', false);

        $this->assertDatabaseHas('snake_games', [
            'session_id' => $sessionId,
            'is_verified' => 0,
        ]);
    }

    public function test_can_import_guest_score_as_unverified(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $res = $this->postJson('/api/v1/snake/import-guest-score', [
            'score' => 120,
            'apples_eaten' => 12,
        ]);

        $res->assertStatus(200)
            ->assertJsonPath('stats.high_score', 120);

        $this->assertDatabaseHas('snake_games', [
            'user_id' => $user->id,
            'score' => 120,
            'is_imported' => 1,
            'is_verified' => 0,
            'status' => 'completed',
        ]);
    }

    public function test_stats_and_profile_integration(): void
    {
        $user = User::factory()->create(['username' => 'snakemaster']);
        Sanctum::actingAs($user);

        // Record two games
        $start1 = $this->postJson('/api/v1/snake/start')->json('session_id');
        $this->postJson('/api/v1/snake/finish', [
            'session_id' => $start1,
            'score' => 40,
            'apples_eaten' => 4,
            'moves_count' => 20,
        ]);

        $start2 = $this->postJson('/api/v1/snake/start')->json('session_id');
        $this->postJson('/api/v1/snake/finish', [
            'session_id' => $start2,
            'score' => 80,
            'apples_eaten' => 8,
            'moves_count' => 35,
        ]);

        // Check private stats endpoint
        $statsRes = $this->getJson('/api/v1/snake/stats');
        $statsRes->assertStatus(200)
            ->assertJsonPath('total_games', 2)
            ->assertJsonPath('high_score', 80)
            ->assertJsonPath('cumulative_score', 120)
            ->assertJsonPath('average_score', 60);

        // Check public profile endpoint includes snake_stats
        $profileRes = $this->getJson('/api/v1/profile/snakemaster');
        $profileRes->assertStatus(200)
            ->assertJsonPath('profile.snake_stats.total_games', 2)
            ->assertJsonPath('profile.snake_stats.high_score', 80)
            ->assertJsonPath('profile.snake_stats.cumulative_score', 120)
            ->assertJsonPath('profile.snake_stats.average_score', 60);
    }
}
