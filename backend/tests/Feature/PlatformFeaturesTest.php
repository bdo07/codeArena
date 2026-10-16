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
                    '*' => ['id', 'name', 'slug', 'category', 'evaluator_type', 'is_executable']
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
}
