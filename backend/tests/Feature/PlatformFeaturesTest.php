<?php

namespace Tests\Feature;

use App\Models\Challenge;
use App\Models\Collection;
use App\Models\Language;
use App\Models\Roadmap;
use App\Models\User;
use App\Services\ChallengeImportExportService;
use App\Services\SqlExecutionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PlatformFeaturesTest extends TestCase
{
    use RefreshDatabase;
    /**
     * Test SQL isolated execution service.
     */
    public function test_sql_execution_service_runs_and_evaluates_query(): void
    {
        $service = app(SqlExecutionService::class);
        $schema = "CREATE TABLE Users (id INT, name VARCHAR(20));";
        $seed = "INSERT INTO Users VALUES (1, 'Alice'), (2, 'Bob');";

        // Correct query
        $userQuery = "SELECT name FROM Users WHERE id = 1;";
        $refQuery = "SELECT name FROM Users WHERE id = 1;";
        $res = $service->execute($schema, $seed, $userQuery, $refQuery);

        $this->assertTrue($res['success']);
        $this->assertTrue($res['passed']);
        $this->assertEquals(['Alice'], array_column($res['user_result']['rows'], 'name'));

        // Wrong query
        $wrongQuery = "SELECT name FROM Users WHERE id = 2;";
        $wrongRes = $service->execute($schema, $seed, $wrongQuery, $refQuery);
        $this->assertTrue($wrongRes['success']);
        $this->assertFalse($wrongRes['passed']);

        // Dangerous statement blocked
        $blockedQuery = "ATTACH DATABASE 'test.db' AS test;";
        $blockedRes = $service->execute($schema, $seed, $blockedQuery, $refQuery);
        $this->assertFalse($blockedRes['success']);
        $this->assertStringContainsString('Disallowed', $blockedRes['error']);
    }

    /**
     * Test Language Catalog API returns accurate evaluator type.
     */
    public function test_language_catalog_api_returns_evaluator_types(): void
    {
        $response = $this->getJson('/api/v1/languages');
        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['name', 'slug', 'category', 'evaluator_type', 'is_executable']
                ],
                'evaluator_status' => ['sqlite_sandbox', 'client_sandbox']
            ]);
    }

    /**
     * Test Challenge filter by category and difficulty.
     */
    public function test_challenge_filter_by_category_and_difficulty(): void
    {
        $response = $this->getJson('/api/v1/challenges?category=SQL&difficulty=Easy');
        $response->assertStatus(200)
            ->assertJsonStructure([
                'data',
                'meta' => ['category_counts', 'difficulty_counts', 'type_counts']
            ]);
    }

    /**
     * Test Daily Challenge endpoint.
     */
    public function test_daily_challenge_endpoint(): void
    {
        $response = $this->getJson('/api/v1/daily-challenge');
        $response->assertStatus(200)
            ->assertJsonStructure([
                'challenge',
                'is_completed_today',
                'streak' => ['current_streak', 'longest_streak']
            ]);
    }

    /**
     * Test Roadmap listing endpoint.
     */
    public function test_roadmaps_listing(): void
    {
        $response = $this->getJson('/api/v1/roadmaps');
        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'slug', 'title', 'difficulty', 'estimated_hours', 'modules_count']
                ]
            ]);
    }

    /**
     * Test Challenge import with duplicate detection.
     */
    public function test_challenge_import_detects_duplicates(): void
    {
        $service = app(ChallengeImportExportService::class);
        $payload = [
            [
                'title' => 'Unit Test Unique Challenge ' . uniqid(),
                'description' => 'A unique test problem description.',
                'difficulty' => 'Easy',
                'category' => 'algorithms',
            ]
        ];

        // First import should succeed
        $res1 = $service->importJson($payload, false);
        $this->assertEquals(1, $res1['imported']);

        // Second import of same challenge without overwrite should be detected as duplicate
        $res2 = $service->importJson($payload, false);
        $this->assertEquals(0, $res2['imported']);
        $this->assertEquals(1, $res2['skipped']);
        $this->assertStringContainsString('Duplicate', $res2['errors'][0]);
    }

    /**
     * Test Contests listing endpoint.
     */
    public function test_contests_listing(): void
    {
        $response = $this->getJson('/api/v1/contests');
        $response->assertStatus(200)
            ->assertJsonStructure([
                'live',
                'upcoming',
                'past'
            ]);
    }

    /**
     * Test Quiz submission endpoint returns evaluated score and explanations.
     */
    public function test_quiz_submission_evaluates_answers(): void
    {
        $user = User::factory()->create();
        $challenge = Challenge::create([
            'title' => 'Git Basics Quiz ' . uniqid(),
            'slug' => 'git-basics-quiz-' . uniqid(),
            'description' => 'Test your Git knowledge',
            'difficulty' => 'Beginner',
            'challenge_type' => 'quiz',
            'category' => 'Git',
            'quiz_data' => [
                [
                    'id' => 'q1',
                    'question' => 'Which command creates a new branch?',
                    'options' => ['git checkout -b', 'git init', 'git push', 'git pull'],
                    'correct_index' => 0,
                    'explanation' => 'git checkout -b creates and switches to a new branch.'
                ]
            ],
            'time_limit_ms' => 1000,
            'memory_limit_mb' => 64,
            'is_published' => true,
        ]);

        $response = $this->actingAs($user)->postJson("/api/v1/challenges/{$challenge->id}/quiz/submit", [
            'answers' => ['q1' => 0]
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'passed' => true,
                'correct_count' => 1,
                'total_questions' => 1,
                'score' => 100,
            ]);
    }

    /**
     * Test Quiz challenge show endpoint returns questions regardless of quiz_data format.
     */
    public function test_quiz_challenge_show_returns_questions_for_direct_array_format(): void
    {
        $challenge = Challenge::create([
            'title' => 'Docker Quiz Test ' . uniqid(),
            'slug' => 'docker-quiz-test-' . uniqid(),
            'description' => 'Test docker quiz questions',
            'difficulty' => 'Beginner',
            'challenge_type' => 'quiz',
            'category' => 'DevOps',
            'quiz_data' => [
                [
                    'id' => 'd1',
                    'question' => 'What is Docker?',
                    'options' => ['Container tool', 'Virtual Machine', 'Database'],
                    'correct_index' => 0,
                    'explanation' => 'Docker is a containerization platform.'
                ]
            ],
            'time_limit_ms' => 1000,
            'memory_limit_mb' => 64,
            'is_published' => true,
        ]);

        $response = $this->getJson("/api/v1/challenges/{$challenge->slug}");

        $response->assertStatus(200)
            ->assertJsonPath('challenge.quiz_data.questions.0.id', 'd1')
            ->assertJsonPath('challenge.quiz_data.questions.0.question', 'What is Docker?')
            ->assertJsonCount(1, 'challenge.quiz_data.questions');
    }

    /**
     * Test Quiz submission returns validation error if answers are missing.
     */
    public function test_quiz_submission_validation_fails_when_answers_missing(): void
    {
        $user = User::factory()->create();
        $challenge = Challenge::create([
            'title' => 'Docker Quiz Validation ' . uniqid(),
            'slug' => 'docker-quiz-val-' . uniqid(),
            'description' => 'Test docker validation',
            'difficulty' => 'Beginner',
            'challenge_type' => 'quiz',
            'category' => 'DevOps',
            'quiz_data' => [
                [
                    'id' => 'd1',
                    'question' => 'What is Docker?',
                    'options' => ['A', 'B'],
                    'correct_index' => 0,
                ]
            ],
            'time_limit_ms' => 1000,
            'memory_limit_mb' => 64,
            'is_published' => true,
        ]);

        $response = $this->actingAs($user)->postJson("/api/v1/challenges/{$challenge->id}/submit-quiz", [
            'answers' => []
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['answers']);
    }

    /**
     * Test Personal Notes and Bookmark toggling for authenticated user.
     */
    public function test_user_notes_and_bookmarks(): void
    {
        $user = User::factory()->create();
        $challenge = Challenge::create([
            'title' => 'Bookmark Test Challenge ' . uniqid(),
            'slug' => 'bookmark-test-' . uniqid(),
            'description' => 'Test description',
            'difficulty' => 'Easy',
            'category' => 'algorithms',
            'time_limit_ms' => 1000,
            'memory_limit_mb' => 128,
            'is_published' => true,
        ]);

        // Bookmark toggle
        $bmResponse = $this->actingAs($user)->postJson("/api/v1/challenges/{$challenge->id}/bookmark");
        $bmResponse->assertStatus(200)->assertJson(['bookmarked' => true]);

        // Unbookmark
        $bmResponse2 = $this->actingAs($user)->postJson("/api/v1/challenges/{$challenge->id}/bookmark");
        $bmResponse2->assertStatus(200)->assertJson(['bookmarked' => false]);

        // Save private note
        $noteResponse = $this->actingAs($user)->postJson("/api/v1/challenges/{$challenge->id}/note", [
            'content' => 'Remember to use a hash map for O(n) lookup time!'
        ]);
        $noteResponse->assertStatus(200)->assertJson(['content' => 'Remember to use a hash map for O(n) lookup time!']);
    }

    /**
     * Test Admin Analytics API for admin user.
     */
    public function test_admin_analytics_accessible_by_admin(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->getJson('/api/v1/admin/analytics');
        $response->assertStatus(200)
            ->assertJsonStructure([
                'overview' => ['total_users', 'total_challenges', 'total_submissions', 'acceptance_rate'],
                'status_breakdown',
                'category_breakdown',
                'difficulty_breakdown',
                'evaluator_health'
            ]);
    }

    /**
     * Test local execution engine for arbitrary problems like count-primes.
     */
    public function test_local_code_execution_for_count_primes(): void
    {
        $executor = app(\App\Services\CodeExecutionService::class);
        $code = "import sys\nn = int(sys.stdin.read().strip())\nif n <= 2: print(0); sys.exit()\nprimes = [True] * n\nprimes[0] = primes[1] = False\nfor p in range(2, int(n**0.5) + 1):\n    if primes[p]:\n        for m in range(p*p, n, p): primes[m] = False\nprint(sum(primes))\n";

        // Correct input 10 -> 4 primes (2, 3, 5, 7)
        $res = $executor->execute('python', $code, '10', '4');
        $this->assertEquals('Accepted', $res['status']);
        $this->assertTrue($res['passed']);
        $this->assertEquals('4', $res['stdout']);

        // Wrong output test
        $resWrong = $executor->execute('python', 'print(99)', '10', '4');
        $this->assertEquals('Wrong Answer', $resWrong['status']);
        $this->assertFalse($resWrong['passed']);

        // Timeout test
        $resTimeout = $executor->execute('python', 'while True: pass', '10', '4', 400);
        $this->assertEquals('Time Limit Exceeded', $resTimeout['status']);
        $this->assertFalse($resTimeout['passed']);
    }
}
