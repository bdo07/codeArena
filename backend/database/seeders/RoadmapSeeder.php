<?php

namespace Database\Seeders;

use App\Models\Challenge;
use App\Models\Roadmap;
use App\Models\RoadmapModule;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class RoadmapSeeder extends Seeder
{
    public function run(): void
    {
        $roadmapsData = [
            [
                'slug' => 'algorithms-data-structures',
                'title' => 'Algorithms & Data Structures',
                'description' => 'Master core computer science algorithms: arrays, two pointers, sliding window, binary search, trees, and dynamic programming.',
                'category' => 'algorithms',
                'icon' => 'Binary',
                'difficulty' => 'Medium',
                'estimated_hours' => 40,
                'position' => 1,
                'modules' => [
                    [
                        'title' => 'Array Foundations & Hash Maps',
                        'description' => 'Learn O(1) lookups and two-pointer array manipulation techniques.',
                        'challenges' => ['two-sum', 'contains-duplicate', 'move-zeroes', 'product-of-array-except-self', 'maximum-subarray'],
                    ],
                    [
                        'title' => 'String Manipulation & Sliding Window',
                        'description' => 'Substrings, anagrams, palindromes, and variable-length window patterns.',
                        'challenges' => ['reverse-string', 'valid-anagram', 'valid-palindrome', 'longest-common-prefix', 'longest-substring-without-repeating-characters'],
                    ],
                    [
                        'title' => 'Stacks & Linear Structures',
                        'description' => 'LIFO patterns, monotonic stacks, and balanced bracket validation.',
                        'challenges' => ['valid-parentheses', 'daily-temperatures', 'reverse-linked-list', 'merge-two-sorted-lists'],
                    ],
                    [
                        'title' => 'Binary Trees & Recursion',
                        'description' => 'Tree traversals, divide-and-conquer, and recursive tree inversion.',
                        'challenges' => ['invert-binary-tree', 'climbing-stairs', 'coin-change', 'subsets-power-set'],
                    ],
                ]
            ],
            [
                'slug' => 'sql-database-mastery',
                'title' => 'SQL & Database Mastery',
                'description' => 'From beginner SELECT queries to complex JOINs, GROUP BY aggregations, CTEs, and window functions.',
                'category' => 'database',
                'icon' => 'Database',
                'difficulty' => 'Easy',
                'estimated_hours' => 20,
                'position' => 2,
                'modules' => [
                    [
                        'title' => 'Filtering & Basic Joins',
                        'description' => 'WHERE filtering, boolean operations, and table joins.',
                        'challenges' => ['sql-big-countries', 'sql-customers-who-never-order', 'sql-employees-earning-more-than-managers'],
                    ],
                    [
                        'title' => 'Aggregations & Grouping',
                        'description' => 'GROUP BY, HAVING, and duplicate detection.',
                        'challenges' => ['sql-duplicate-emails', 'sql-classes-more-than-5-students', 'sql-swap-salary'],
                    ],
                    [
                        'title' => 'Advanced Queries & Window Functions',
                        'description' => 'DENSE_RANK, CTEs, and subquery calculations.',
                        'challenges' => ['sql-second-highest-salary', 'sql-department-top-three-salaries'],
                    ],
                ]
            ],
            [
                'slug' => 'web-development',
                'title' => 'Modern Web Development',
                'description' => 'Responsive layouts, modern CSS Grid/Flexbox, accessibility, DOM manipulation, and interactive UI components.',
                'category' => 'web',
                'icon' => 'Layout',
                'difficulty' => 'Beginner',
                'estimated_hours' => 25,
                'position' => 3,
                'modules' => [
                    [
                        'title' => 'Responsive CSS Architecture',
                        'description' => 'Flexbox, CSS Grid auto-fit, and responsive cards.',
                        'challenges' => ['web-responsive-pricing-card'],
                    ],
                    [
                        'title' => 'DOM & Dynamic Theming',
                        'description' => 'CSS custom properties and localStorage theme toggling.',
                        'challenges' => ['web-interactive-dark-mode-toggle'],
                    ],
                ]
            ],
            [
                'slug' => 'devops-software-engineering',
                'title' => 'DevOps & Software Engineering',
                'description' => 'Linux shell, Docker containerization, Git workflows, REST APIs, and SOLID software architecture.',
                'category' => 'software engineering',
                'icon' => 'Server',
                'difficulty' => 'Medium',
                'estimated_hours' => 30,
                'position' => 4,
                'modules' => [
                    [
                        'title' => 'Version Control & CLI Operations',
                        'description' => 'Git branching strategies and POSIX Linux permissions.',
                        'challenges' => ['quiz-git-fundamentals', 'quiz-linux-permissions-processes'],
                    ],
                    [
                        'title' => 'Containers & System Architecture',
                        'description' => 'Docker optimization, RESTful API design, and ACID guarantees.',
                        'challenges' => ['quiz-docker-devops', 'quiz-http-status-codes', 'quiz-database-indexing-acid', 'quiz-solid-principles', 'quiz-unit-testing-fundamentals'],
                    ],
                ]
            ],
            [
                'slug' => 'python-programming',
                'title' => 'Python for Developers',
                'description' => 'Essential data structures, functional patterns, algorithms, and idiomatic Python.',
                'category' => 'python',
                'icon' => 'Code',
                'difficulty' => 'Easy',
                'estimated_hours' => 25,
                'position' => 5,
                'modules' => [
                    [
                        'title' => 'Python Essentials',
                        'description' => 'Slices, dictionaries, list comprehensions, and counters.',
                        'challenges' => ['two-sum', 'valid-anagram', 'contains-duplicate', 'reverse-string'],
                    ],
                    [
                        'title' => 'Algorithmic Problem Solving',
                        'description' => 'Two-pointers and dynamic programming in Python.',
                        'challenges' => ['3sum', 'coin-change', 'climbing-stairs'],
                    ],
                ]
            ],
            [
                'slug' => 'javascript-typescript',
                'title' => 'JavaScript & TypeScript Mastery',
                'description' => 'Modern ECMAScript, asynchronous patterns, browser APIs, and type safety.',
                'category' => 'javascript',
                'icon' => 'FileCode',
                'difficulty' => 'Medium',
                'estimated_hours' => 30,
                'position' => 6,
                'modules' => [
                    [
                        'title' => 'Core JS & Data Structures',
                        'description' => 'Maps, Sets, and string algorithms in JS.',
                        'challenges' => ['contains-duplicate', 'reverse-string', 'valid-parentheses'],
                    ],
                ]
            ],
            [
                'slug' => 'php-laravel',
                'title' => 'PHP & Laravel Backend',
                'description' => 'Modern PHP, MVC architectures, Eloquent ORM, APIs, and authentication.',
                'category' => 'php',
                'icon' => 'Layers',
                'difficulty' => 'Medium',
                'estimated_hours' => 25,
                'position' => 7,
                'modules' => [
                    [
                        'title' => 'Backend Fundamentals',
                        'description' => 'HTTP endpoints, testing, and database architecture.',
                        'challenges' => ['quiz-http-status-codes', 'quiz-unit-testing-fundamentals', 'quiz-solid-principles'],
                    ],
                ]
            ],
            [
                'slug' => 'java-enterprise',
                'title' => 'Java & Object-Oriented Systems',
                'description' => 'OOP design patterns, Java Collections framework, and enterprise data structures.',
                'category' => 'java',
                'icon' => 'Coffee',
                'difficulty' => 'Medium',
                'estimated_hours' => 35,
                'position' => 8,
                'modules' => [
                    [
                        'title' => 'Java Data Structures & Design',
                        'description' => 'HashMaps, Stacks, Lists, and SOLID design.',
                        'challenges' => ['two-sum', 'valid-parentheses', 'reverse-linked-list', 'quiz-solid-principles'],
                    ],
                ]
            ],
        ];

        foreach ($roadmapsData as $rData) {
            $modules = $rData['modules'] ?? [];
            unset($rData['modules']);

            $roadmap = Roadmap::updateOrCreate(
                ['slug' => $rData['slug']],
                $rData
            );

            foreach ($modules as $mIdx => $m) {
                $challengeSlugs = $m['challenges'] ?? [];
                $module = RoadmapModule::updateOrCreate(
                    [
                        'roadmap_id' => $roadmap->id,
                        'position' => $mIdx + 1,
                    ],
                    [
                        'title' => $m['title'],
                        'description' => $m['description'],
                    ]
                );

                // Link challenges
                $challengeIds = Challenge::whereIn('slug', $challengeSlugs)->pluck('id')->toArray();
                $syncData = [];
                foreach ($challengeIds as $pos => $cId) {
                    $syncData[$cId] = ['position' => $pos + 1];
                }
                $module->challenges()->sync($syncData);
            }
        }
    }
}
