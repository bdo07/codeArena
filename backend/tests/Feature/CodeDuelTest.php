<?php

namespace Tests\Feature;

use App\Models\Challenge;
use App\Models\CodeDuel;
use App\Models\TestCase as TestCaseModel;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CodeDuelTest extends TestCase
{
    use RefreshDatabase;

    protected User $creator;
    protected User $opponent;
    protected Challenge $challenge;

    protected function setUp(): void
    {
        parent::setUp();

        $this->creator = User::factory()->create(['username' => 'alice', 'status' => 'active']);
        $this->opponent = User::factory()->create(['username' => 'bob', 'status' => 'active']);

        $this->challenge = Challenge::create([
            'title' => 'Two Sum',
            'slug' => 'two-sum',
            'description' => 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
            'difficulty' => 'Easy',
            'category' => 'Algorithms',
            'challenge_type' => 'code',
            'xp_reward' => 50,
            'is_published' => true,
            'starter_code' => ['python' => 'def two_sum(nums, target): pass'],
        ]);

        TestCaseModel::create([
            'challenge_id' => $this->challenge->id,
            'input_data' => "2,7,11,15\n9",
            'expected_output' => '0,1',
            'is_sample' => true,
            'points' => 50,
            'position' => 1,
        ]);

        TestCaseModel::create([
            'challenge_id' => $this->challenge->id,
            'input_data' => "3,2,4\n6",
            'expected_output' => '1,2',
            'is_sample' => false,
            'points' => 50,
            'position' => 2,
        ]);
    }

    public function test_user_can_create_duel_with_opponent(): void
    {
        $response = $this->actingAs($this->creator, 'sanctum')->postJson('/api/v1/duels', [
            'opponent_username' => 'bob',
            'challenge_id' => $this->challenge->id,
            'language' => 'python',
            'duration_seconds' => 600,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('duel.status', 'pending')
            ->assertJsonPath('duel.creator_id', $this->creator->id)
            ->assertJsonPath('duel.opponent_id', $this->opponent->id)
            ->assertJsonPath('duel.challenge_id', $this->challenge->id)
            ->assertJsonPath('duel.duration_seconds', 600);

        $this->assertDatabaseHas('code_duels', [
            'creator_id' => $this->creator->id,
            'opponent_id' => $this->opponent->id,
            'status' => 'pending',
        ]);
    }

    public function test_user_cannot_challenge_themselves(): void
    {
        $response = $this->actingAs($this->creator, 'sanctum')->postJson('/api/v1/duels', [
            'opponent_username' => 'alice',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('message', 'You cannot challenge yourself to a duel.');
    }

    public function test_opponent_can_accept_duel_and_timer_starts(): void
    {
        $duel = CodeDuel::create([
            'creator_id' => $this->creator->id,
            'opponent_id' => $this->opponent->id,
            'challenge_id' => $this->challenge->id,
            'status' => CodeDuel::STATUS_PENDING,
            'language' => 'python',
            'duration_seconds' => 900,
        ]);

        $response = $this->actingAs($this->opponent, 'sanctum')->postJson("/api/v1/duels/{$duel->uuid}/accept");

        $response->assertStatus(200)
            ->assertJsonPath('duel.status', 'active');

        $duel->refresh();
        $this->assertEquals(CodeDuel::STATUS_ACTIVE, $duel->status);
        $this->assertNotNull($duel->started_at);
        $this->assertNotNull($duel->ends_at);
    }

    public function test_unauthorized_user_cannot_accept_duel(): void
    {
        $thirdParty = User::factory()->create(['username' => 'charlie', 'status' => 'active']);

        $duel = CodeDuel::create([
            'creator_id' => $this->creator->id,
            'opponent_id' => $this->opponent->id,
            'challenge_id' => $this->challenge->id,
            'status' => CodeDuel::STATUS_PENDING,
            'language' => 'python',
            'duration_seconds' => 900,
        ]);

        $response = $this->actingAs($thirdParty, 'sanctum')->postJson("/api/v1/duels/{$duel->uuid}/accept");

        $response->assertStatus(403);
    }

    public function test_opponent_can_decline_duel(): void
    {
        $duel = CodeDuel::create([
            'creator_id' => $this->creator->id,
            'opponent_id' => $this->opponent->id,
            'challenge_id' => $this->challenge->id,
            'status' => CodeDuel::STATUS_PENDING,
            'language' => 'python',
            'duration_seconds' => 900,
        ]);

        $response = $this->actingAs($this->opponent, 'sanctum')->postJson("/api/v1/duels/{$duel->uuid}/decline");

        $response->assertStatus(200)
            ->assertJsonPath('duel.status', 'declined');

        $duel->refresh();
        $this->assertEquals(CodeDuel::STATUS_DECLINED, $duel->status);
    }

    public function test_creator_can_cancel_pending_duel(): void
    {
        $duel = CodeDuel::create([
            'creator_id' => $this->creator->id,
            'opponent_id' => $this->opponent->id,
            'challenge_id' => $this->challenge->id,
            'status' => CodeDuel::STATUS_PENDING,
            'language' => 'python',
            'duration_seconds' => 900,
        ]);

        $response = $this->actingAs($this->creator, 'sanctum')->postJson("/api/v1/duels/{$duel->uuid}/cancel");

        $response->assertStatus(200)
            ->assertJsonPath('duel.status', 'canceled');

        $duel->refresh();
        $this->assertEquals(CodeDuel::STATUS_CANCELED, $duel->status);
    }

    public function test_participant_can_forfeit_active_duel(): void
    {
        $now = Carbon::now();
        $duel = CodeDuel::create([
            'creator_id' => $this->creator->id,
            'opponent_id' => $this->opponent->id,
            'challenge_id' => $this->challenge->id,
            'status' => CodeDuel::STATUS_ACTIVE,
            'started_at' => $now,
            'ends_at' => $now->copy()->addMinutes(15),
            'language' => 'python',
            'duration_seconds' => 900,
        ]);

        // Creator forfeits -> opponent bob wins
        $response = $this->actingAs($this->creator, 'sanctum')->postJson("/api/v1/duels/{$duel->uuid}/forfeit");

        $response->assertStatus(200)
            ->assertJsonPath('duel.status', 'completed')
            ->assertJsonPath('duel.winner_id', $this->opponent->id);

        $duel->refresh();
        $this->assertEquals(CodeDuel::STATUS_COMPLETED, $duel->status);
        $this->assertEquals($this->opponent->id, $duel->winner_id);
    }

    public function test_timeout_expires_active_duel(): void
    {
        $past = Carbon::now()->subMinutes(16);
        $duel = CodeDuel::create([
            'creator_id' => $this->creator->id,
            'opponent_id' => $this->opponent->id,
            'challenge_id' => $this->challenge->id,
            'status' => CodeDuel::STATUS_ACTIVE,
            'started_at' => $past,
            'ends_at' => $past->copy()->addMinutes(15),
            'language' => 'python',
            'duration_seconds' => 900,
            'creator_score' => 50,
            'opponent_score' => 0,
        ]);

        // Viewing the duel triggers checkAndApplyTimeout
        $response = $this->actingAs($this->creator, 'sanctum')->getJson("/api/v1/duels/{$duel->uuid}");

        $response->assertStatus(200)
            ->assertJsonPath('duel.status', 'timed_out')
            ->assertJsonPath('duel.winner.id', $this->creator->id);

        $duel->refresh();
        $this->assertEquals(CodeDuel::STATUS_TIMED_OUT, $duel->status);
        $this->assertEquals($this->creator->id, $duel->winner_id);
    }

    public function test_duel_submission_accepts_solution_and_resolves_winner(): void
    {
        $now = Carbon::now();
        $duel = CodeDuel::create([
            'creator_id' => $this->creator->id,
            'opponent_id' => $this->opponent->id,
            'challenge_id' => $this->challenge->id,
            'status' => CodeDuel::STATUS_ACTIVE,
            'started_at' => $now,
            'ends_at' => $now->copy()->addMinutes(15),
            'language' => 'python',
            'duration_seconds' => 900,
        ]);

        $validSolution = "import sys\ndef two_sum(nums, target):\n    lookup = {}\n    for i, num in enumerate(nums):\n        diff = target - num\n        if diff in lookup:\n            return f'{lookup[diff]},{i}'\n        lookup[num] = i\n    return ''\n";

        $response = $this->actingAs($this->creator, 'sanctum')->postJson("/api/v1/duels/{$duel->uuid}/submit", [
            'source_code' => $validSolution,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('submission.status', 'Accepted')
            ->assertJsonPath('duel_status', 'completed')
            ->assertJsonPath('winner_id', $this->creator->id);

        $duel->refresh();
        $this->assertEquals(CodeDuel::STATUS_COMPLETED, $duel->status);
        $this->assertEquals($this->creator->id, $duel->winner_id);
    }

    public function test_list_duels_returns_user_matches(): void
    {
        $duel = CodeDuel::create([
            'creator_id' => $this->creator->id,
            'opponent_id' => $this->opponent->id,
            'challenge_id' => $this->challenge->id,
            'status' => CodeDuel::STATUS_PENDING,
            'language' => 'python',
            'duration_seconds' => 900,
        ]);

        // Bob checks invites tab
        $response = $this->actingAs($this->opponent, 'sanctum')->getJson('/api/v1/duels?tab=invites');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.uuid', $duel->uuid);
    }
}
