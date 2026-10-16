<?php

namespace Tests\Feature;

use App\Models\Badge;
use App\Models\Challenge;
use App\Models\QuestPath;
use App\Models\QuestStage;
use App\Models\User;
use App\Models\UserChallengeProgress;
use App\Models\UserDailyMissionProgress;
use App\Models\UserQuestProgress;
use Database\Seeders\QuestSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class QuestTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Seed badges and minimal challenges if not present
        $this->seedChallengesAndQuests();
    }

    protected function seedChallengesAndQuests(): void
    {
        // Seed default badges
        Badge::firstOrCreate(['slug' => 'first-solve'], [
            'name' => 'First Solve',
            'description' => 'First solve',
            'icon' => 'Award',
            'rule_key' => 'first_solve',
        ]);

        // Create sample challenges mapped in QuestSeeder
        $slugs = [
            'web-responsive-pricing-card',
            'web-interactive-dark-mode-toggle',
            'web-accordion-faq',
            'web-stopwatch-timer',
            'reverse-string',
            'valid-parentheses',
            'two-sum',
            'valid-anagram',
            'quiz-http-status-codes',
            'quiz-solid-principles',
            'quiz-unit-testing-fundamentals',
            'software-architecture-design-patterns-quiz',
            'sql-big-countries',
            'sql-customers-who-never-order',
            'sql-employees-earning-more-than-managers',
            'sql-duplicate-emails',
            'sql-classes-more-than-5-students',
            'quiz-database-indexing-acid',
            'sql-swap-salary',
            'sql-second-highest-salary',
            'sql-consecutive-available-seats',
            'sql-department-top-three-salaries',
            'contains-duplicate',
            'move-zeroes',
            'binary-search',
            'sort-colors',
            'valid-palindrome',
            'middle-of-linked-list',
            'merge-two-sorted-lists',
            'invert-binary-tree',
            'climbing-stairs',
            'coin-change',
            'trapping-rain-water',
            'quiz-git-fundamentals',
            'linux-bash-command-line-quiz',
            'quiz-linux-permissions-processes',
            'docker-fundamentals-quiz',
            'quiz-docker-devops',
        ];

        foreach ($slugs as $slug) {
            Challenge::firstOrCreate(
                ['slug' => $slug],
                [
                    'title' => ucwords(str_replace('-', ' ', $slug)),
                    'description' => 'Test challenge description',
                    'difficulty' => 'Easy',
                    'category' => 'algorithms',
                    'starter_code' => ['python' => 'def solve(): pass'],
                    'solution_template' => ['python' => 'def solve(): pass'],
                    'hints' => ['Hint 1'],
                    'order' => 1,
                    'is_published' => true,
                ]
            );
        }

        $this->seed(QuestSeeder::class);
    }

    public function test_guest_can_list_quest_paths(): void
    {
        $response = $this->getJson('/api/v1/quests');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'data' => [
                    'paths' => [
                        '*' => [
                            'id',
                            'slug',
                            'title',
                            'description',
                            'category',
                            'difficulty',
                            'total_stages',
                            'completed_stages',
                            'progress_percentage',
                        ],
                    ],
                    'daily_missions',
                ],
            ]);

        $this->assertCount(5, $response->json('data.paths'));
    }

    public function test_guest_can_view_path_detail_with_locked_status(): void
    {
        $response = $this->getJson('/api/v1/quests/frontend-developer');

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.slug', 'frontend-developer');

        $stages = $response->json('data.stages');
        $this->assertCount(4, $stages);

        // Guest sees stage 1 as available, subsequent as locked
        $this->assertEquals('available', $stages[0]['status']);
        $this->assertEquals('locked', $stages[1]['status']);
        $this->assertEquals('locked', $stages[2]['status']);
        $this->assertEquals('locked', $stages[3]['status']);
    }

    public function test_authenticated_user_sees_dynamic_progress(): void
    {
        $user = User::factory()->create(['xp' => 100]);
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/quests');
        $response->assertStatus(200);

        $dailyMissions = $response->json('data.daily_missions');
        $this->assertCount(3, $dailyMissions);
        $this->assertFalse($dailyMissions[0]['reward_claimed']);
    }

    public function test_user_cannot_claim_stage_reward_if_challenges_not_solved(): void
    {
        $user = User::factory()->create(['xp' => 100]);
        Sanctum::actingAs($user);

        $stage = QuestStage::where('slug', 'frontend-ui-foundations')->firstOrFail();

        $response = $this->postJson("/api/v1/quests/stages/{$stage->id}/claim");
        $response->assertStatus(422)
            ->assertJson([
                'message' => 'All challenges in this stage must be solved to claim the reward.',
            ]);
    }

    public function test_user_cannot_claim_stage_reward_if_prerequisite_not_met(): void
    {
        $user = User::factory()->create(['xp' => 100]);
        Sanctum::actingAs($user);

        // Stage 2 requires Stage 1
        $stage2 = QuestStage::where('slug', 'frontend-dom-components')->firstOrFail();

        // Mark stage 2 challenges as solved, but NOT stage 1
        foreach ($stage2->challenges as $ch) {
            UserChallengeProgress::create([
                'user_id' => $user->id,
                'challenge_id' => $ch->id,
                'solved_at' => now(),
                'best_score' => 100,
            ]);
        }

        $response = $this->postJson("/api/v1/quests/stages/{$stage2->id}/claim");
        $response->assertStatus(422)
            ->assertJson([
                'message' => 'Prerequisite stage must be completed before claiming this stage reward.',
            ]);
    }

    public function test_user_can_claim_stage_reward_when_valid_and_prevents_duplicate(): void
    {
        $user = User::factory()->create(['xp' => 100]);
        Sanctum::actingAs($user);

        $stage1 = QuestStage::where('slug', 'frontend-ui-foundations')->firstOrFail();

        // Solve all challenges in stage 1
        foreach ($stage1->challenges as $ch) {
            UserChallengeProgress::create([
                'user_id' => $user->id,
                'challenge_id' => $ch->id,
                'solved_at' => now(),
                'best_score' => 100,
            ]);
        }

        // Claim reward
        $response = $this->postJson("/api/v1/quests/stages/{$stage1->id}/claim");
        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.stage_xp_awarded', 50)
            ->assertJsonPath('data.user_xp', 150);

        $this->assertEquals(150, $user->fresh()->xp);

        // Attempt duplicate claim
        $dupResponse = $this->postJson("/api/v1/quests/stages/{$stage1->id}/claim");
        $dupResponse->assertStatus(422)
            ->assertJson([
                'message' => 'Reward for this stage has already been claimed.',
            ]);

        // XP should not have increased again
        $this->assertEquals(150, $user->fresh()->xp);
    }

    public function test_claim_daily_mission_reward(): void
    {
        $user = User::factory()->create(['xp' => 50]);
        Sanctum::actingAs($user);

        // Fetch daily missions to initialize
        $indexResponse = $this->getJson('/api/v1/quests');
        $mission = $indexResponse->json('data.daily_missions.0');
        $missionId = $mission['id'];

        // Initially not completed
        $claimFail = $this->postJson("/api/v1/quests/daily-missions/{$missionId}/claim");
        $claimFail->assertStatus(422);

        // Complete the mission in DB
        UserDailyMissionProgress::where('id', $missionId)->update([
            'current_count' => 1,
            'is_completed' => true,
        ]);

        // Now claim should succeed
        $claimSuccess = $this->postJson("/api/v1/quests/daily-missions/{$missionId}/claim");
        $claimSuccess->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.xp_awarded', 30);

        $this->assertEquals(80, $user->fresh()->xp);

        // Duplicate claim fails
        $dupClaim = $this->postJson("/api/v1/quests/daily-missions/{$missionId}/claim");
        $dupClaim->assertStatus(422);
    }

    public function test_progression_returns_deterministic_next_recommended_challenge(): void
    {
        $user = User::factory()->create(['xp' => 200]);
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/quests/progression');
        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'data' => [
                    'total_paths',
                    'completed_paths',
                    'total_stages',
                    'completed_stages',
                    'skills_practiced',
                    'next_recommended_challenge' => [
                        'id',
                        'title',
                        'slug',
                        'category',
                        'difficulty',
                        'reason',
                    ],
                ],
            ]);

        $recommendation = $response->json('data.next_recommended_challenge');
        $this->assertNotNull($recommendation);
        // Stage 1 first challenge in frontend-developer is web-responsive-pricing-card
        $this->assertEquals('web-responsive-pricing-card', $recommendation['slug']);
    }

    public function test_quest_seeder_is_idempotent(): void
    {
        $initialPaths = QuestPath::count();
        $initialStages = QuestStage::count();

        // Run seeder second time
        $this->seed(QuestSeeder::class);

        $this->assertEquals($initialPaths, QuestPath::count());
        $this->assertEquals($initialStages, QuestStage::count());
    }
}
