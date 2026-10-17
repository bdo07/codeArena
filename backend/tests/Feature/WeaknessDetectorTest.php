<?php

namespace Tests\Feature;

use App\Models\Challenge;
use App\Models\Submission;
use App\Models\Tag;
use App\Models\User;
use App\Models\UserChallengeProgress;
use App\Services\WeaknessDetectorService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WeaknessDetectorTest extends TestCase
{
    use RefreshDatabase;

    public function test_new_user_receives_onboarding_state(): void
    {
        $user = User::factory()->create();

        // 1 sample starter challenge
        Challenge::create([
            'title' => 'Two Sum',
            'slug' => 'two-sum',
            'description' => 'Find two numbers that add up to target.',
            'difficulty' => 'Easy',
            'category' => 'Algorithms',
            'challenge_type' => 'code',
            'xp_reward' => 50,
            'is_published' => true,
        ]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/insights/weaknesses');

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.is_onboarding', true)
            ->assertJsonPath('data.onboarding.current_submissions', 0)
            ->assertJsonPath('data.onboarding.required_submissions', 3)
            ->assertJsonPath('data.onboarding.progress_percentage', 0);

        $this->assertNotEmpty($response->json('data.recommendations'));
    }

    public function test_distinguishes_insufficient_data_from_verified_weakness(): void
    {
        $user = User::factory()->create();

        $tagDp = Tag::create(['name' => 'Dynamic Programming', 'slug' => 'dynamic-programming']);
        $tagGraphs = Tag::create(['name' => 'Graphs', 'slug' => 'graphs']);

        // Challenge 1: DP
        $chDp = Challenge::create([
            'title' => 'Climbing Stairs',
            'slug' => 'climbing-stairs',
            'description' => 'DP problem',
            'difficulty' => 'Easy',
            'category' => 'Algorithms',
            'challenge_type' => 'code',
            'xp_reward' => 50,
            'is_published' => true,
        ]);
        $chDp->tags()->attach($tagDp->id);

        // Challenge 2: Graphs
        $chGraph = Challenge::create([
            'title' => 'Graph BFS',
            'slug' => 'graph-bfs',
            'description' => 'Graph problem',
            'difficulty' => 'Medium',
            'category' => 'Data Structures',
            'challenge_type' => 'code',
            'xp_reward' => 100,
            'is_published' => true,
        ]);
        $chGraph->tags()->attach($tagGraphs->id);

        // User makes 3 submissions on DP: 3 Wrong Answers (Verified Weakness)
        for ($i = 0; $i < 3; $i++) {
            Submission::create([
                'user_id' => $user->id,
                'challenge_id' => $chDp->id,
                'language' => 'python',
                'source_code' => 'print(1)',
                'status' => Submission::STATUS_WRONG_ANSWER,
                'score' => 0,
                'submitted_at' => Carbon::now()->subMinutes(10 - $i),
            ]);
        }
        UserChallengeProgress::create([
            'user_id' => $user->id,
            'challenge_id' => $chDp->id,
            'attempts_count' => 3,
            'best_score' => 0,
            'solved_at' => null,
        ]);

        // User makes only 1 submission on Graphs: 1 Wrong Answer (< 3 attempts = Insufficient Data)
        Submission::create([
            'user_id' => $user->id,
            'challenge_id' => $chGraph->id,
            'language' => 'python',
            'source_code' => 'print(2)',
            'status' => Submission::STATUS_WRONG_ANSWER,
            'score' => 0,
            'submitted_at' => Carbon::now(),
        ]);
        UserChallengeProgress::create([
            'user_id' => $user->id,
            'challenge_id' => $chGraph->id,
            'attempts_count' => 1,
            'best_score' => 0,
            'solved_at' => null,
        ]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/insights/weaknesses');

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.is_onboarding', false);

        // DP is classified as a verified weakness
        $weaknessNames = collect($response->json('data.weaknesses'))->pluck('name');
        $this->assertTrue($weaknessNames->contains('Dynamic Programming'));

        // Graphs has only 1 attempt, so tag "Graphs" must be in insufficient_data, NOT in weaknesses
        $insufficientNames = collect($response->json('data.insufficient_data'))->pluck('name');
        $this->assertTrue($insufficientNames->contains('Graphs'));
        $this->assertFalse($weaknessNames->contains('Graphs'));
    }

    public function test_calculates_strengths_for_high_pass_rate_topics(): void
    {
        $user = User::factory()->create();

        $tagMath = Tag::create(['name' => 'Math', 'slug' => 'math']);

        $chMath = Challenge::create([
            'title' => 'Prime Sieve',
            'slug' => 'prime-sieve',
            'description' => 'Math primes',
            'difficulty' => 'Easy',
            'category' => 'Math',
            'challenge_type' => 'code',
            'xp_reward' => 50,
            'is_published' => true,
        ]);
        $chMath->tags()->attach($tagMath->id);

        // 3 Accepted submissions
        for ($i = 0; $i < 3; $i++) {
            Submission::create([
                'user_id' => $user->id,
                'challenge_id' => $chMath->id,
                'language' => 'python',
                'source_code' => 'return True',
                'status' => Submission::STATUS_ACCEPTED,
                'score' => 100,
                'submitted_at' => Carbon::now()->subMinutes(5 - $i),
            ]);
        }
        UserChallengeProgress::create([
            'user_id' => $user->id,
            'challenge_id' => $chMath->id,
            'attempts_count' => 3,
            'best_score' => 100,
            'solved_at' => Carbon::now(),
        ]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/insights/weaknesses');

        $response->assertStatus(200);

        $strengthNames = collect($response->json('data.strengths'))->pluck('name');
        $this->assertTrue($strengthNames->contains('Math'));
    }

    public function test_recommendations_target_weakness_with_explainable_reason(): void
    {
        $user = User::factory()->create();

        $tagTrees = Tag::create(['name' => 'Binary Trees', 'slug' => 'binary-trees']);

        // Failed challenge
        $chTree1 = Challenge::create([
            'title' => 'Tree Traversal',
            'slug' => 'tree-traversal',
            'description' => 'Inorder traversal',
            'difficulty' => 'Medium',
            'category' => 'Data Structures',
            'challenge_type' => 'code',
            'xp_reward' => 100,
            'is_published' => true,
        ]);
        $chTree1->tags()->attach($tagTrees->id);

        // 3 TLE submissions on Tree 1
        for ($i = 0; $i < 3; $i++) {
            Submission::create([
                'user_id' => $user->id,
                'challenge_id' => $chTree1->id,
                'language' => 'python',
                'source_code' => 'while True: pass',
                'status' => Submission::STATUS_TIME_LIMIT_EXCEEDED,
                'score' => 0,
                'submitted_at' => Carbon::now()->subMinutes(10 - $i),
            ]);
        }
        UserChallengeProgress::create([
            'user_id' => $user->id,
            'challenge_id' => $chTree1->id,
            'attempts_count' => 3,
            'best_score' => 0,
            'solved_at' => null,
        ]);

        // Unsolved companion challenge in the same tag to recommend
        $chTree2 = Challenge::create([
            'title' => 'Maximum Depth of Binary Tree',
            'slug' => 'max-depth-tree',
            'description' => 'Find max depth',
            'difficulty' => 'Easy',
            'category' => 'Data Structures',
            'challenge_type' => 'code',
            'xp_reward' => 50,
            'is_published' => true,
        ]);
        $chTree2->tags()->attach($tagTrees->id);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/insights/weaknesses');

        $response->assertStatus(200);

        $recs = $response->json('data.recommendations');
        $this->assertNotEmpty($recs);

        // Should recommend the unsolved tree challenge
        $recSlugs = collect($recs)->pluck('challenge.slug');
        $this->assertTrue($recSlugs->contains('max-depth-tree'));

        // Reason should be explainable and mention topic / error
        $firstRec = collect($recs)->firstWhere('challenge.slug', 'max-depth-tree');
        $this->assertStringContainsString('Binary Trees', $firstRec['reason']);
        $this->assertStringContainsString('Time Limit Exceeded', $firstRec['reason']);
    }

    public function test_authorization_prevents_unauthorized_inspection(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $admin = User::factory()->create(['role' => 'admin']);

        // Unauthenticated access fails
        $this->getJson('/api/v1/insights/weaknesses')->assertStatus(401);

        // Regular user cannot view user2's insights
        $this->actingAs($user1, 'sanctum')
            ->getJson("/api/v1/insights/weaknesses?user_id={$user2->id}")
            ->assertStatus(403);

        // Admin can inspect user2's insights
        $this->actingAs($admin, 'sanctum')
            ->getJson("/api/v1/insights/weaknesses?user_id={$user2->id}")
            ->assertStatus(200);
    }
}
