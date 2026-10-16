<?php

namespace Tests\Feature;

use App\Models\Challenge;
use App\Models\InterviewSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class InterviewTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed sample challenge
        Challenge::create([
            'slug' => 'two-sum-test',
            'title' => 'Two Sum Test',
            'description' => 'Find two numbers that add up to target',
            'difficulty' => 'Medium',
            'category' => 'algorithms',
            'starter_code' => ['python' => 'def twoSum(): pass'],
            'solution_template' => ['python' => 'def twoSum(): return [0, 1]'],
            'order' => 1,
            'is_published' => true,
        ]);
    }

    public function test_can_start_interview_session(): void
    {
        $response = $this->postJson('/api/v1/interviews/start', [
            'topic' => 'algorithms',
            'difficulty' => 'Medium',
            'duration_minutes' => 30,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'session_token',
                    'topic',
                    'difficulty',
                    'duration_minutes',
                    'started_at',
                    'expires_at',
                    'status',
                    'questions' => [
                        '*' => [
                            'id',
                            'position',
                            'title',
                            'description',
                            'question_type',
                        ],
                    ],
                ],
            ]);

        $this->assertEquals('algorithms', $response->json('data.topic'));
        $this->assertEquals('Medium', $response->json('data.difficulty'));

        // Ensure answers and solutions are hidden
        $firstQ = $response->json('data.questions.0');
        $this->assertArrayNotHasKey('reference_solution', $firstQ);
        $this->assertArrayNotHasKey('editorial', $firstQ);
    }

    public function test_can_save_draft_answer(): void
    {
        $startRes = $this->postJson('/api/v1/interviews/start', [
            'topic' => 'algorithms',
            'difficulty' => 'Medium',
            'duration_minutes' => 30,
        ]);

        $token = $startRes->json('data.session_token');
        $questionId = $startRes->json('data.questions.0.id');

        $saveRes = $this->postJson("/api/v1/interviews/{$token}/save-answer", [
            'question_id' => $questionId,
            'answer' => 'def twoSum(nums, target): return [0, 1]',
        ]);

        $saveRes->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('saved', true);
    }

    public function test_can_finish_interview_and_earn_xp(): void
    {
        $user = User::factory()->create(['xp' => 100]);
        Sanctum::actingAs($user);

        $startRes = $this->postJson('/api/v1/interviews/start', [
            'topic' => 'algorithms',
            'difficulty' => 'Medium',
            'duration_minutes' => 30,
        ]);

        $token = $startRes->json('data.session_token');
        $questions = $startRes->json('data.questions');

        // Prepare good answers
        $answers = [];
        foreach ($questions as $q) {
            if ($q['question_type'] === 'conceptual') {
                $answers[$q['id']] = 'Hash table lookup has average time complexity O(1) with low collision overhead. Binary search tree preserves ordering and range queries in O(log n + k) time.';
            } else {
                $answers[$q['id']] = 'def solveProblem(nums, target): return [0, 1] # substantive code solution';
            }
        }

        $finishRes = $this->postJson("/api/v1/interviews/{$token}/finish", [
            'answers' => $answers,
        ]);

        $finishRes->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonPath('data.passed', true);

        $this->assertGreaterThan(0, $finishRes->json('data.xp_awarded'));
        $this->assertGreaterThan(100, $user->fresh()->xp);

        // Reference solution is now revealed in completed report
        $this->assertArrayHasKey('reference_solution', $finishRes->json('data.questions.0'));
    }

    public function test_duplicate_finish_does_not_double_award_xp(): void
    {
        $user = User::factory()->create(['xp' => 100]);
        Sanctum::actingAs($user);

        $startRes = $this->postJson('/api/v1/interviews/start', [
            'topic' => 'algorithms',
            'difficulty' => 'Medium',
            'duration_minutes' => 30,
        ]);

        $token = $startRes->json('data.session_token');
        $questions = $startRes->json('data.questions');

        $answers = [];
        foreach ($questions as $q) {
            $answers[$q['id']] = 'Valid response for algorithm problem and hash table complexity analysis.';
        }

        $res1 = $this->postJson("/api/v1/interviews/{$token}/finish", ['answers' => $answers]);
        $xpAfterFirst = $user->fresh()->xp;

        // Second finish call
        $res2 = $this->postJson("/api/v1/interviews/{$token}/finish", ['answers' => $answers]);
        $res2->assertStatus(200);

        $this->assertEquals($xpAfterFirst, $user->fresh()->xp);
    }

    public function test_interview_history_requires_auth(): void
    {
        $guestRes = $this->getJson('/api/v1/interviews/history');
        $guestRes->assertStatus(401);

        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $authRes = $this->getJson('/api/v1/interviews/history');
        $authRes->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'data' => [
                    'total_completed',
                    'average_score',
                    'passed_count',
                    'sessions',
                ],
            ]);
    }
}
