<?php

namespace Database\Seeders;

use App\Models\Challenge;
use App\Models\Contest;
use App\Models\ContestParticipant;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class ContestSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('role', 'admin')->first() ?? User::first();
        $users = User::where('role', '!=', 'admin')->get();

        $contestsData = [
            [
                'slug' => 'codearena-weekly-contest-1',
                'title' => 'CodeArena Weekly Contest #1',
                'description' => 'Weekly competitive programming round featuring 4 algorithmic problems of varying difficulty. Compete for rating and leaderboard glory!',
                'start_time' => Carbon::now()->subHours(2),
                'end_time' => Carbon::now()->addHours(22),
                'status' => 'active',
                'banner_color' => 'indigo',
                'challenges' => [
                    ['slug' => 'two-sum', 'points' => 100, 'position' => 1],
                    ['slug' => 'contains-duplicate', 'points' => 100, 'position' => 2],
                    ['slug' => 'product-of-array-except-self', 'points' => 200, 'position' => 3],
                    ['slug' => '3sum', 'points' => 300, 'position' => 4],
                ],
            ],
            [
                'slug' => 'codearena-biweekly-contest-2',
                'title' => 'CodeArena Bi-Weekly Cup #2',
                'description' => 'High-stakes algorithmic challenge with problems spanning graphs, sliding window, and dynamic programming.',
                'start_time' => Carbon::now()->addDays(2)->setHour(14)->setMinute(0),
                'end_time' => Carbon::now()->addDays(2)->setHour(16)->setMinute(30),
                'status' => 'upcoming',
                'banner_color' => 'emerald',
                'challenges' => [
                    ['slug' => 'valid-anagram', 'points' => 100, 'position' => 1],
                    ['slug' => 'longest-substring-without-repeating-characters', 'points' => 250, 'position' => 2],
                    ['slug' => 'coin-change', 'points' => 350, 'position' => 3],
                    ['slug' => 'trapping-rain-water', 'points' => 500, 'position' => 4],
                ],
            ],
            [
                'slug' => 'codearena-sql-sprint-cup',
                'title' => 'CodeArena SQL Sprint Championship',
                'description' => 'Specialized database contest testing complex queries, JOIN performance, subqueries, and window functions.',
                'start_time' => Carbon::now()->subDays(5),
                'end_time' => Carbon::now()->subDays(4),
                'status' => 'finished',
                'banner_color' => 'amber',
                'challenges' => [
                    ['slug' => 'sql-big-countries', 'points' => 100, 'position' => 1],
                    ['slug' => 'sql-duplicate-emails', 'points' => 150, 'position' => 2],
                    ['slug' => 'sql-second-highest-salary', 'points' => 250, 'position' => 3],
                    ['slug' => 'sql-department-top-three-salaries', 'points' => 400, 'position' => 4],
                ],
            ],
        ];

        foreach ($contestsData as $c) {
            $challenges = $c['challenges'];
            unset($c['challenges']);

            $contest = Contest::updateOrCreate(
                ['slug' => $c['slug']],
                array_merge($c, ['created_by' => $admin?->id])
            );

            // Attach challenges
            $syncChallenges = [];
            foreach ($challenges as $item) {
                $challenge = Challenge::where('slug', $item['slug'])->first();
                if ($challenge) {
                    $syncChallenges[$challenge->id] = [
                        'points' => $item['points'],
                        'position' => $item['position'],
                    ];
                }
            }
            $contest->challenges()->sync($syncChallenges);

            // Register users and seed standings for active and finished contests
            if (in_array($c['status'], ['active', 'finished']) && $users->isNotEmpty()) {
                $scores = [700, 400, 300, 100];
                foreach ($users as $idx => $user) {
                    $score = $scores[$idx % count($scores)];
                    ContestParticipant::updateOrCreate(
                        [
                            'contest_id' => $contest->id,
                            'user_id' => $user->id,
                        ],
                        [
                            'score' => $score,
                            'finish_time_ms' => ($idx + 1) * 3600000 + rand(1000, 99999),
                            'rank' => $idx + 1,
                            'registered_at' => Carbon::now()->subDays(1),
                        ]
                    );
                }
            }
        }
    }
}
