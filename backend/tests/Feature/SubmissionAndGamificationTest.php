<?php

namespace Tests\Feature;

use App\Models\Badge;
use App\Models\Challenge;
use App\Models\Submission;
use App\Models\TestCase as ChallengeTestCase;
use App\Models\User;
use App\Models\UserChallengeProgress;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SubmissionAndGamificationTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected Challenge $challenge;

    protected function setUp(): void
    {
        parent::setUp();

        Badge::create([
            'name' => 'First Solve',
            'slug' => 'first-solve',
            'description' => 'First solve badge',
            'icon' => 'Award',
            'rule_key' => 'first_solve',
        ]);

        $this->user = User::factory()->create([
            'username' => 'test_coder',
            'xp' => 0,
        ]);

        $this->challenge = Challenge::create([
            'slug' => 'two-sum',
            'title' => 'Two Sum',
            'description' => 'Two sum description',
            'difficulty' => 'Easy',
            'time_limit_ms' => 2000,
            'memory_limit_mb' => 128,
            'is_published' => true,
        ]);

        ChallengeTestCase::create([
            'challenge_id' => $this->challenge->id,
            'input_data' => "2,7,11,15\n9",
            'expected_output' => '0,1',
            'is_sample' => true,
            'points' => 50,
            'position' => 1,
        ]);

        ChallengeTestCase::create([
            'challenge_id' => $this->challenge->id,
            'input_data' => "3,3\n6",
            'expected_output' => '0,1',
            'is_sample' => false,
            'points' => 50,
            'position' => 2,
        ]);
    }

    public function test_submitting_requires_authentication(): void
    {
        $response = $this->postJson("/api/v1/challenges/{$this->challenge->id}/submit", [
            'language' => 'python',
            'source_code' => 'def two_sum(): pass',
        ]);

        $response->assertStatus(401);
    }

    public function test_successful_first_solve_awards_xp_and_badge(): void
    {
        $validTwoSumCode = "import sys\ndef two_sum(nums, target):\n    lookup = {}\n    for i, num in enumerate(nums):\n        diff = target - num\n        if diff in lookup:\n            return f'{lookup[diff]},{i}'\n        lookup[num] = i\n    return ''\n";

        $response = $this->actingAs($this->user, 'sanctum')->postJson("/api/v1/challenges/{$this->challenge->id}/submit", [
            'language' => 'python',
            'source_code' => $validTwoSumCode,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('submission.status', 'Accepted')
            ->assertJsonPath('gamification.is_first_solve', true)
            ->assertJsonPath('gamification.xp_awarded', 50);

        $this->user->refresh();
        $this->assertEquals(50, $this->user->xp);

        // Check progress record
        $this->assertDatabaseHas('user_challenge_progress', [
            'user_id' => $this->user->id,
            'challenge_id' => $this->challenge->id,
            'best_score' => 100,
        ]);

        // Check badge awarded
        $this->assertTrue($this->user->badges()->where('slug', 'first-solve')->exists());
    }

    public function test_repeated_solve_does_not_award_duplicate_xp(): void
    {
        // First solve
        UserChallengeProgress::create([
            'user_id' => $this->user->id,
            'challenge_id' => $this->challenge->id,
            'best_score' => 100,
            'attempts_count' => 1,
            'solved_at' => now(),
        ]);
        $this->user->update(['xp' => 50]);

        $validTwoSumCode = "def two_sum(nums, target):\n    lookup = {}\n    for i, num in enumerate(nums):\n        diff = target - num\n        if diff in lookup:\n            return f'{lookup[diff]},{i}'\n        lookup[num] = i\n    return ''\n";

        $response = $this->actingAs($this->user, 'sanctum')->postJson("/api/v1/challenges/{$this->challenge->id}/submit", [
            'language' => 'python',
            'source_code' => $validTwoSumCode,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('gamification.is_first_solve', false)
            ->assertJsonPath('gamification.xp_awarded', 0);

        $this->user->refresh();
        $this->assertEquals(50, $this->user->xp); // XP stays at 50, no duplication
    }

    public function test_user_cannot_view_another_users_submission(): void
    {
        $otherUser = User::factory()->create();

        $submission = Submission::create([
            'user_id' => $otherUser->id,
            'challenge_id' => $this->challenge->id,
            'language' => 'python',
            'source_code' => 'private code',
            'status' => 'Accepted',
        ]);

        $response = $this->actingAs($this->user, 'sanctum')->getJson("/api/v1/submissions/{$submission->id}");

        $response->assertStatus(403);
    }
}
