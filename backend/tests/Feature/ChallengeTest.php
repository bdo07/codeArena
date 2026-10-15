<?php

namespace Tests\Feature;

use App\Models\Challenge;
use App\Models\Tag;
use App\Models\TestCase as ChallengeTestCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ChallengeTest extends TestCase
{
    use RefreshDatabase;

    protected Challenge $challenge;

    protected function setUp(): void
    {
        parent::setUp();

        $admin = User::factory()->create(['role' => 'admin']);

        $this->challenge = Challenge::create([
            'slug' => 'test-problem',
            'title' => 'Test Problem',
            'description' => 'Test Description',
            'input_description' => 'Input test',
            'output_description' => 'Output test',
            'constraints' => 'None',
            'difficulty' => 'Easy',
            'starter_code' => ['python' => 'print("hello")'],
            'time_limit_ms' => 2000,
            'memory_limit_mb' => 128,
            'is_published' => true,
            'created_by' => $admin->id,
        ]);

        $tag = Tag::create(['name' => 'Algorithms', 'slug' => 'algorithms']);
        $this->challenge->tags()->attach($tag->id);

        // Public sample test case
        ChallengeTestCase::create([
            'challenge_id' => $this->challenge->id,
            'input_data' => 'sample_in',
            'expected_output' => 'sample_out',
            'is_sample' => true,
            'points' => 10,
            'position' => 1,
        ]);

        // Private hidden test case
        ChallengeTestCase::create([
            'challenge_id' => $this->challenge->id,
            'input_data' => 'super_secret_hidden_input_9999',
            'expected_output' => 'secret_out',
            'is_sample' => false,
            'points' => 20,
            'position' => 2,
        ]);
    }

    public function test_can_list_published_challenges(): void
    {
        $response = $this->getJson('/api/v1/challenges');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'slug', 'title', 'difficulty', 'tags', 'sample_test_cases', 'total_test_cases_count'],
                ],
                'meta',
            ])
            ->assertJsonPath('data.0.slug', 'test-problem');
    }

    public function test_hidden_test_cases_are_never_exposed_in_public_endpoints(): void
    {
        $response = $this->getJson("/api/v1/challenges/{$this->challenge->slug}");

        $response->assertStatus(200);

        $content = $response->getContent();

        // Must NOT contain hidden test case input
        $this->assertStringNotContainsString('super_secret_hidden_input_9999', $content);
        $this->assertStringNotContainsString('secret_out', $content);

        // Must contain sample test case input
        $this->assertStringContainsString('sample_in', $content);
        $this->assertStringContainsString('sample_out', $content);
    }

    public function test_can_run_code_against_samples(): void
    {
        $response = $this->postJson("/api/v1/challenges/{$this->challenge->id}/run", [
            'language' => 'python',
            'source_code' => "def solve():\n    return 'sample_out'\n",
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'passed',
                'test_results',
                'total_execution_time_ms',
                'max_memory_kb',
                'is_demo_mode',
            ]);
    }
}
