<?php

namespace Database\Seeders;

use App\Models\Challenge;
use App\Models\Collection;
use App\Models\User;
use Illuminate\Database\Seeder;

class CollectionSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('role', 'admin')->first() ?? User::first();
        if (!$admin) {
            return;
        }

        $collections = [
            [
                'name' => 'Top Interview 75',
                'description' => 'Most frequently asked coding interview problems by major tech companies.',
                'icon' => 'Briefcase',
                'is_public' => true,
                'challenges' => ['two-sum', 'best-time-to-buy-and-sell-stock', 'contains-duplicate', 'product-of-array-except-self', 'maximum-subarray', '3sum', 'reverse-linked-list', 'merge-two-sorted-lists', 'valid-parentheses'],
            ],
            [
                'name' => 'SQL Practice Essentials',
                'description' => 'Targeted SQL practice for backend, data engineering, and analytics roles.',
                'icon' => 'Database',
                'is_public' => true,
                'challenges' => ['sql-customers-who-never-order', 'sql-second-highest-salary', 'sql-duplicate-emails', 'sql-employees-earning-more-than-managers', 'sql-department-top-three-salaries', 'sql-big-countries'],
            ],
            [
                'name' => 'Frontend & DOM Challenges',
                'description' => 'Practical UI components, responsive layout challenges, and web standards.',
                'icon' => 'Layout',
                'is_public' => true,
                'challenges' => ['web-responsive-pricing-card', 'web-interactive-dark-mode-toggle'],
            ],
        ];

        foreach ($collections as $cData) {
            $challengeSlugs = $cData['challenges'];
            unset($cData['challenges']);

            $collection = Collection::updateOrCreate(
                [
                    'user_id' => $admin->id,
                    'name' => $cData['name'],
                ],
                $cData
            );

            $challengeIds = Challenge::whereIn('slug', $challengeSlugs)->pluck('id')->toArray();
            $syncData = [];
            foreach ($challengeIds as $idx => $id) {
                $syncData[$id] = ['position' => $idx + 1];
            }
            $collection->challenges()->sync($syncData);
        }
    }
}
