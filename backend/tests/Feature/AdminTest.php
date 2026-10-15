<?php

namespace Tests\Feature;

use App\Models\Challenge;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminTest extends TestCase
{
    use RefreshDatabase;

    public function test_regular_user_cannot_access_admin_endpoints(): void
    {
        $regularUser = User::factory()->create(['role' => 'user']);

        $response = $this->actingAs($regularUser, 'sanctum')->getJson('/api/v1/admin/challenges');

        $response->assertStatus(403);
    }

    public function test_admin_can_create_challenge_with_test_cases(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $payload = [
            'title' => 'Admin Challenge',
            'slug' => 'admin-challenge',
            'description' => 'Detailed problem description here.',
            'difficulty' => 'Medium',
            'time_limit_ms' => 2000,
            'memory_limit_mb' => 128,
            'is_published' => true,
            'tags' => ['Dynamic Programming', 'Math'],
            'test_cases' => [
                [
                    'input_data' => '10',
                    'expected_output' => '20',
                    'is_sample' => true,
                    'points' => 30,
                ],
                [
                    'input_data' => '100',
                    'expected_output' => '200',
                    'is_sample' => false,
                    'points' => 70,
                ],
            ],
        ];

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/challenges', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('challenge.slug', 'admin-challenge')
            ->assertJsonCount(2, 'challenge.test_cases');

        $this->assertDatabaseHas('challenges', ['slug' => 'admin-challenge']);
    }

    public function test_admin_can_delete_challenge(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $challenge = Challenge::create([
            'title' => 'To Delete',
            'slug' => 'to-delete',
            'description' => 'Desc',
            'difficulty' => 'Easy',
            'time_limit_ms' => 1000,
            'memory_limit_mb' => 128,
            'is_published' => true,
        ]);

        $response = $this->actingAs($admin, 'sanctum')->deleteJson("/api/v1/admin/challenges/{$challenge->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('challenges', ['id' => $challenge->id]);
    }
}
