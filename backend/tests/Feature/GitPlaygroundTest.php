<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\UserGitPlaygroundProgress;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class GitPlaygroundTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_can_fetch_git_playground_progress(): void
    {
        $response = $this->getJson('/api/v1/git-playground/progress');

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.completed_scenarios', []);
    }

    public function test_unauthenticated_user_cannot_complete_scenario(): void
    {
        $response = $this->postJson('/api/v1/git-playground/scenarios/git-init-first-commit/complete');

        $response->assertStatus(401);
    }

    public function test_authenticated_user_can_complete_scenario_and_earn_xp(): void
    {
        $user = User::factory()->create(['xp' => 50]);
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/v1/git-playground/scenarios/git-init-first-commit/complete', [
            'commands_count' => 4,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.is_first_completion', true)
            ->assertJsonPath('data.xp_awarded', 25)
            ->assertJsonPath('data.user_xp', 75);

        $this->assertEquals(75, $user->fresh()->xp);
        $this->assertDatabaseHas('user_git_playground_progress', [
            'user_id' => $user->id,
            'scenario_id' => 'git-init-first-commit',
            'is_completed' => 1,
            'reward_claimed' => 1,
            'commands_count' => 4,
        ]);
    }

    public function test_duplicate_completion_does_not_award_extra_xp(): void
    {
        $user = User::factory()->create(['xp' => 100]);
        Sanctum::actingAs($user);

        // First completion
        $this->postJson('/api/v1/git-playground/scenarios/git-branching-basics/complete', [
            'commands_count' => 3,
        ]);
        $this->assertEquals(125, $user->fresh()->xp);

        // Second completion of same scenario
        $res2 = $this->postJson('/api/v1/git-playground/scenarios/git-branching-basics/complete', [
            'commands_count' => 2,
        ]);

        $res2->assertStatus(200)
            ->assertJsonPath('data.is_first_completion', false)
            ->assertJsonPath('data.xp_awarded', 0)
            ->assertJsonPath('data.user_xp', 125);

        $this->assertEquals(125, $user->fresh()->xp);

        // Commands count should have accumulated
        $this->assertEquals(5, UserGitPlaygroundProgress::where('user_id', $user->id)->first()->commands_count);
    }
}
