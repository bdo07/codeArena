<?php

namespace Tests\Feature;

use App\Models\Challenge;
use App\Models\Language;
use App\Models\Tag;
use App\Models\User;
use App\Models\UserChallengeProgress;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SearchTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed sample test data
        $admin = User::factory()->create(['role' => 'admin']);

        // Challenges
        $tagDp = Tag::create(['name' => 'Dynamic Programming', 'slug' => 'dynamic-programming']);
        $tagGraphs = Tag::create(['name' => 'Graphs', 'slug' => 'graphs']);

        $c1 = Challenge::create([
            'title' => 'Coin Change Optimization',
            'slug' => 'coin-change-opt',
            'description' => 'Find the minimum coins needed using dynamic programming.',
            'difficulty' => 'Medium',
            'category' => 'Algorithms',
            'challenge_type' => 'code',
            'xp_reward' => 120,
            'is_published' => true,
        ]);
        $c1->tags()->attach($tagDp->id);

        $c2 = Challenge::create([
            'title' => 'Graph Cycle Detection',
            'slug' => 'graph-cycle-detect',
            'description' => 'Detect if a cycle exists in directed graph.',
            'difficulty' => 'Hard',
            'category' => 'Data Structures',
            'challenge_type' => 'code',
            'xp_reward' => 200,
            'is_published' => true,
        ]);
        $c2->tags()->attach($tagGraphs->id);

        // Languages
        Language::create([
            'name' => 'Python 3',
            'slug' => 'python',
            'category' => 'Backend',
            'monaco_language' => 'python',
            'is_executable' => true,
            'position' => 1,
            'description' => 'Popular programming language.',
        ]);

        Language::create([
            'name' => 'Rust',
            'slug' => 'rust',
            'category' => 'Systems',
            'monaco_language' => 'rust',
            'is_executable' => true,
            'position' => 2,
            'description' => 'Memory safe systems language.',
        ]);

        // Users
        User::factory()->create([
            'name' => 'Alice Algorithm',
            'username' => 'alice_coder',
            'tagline' => 'Graph theory enthusiast',
            'is_activity_public' => true,
            'status' => 'active',
            'xp' => 500,
        ]);

        User::factory()->create([
            'name' => 'Private Bob',
            'username' => 'private_bob',
            'tagline' => 'Secret programmer',
            'is_activity_public' => false,
            'status' => 'active',
            'xp' => 400,
        ]);

        User::factory()->create([
            'name' => 'Banned User',
            'username' => 'banned_user',
            'is_activity_public' => true,
            'status' => 'banned',
            'xp' => 100,
        ]);
    }

    public function test_unified_search_returns_all_entity_matches(): void
    {
        $response = $this->getJson('/api/v1/search?q=graph');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'query',
                'type',
                'counts' => ['challenges', 'languages', 'topics', 'users', 'total'],
                'results' => ['challenges', 'languages', 'topics', 'users'],
            ]);

        // Challenge matched
        $this->assertTrue(collect($response->json('results.challenges'))->contains('slug', 'graph-cycle-detect'));

        // Topic matched
        $this->assertTrue(collect($response->json('results.topics'))->contains('slug', 'graphs'));

        // Public user matched
        $this->assertTrue(collect($response->json('results.users'))->contains('username', 'alice_coder'));

        // Private and banned users are NOT returned
        $this->assertFalse(collect($response->json('results.users'))->contains('username', 'private_bob'));
        $this->assertFalse(collect($response->json('results.users'))->contains('username', 'banned_user'));
    }

    public function test_filter_by_type_challenges(): void
    {
        $response = $this->getJson('/api/v1/search?type=challenges&difficulty=Medium');

        $response->assertStatus(200)
            ->assertJsonPath('results.challenges.data.0.slug', 'coin-change-opt')
            ->assertJsonCount(1, 'results.challenges.data');
    }

    public function test_filter_by_type_languages(): void
    {
        $response = $this->getJson('/api/v1/search?type=languages&q=python');

        $response->assertStatus(200)
            ->assertJsonPath('results.languages.data.0.slug', 'python')
            ->assertJsonCount(1, 'results.languages.data');
    }

    public function test_filter_by_completion_status_for_authenticated_user(): void
    {
        $user = User::factory()->create();
        $challenge = Challenge::where('slug', 'coin-change-opt')->first();

        // Mark as solved
        UserChallengeProgress::create([
            'user_id' => $user->id,
            'challenge_id' => $challenge->id,
            'status' => 'solved',
            'solved_at' => now(),
        ]);

        // Search solved
        $resSolved = $this->actingAs($user, 'sanctum')->getJson('/api/v1/search?type=challenges&status=solved');
        $resSolved->assertStatus(200)
            ->assertJsonPath('results.challenges.data.0.slug', 'coin-change-opt');

        // Search unsolved
        $resUnsolved = $this->actingAs($user, 'sanctum')->getJson('/api/v1/search?type=challenges&status=unsolved');
        $resUnsolved->assertStatus(200)
            ->assertJsonPath('results.challenges.data.0.slug', 'graph-cycle-detect');
    }

    public function test_suggestions_endpoint_returns_fast_results(): void
    {
        $response = $this->getJson('/api/v1/search/suggestions?q=coin');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'query',
                'challenges',
                'languages',
                'topics',
                'users',
            ])
            ->assertJsonCount(1, 'challenges');
    }

    public function test_search_validates_input_parameters(): void
    {
        // Invalid difficulty
        $res = $this->getJson('/api/v1/search?difficulty=SuperImpossible');
        $res->assertStatus(422)
            ->assertJsonValidationErrors(['difficulty']);

        // Invalid type
        $res2 = $this->getJson('/api/v1/search?type=invalid_type');
        $res2->assertStatus(422)
            ->assertJsonValidationErrors(['type']);
    }
}
