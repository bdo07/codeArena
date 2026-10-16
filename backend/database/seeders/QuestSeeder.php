<?php

namespace Database\Seeders;

use App\Models\Badge;
use App\Models\Challenge;
use App\Models\QuestPath;
use App\Models\QuestStage;
use App\Models\QuestStageChallenge;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class QuestSeeder extends Seeder
{
    /**
     * Run the database seeds idempotently.
     */
    public function run(): void
    {
        DB::transaction(function () {
            // 1. Seed or retrieve quest path milestone badges
            $questBadges = [
                [
                    'name' => 'Frontend Adventurer',
                    'slug' => 'frontend-adventurer',
                    'description' => 'Completed all stages in the Frontend Developer Quest Path',
                    'icon' => 'Sparkles',
                    'rule_key' => 'quest_frontend_complete',
                ],
                [
                    'name' => 'Backend Architect',
                    'slug' => 'backend-architect',
                    'description' => 'Completed all stages in the Backend Developer Quest Path',
                    'icon' => 'Server',
                    'rule_key' => 'quest_backend_complete',
                ],
                [
                    'name' => 'SQL Grandmaster',
                    'slug' => 'sql-grandmaster',
                    'description' => 'Completed all stages in the SQL & Database Quest Path',
                    'icon' => 'Database',
                    'rule_key' => 'quest_sql_complete',
                ],
                [
                    'name' => 'Algorithm Conqueror',
                    'slug' => 'algorithm-conqueror',
                    'description' => 'Completed all stages in the Algorithms & Problem Solving Quest Path',
                    'icon' => 'Cpu',
                    'rule_key' => 'quest_algorithms_complete',
                ],
                [
                    'name' => 'DevOps Pioneer',
                    'slug' => 'devops-pioneer',
                    'description' => 'Completed all stages in the Git & Developer Tools Quest Path',
                    'icon' => 'Terminal',
                    'rule_key' => 'quest_tools_complete',
                ],
                [
                    'name' => 'Quest Master',
                    'slug' => 'quest-master',
                    'description' => 'Completed all learning paths across CodeArena Quest',
                    'icon' => 'Trophy',
                    'rule_key' => 'quest_all_complete',
                ],
            ];

            $badgeMap = [];
            foreach ($questBadges as $badgeData) {
                $badge = Badge::updateOrCreate(
                    ['slug' => $badgeData['slug']],
                    $badgeData
                );
                $badgeMap[$badgeData['slug']] = $badge->id;
            }

            // 2. Define 5 Quest Paths with ordered stages and real challenge slugs
            $pathsData = [
                [
                    'slug' => 'frontend-developer',
                    'title' => 'Frontend Developer',
                    'description' => 'Master browser UI foundations, responsive styling, interactive DOM mechanics, and JavaScript algorithms.',
                    'category' => 'Frontend',
                    'icon' => 'Layout',
                    'difficulty' => 'Beginner',
                    'estimated_hours' => 25,
                    'position' => 1,
                    'reward_xp' => 250,
                    'reward_badge_slug' => 'frontend-adventurer',
                    'stages' => [
                        [
                            'slug' => 'frontend-ui-foundations',
                            'title' => 'UI Foundations & Responsive Design',
                            'description' => 'Build clean responsive layouts and implement modern interactive theme toggles.',
                            'position' => 1,
                            'reward_xp' => 50,
                            'prerequisite_stage_slug' => null,
                            'challenges' => [
                                'web-responsive-pricing-card',
                                'web-interactive-dark-mode-toggle',
                            ],
                        ],
                        [
                            'slug' => 'frontend-dom-components',
                            'title' => 'Dynamic Components & State Flow',
                            'description' => 'Engineer collapsible interactive accordions and precise real-time stopwatch timers.',
                            'position' => 2,
                            'reward_xp' => 75,
                            'prerequisite_stage_slug' => 'frontend-ui-foundations',
                            'challenges' => [
                                'web-accordion-faq',
                                'web-stopwatch-timer',
                            ],
                        ],
                        [
                            'slug' => 'frontend-javascript-core',
                            'title' => 'JavaScript Core & String Logic',
                            'description' => 'Master string manipulation algorithms and robust parenthesis validation.',
                            'position' => 3,
                            'reward_xp' => 75,
                            'prerequisite_stage_slug' => 'frontend-dom-components',
                            'challenges' => [
                                'reverse-string',
                                'valid-parentheses',
                            ],
                        ],
                        [
                            'slug' => 'frontend-algorithms',
                            'title' => 'Problem Solving for Frontend UIs',
                            'description' => 'Optimize algorithmic lookup speed for real-time frontend search and data filtering.',
                            'position' => 4,
                            'reward_xp' => 100,
                            'prerequisite_stage_slug' => 'frontend-javascript-core',
                            'challenges' => [
                                'two-sum',
                                'valid-anagram',
                            ],
                        ],
                    ],
                ],
                [
                    'slug' => 'backend-developer',
                    'title' => 'Backend Developer',
                    'description' => 'Architect modern RESTful APIs, apply SOLID architectural principles, master unit testing, and design scalable services.',
                    'category' => 'Backend',
                    'icon' => 'Server',
                    'difficulty' => 'Medium',
                    'estimated_hours' => 30,
                    'position' => 2,
                    'reward_xp' => 300,
                    'reward_badge_slug' => 'backend-architect',
                    'stages' => [
                        [
                            'slug' => 'backend-http-apis',
                            'title' => 'HTTP Protocols & REST API Architecture',
                            'description' => 'Master HTTP verbs, status codes, idempotent requests, and client-server contracts.',
                            'position' => 1,
                            'reward_xp' => 50,
                            'prerequisite_stage_slug' => null,
                            'challenges' => [
                                'quiz-http-status-codes',
                            ],
                        ],
                        [
                            'slug' => 'backend-solid-design',
                            'title' => 'Clean Code & SOLID Principles',
                            'description' => 'Deconstruct Single Responsibility, Open-Closed, and Dependency Inversion rules.',
                            'position' => 2,
                            'reward_xp' => 75,
                            'prerequisite_stage_slug' => 'backend-http-apis',
                            'challenges' => [
                                'quiz-solid-principles',
                            ],
                        ],
                        [
                            'slug' => 'backend-testing',
                            'title' => 'Automated Unit Testing & Quality Defense',
                            'description' => 'Learn test doubles, assertion boundaries, fixtures, and continuous regression safety.',
                            'position' => 3,
                            'reward_xp' => 75,
                            'prerequisite_stage_slug' => 'backend-solid-design',
                            'challenges' => [
                                'quiz-unit-testing-fundamentals',
                            ],
                        ],
                        [
                            'slug' => 'backend-system-patterns',
                            'title' => 'Design Patterns & Enterprise Architecture',
                            'description' => 'Implement Factory, Singleton, Strategy, and Observer design patterns.',
                            'position' => 4,
                            'reward_xp' => 100,
                            'prerequisite_stage_slug' => 'backend-testing',
                            'challenges' => [
                                'software-architecture-design-patterns-quiz',
                            ],
                        ],
                    ],
                ],
                [
                    'slug' => 'sql-database',
                    'title' => 'SQL & Database Mastery',
                    'description' => 'Conquer relational queries from elementary filtering to multi-table joins, ACID transactions, and window analytics.',
                    'category' => 'Database',
                    'icon' => 'Database',
                    'difficulty' => 'Medium',
                    'estimated_hours' => 20,
                    'position' => 3,
                    'reward_xp' => 250,
                    'reward_badge_slug' => 'sql-grandmaster',
                    'stages' => [
                        [
                            'slug' => 'sql-foundations',
                            'title' => 'Query Foundations & NULL Handling',
                            'description' => 'Master WHERE filters, area calculations, and anti-join logic using LEFT JOIN and IS NULL.',
                            'position' => 1,
                            'reward_xp' => 50,
                            'prerequisite_stage_slug' => null,
                            'challenges' => [
                                'sql-big-countries',
                                'sql-customers-who-never-order',
                            ],
                        ],
                        [
                            'slug' => 'sql-joins-aggregations',
                            'title' => 'Self-Joins, Grouping & Counting',
                            'description' => 'Compare hierarchical employee salaries, detect duplicates, and filter with HAVING.',
                            'position' => 2,
                            'reward_xp' => 75,
                            'prerequisite_stage_slug' => 'sql-foundations',
                            'challenges' => [
                                'sql-employees-earning-more-than-managers',
                                'sql-duplicate-emails',
                                'sql-classes-more-than-5-students',
                            ],
                        ],
                        [
                            'slug' => 'sql-indexing-transactions',
                            'title' => 'ACID Concurrency & DML Updates',
                            'description' => 'Understand B-tree indexes, isolation levels, and perform dynamic CASE statement swaps.',
                            'position' => 3,
                            'reward_xp' => 75,
                            'prerequisite_stage_slug' => 'sql-joins-aggregations',
                            'challenges' => [
                                'quiz-database-indexing-acid',
                                'sql-swap-salary',
                            ],
                        ],
                        [
                            'slug' => 'sql-advanced-analytics',
                            'title' => 'Window Functions & Ranking Analytics',
                            'description' => 'Extract top-N departmental salaries, consecutive theater seats, and running totals.',
                            'position' => 4,
                            'reward_xp' => 100,
                            'prerequisite_stage_slug' => 'sql-indexing-transactions',
                            'challenges' => [
                                'sql-second-highest-salary',
                                'sql-consecutive-available-seats',
                                'sql-department-top-three-salaries',
                            ],
                        ],
                    ],
                ],
                [
                    'slug' => 'algorithms-problem-solving',
                    'title' => 'Algorithms & Problem Solving',
                    'description' => 'Build rock-solid technical interview foundations spanning two-pointers, binary search, trees, and dynamic programming.',
                    'category' => 'Computer Science',
                    'icon' => 'Cpu',
                    'difficulty' => 'Hard',
                    'estimated_hours' => 40,
                    'position' => 4,
                    'reward_xp' => 350,
                    'reward_badge_slug' => 'algorithm-conqueror',
                    'stages' => [
                        [
                            'slug' => 'algo-foundations',
                            'title' => 'Array Foundations & In-Place Swaps',
                            'description' => 'Detect duplicate elements efficiently and partition zeros without extra memory.',
                            'position' => 1,
                            'reward_xp' => 50,
                            'prerequisite_stage_slug' => null,
                            'challenges' => [
                                'contains-duplicate',
                                'move-zeroes',
                            ],
                        ],
                        [
                            'slug' => 'algo-search-sort',
                            'title' => 'Logarithmic Search & Two Pointers',
                            'description' => 'Execute O(log n) searches, sort colors in single-pass O(n), and verify palindromes.',
                            'position' => 2,
                            'reward_xp' => 75,
                            'prerequisite_stage_slug' => 'algo-foundations',
                            'challenges' => [
                                'binary-search',
                                'sort-colors',
                                'valid-palindrome',
                            ],
                        ],
                        [
                            'slug' => 'algo-linked-lists-trees',
                            'title' => 'Linked Lists & Binary Trees',
                            'description' => 'Traverse nodes with fast & slow pointers, merge sorted lists, and invert binary trees.',
                            'position' => 3,
                            'reward_xp' => 75,
                            'prerequisite_stage_slug' => 'algo-search-sort',
                            'challenges' => [
                                'middle-of-linked-list',
                                'merge-two-sorted-lists',
                                'invert-binary-tree',
                            ],
                        ],
                        [
                            'slug' => 'algo-dynamic-programming',
                            'title' => 'Dynamic Programming & Water Trapping',
                            'description' => 'Calculate step combinations, compute optimal coin changes, and trap rainwater.',
                            'position' => 4,
                            'reward_xp' => 100,
                            'prerequisite_stage_slug' => 'algo-linked-lists-trees',
                            'challenges' => [
                                'climbing-stairs',
                                'coin-change',
                                'trapping-rain-water',
                            ],
                        ],
                    ],
                ],
                [
                    'slug' => 'git-developer-tools',
                    'title' => 'Git & Developer Tools',
                    'description' => 'Master practical engineering workflows: Git branching, Linux bash scripting, file permissions, and Docker.',
                    'category' => 'DevOps',
                    'icon' => 'Terminal',
                    'difficulty' => 'Easy',
                    'estimated_hours' => 15,
                    'position' => 5,
                    'reward_xp' => 250,
                    'reward_badge_slug' => 'devops-pioneer',
                    'stages' => [
                        [
                            'slug' => 'git-version-control',
                            'title' => 'Git Foundations & Collaboration',
                            'description' => 'Master commits, branches, three-way merge resolution, and git stash mechanics.',
                            'position' => 1,
                            'reward_xp' => 50,
                            'prerequisite_stage_slug' => null,
                            'challenges' => [
                                'quiz-git-fundamentals',
                            ],
                        ],
                        [
                            'slug' => 'linux-cli-mastery',
                            'title' => 'Linux Shell & Bash Productivity',
                            'description' => 'Navigate Linux directory structures, filter streams with grep/awk, and pipe commands.',
                            'position' => 2,
                            'reward_xp' => 50,
                            'prerequisite_stage_slug' => 'git-version-control',
                            'challenges' => [
                                'linux-bash-command-line-quiz',
                            ],
                        ],
                        [
                            'slug' => 'linux-processes-permissions',
                            'title' => 'Linux Permissions & Process Control',
                            'description' => 'Understand numeric chmod masks, file ownership, signal traps, and background daemons.',
                            'position' => 3,
                            'reward_xp' => 75,
                            'prerequisite_stage_slug' => 'linux-cli-mastery',
                            'challenges' => [
                                'quiz-linux-permissions-processes',
                            ],
                        ],
                        [
                            'slug' => 'docker-containers',
                            'title' => 'Docker Containers & DevOps CI/CD',
                            'description' => 'Construct optimized multi-stage Dockerfiles, configure volumes, and package services.',
                            'position' => 4,
                            'reward_xp' => 100,
                            'prerequisite_stage_slug' => 'linux-processes-permissions',
                            'challenges' => [
                                'docker-fundamentals-quiz',
                                'quiz-docker-devops',
                            ],
                        ],
                    ],
                ],
            ];

            // 3. Insert or update paths and stages idempotently
            foreach ($pathsData as $pData) {
                $path = QuestPath::updateOrCreate(
                    ['slug' => $pData['slug']],
                    [
                        'title' => $pData['title'],
                        'description' => $pData['description'],
                        'category' => $pData['category'],
                        'icon' => $pData['icon'],
                        'difficulty' => $pData['difficulty'],
                        'estimated_hours' => $pData['estimated_hours'],
                        'position' => $pData['position'],
                        'reward_xp' => $pData['reward_xp'],
                        'reward_badge_id' => $badgeMap[$pData['reward_badge_slug']] ?? null,
                        'is_published' => true,
                    ]
                );

                $stageMap = [];

                // First pass: create/update stages without prerequisite links
                foreach ($pData['stages'] as $sData) {
                    $stage = QuestStage::updateOrCreate(
                        [
                            'quest_path_id' => $path->id,
                            'slug' => $sData['slug'],
                        ],
                        [
                            'title' => $sData['title'],
                            'description' => $sData['description'],
                            'position' => $sData['position'],
                            'reward_xp' => $sData['reward_xp'],
                        ]
                    );

                    $stageMap[$sData['slug']] = $stage;

                    // Sync challenges
                    $challengeSlugs = $sData['challenges'];
                    $challengeIds = Challenge::whereIn('slug', $challengeSlugs)->pluck('id', 'slug');

                    $stageChallengeRecords = [];
                    $pos = 1;
                    foreach ($challengeSlugs as $cSlug) {
                        if (isset($challengeIds[$cSlug])) {
                            QuestStageChallenge::updateOrCreate(
                                [
                                    'quest_stage_id' => $stage->id,
                                    'challenge_id' => $challengeIds[$cSlug],
                                ],
                                [
                                    'position' => $pos++,
                                ]
                            );
                        }
                    }
                }

                // Second pass: wire prerequisite stage IDs
                foreach ($pData['stages'] as $sData) {
                    if ($sData['prerequisite_stage_slug']) {
                        $prereqStage = $stageMap[$sData['prerequisite_stage_slug']] ?? null;
                        if ($prereqStage && isset($stageMap[$sData['slug']])) {
                            $stageMap[$sData['slug']]->update([
                                'prerequisite_stage_id' => $prereqStage->id,
                            ]);
                        }
                    }
                }
            }
        });
    }
}
