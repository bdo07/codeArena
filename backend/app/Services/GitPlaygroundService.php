<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use App\Models\UserGitPlaygroundProgress;
use Illuminate\Support\Facades\DB;

class GitPlaygroundService
{
    /**
     * Get user's progress across all git playground scenarios.
     */
    public function getProgress(?User $user): array
    {
        if (!$user) {
            return [
                'completed_scenarios' => [],
                'total_xp_earned' => 0,
                'commands_executed' => 0,
            ];
        }

        $progressRecords = UserGitPlaygroundProgress::where('user_id', $user->id)->get();

        return [
            'completed_scenarios' => $progressRecords->where('is_completed', true)->pluck('scenario_id')->values()->toArray(),
            'total_xp_earned' => $progressRecords->sum('xp_awarded'),
            'commands_executed' => $progressRecords->sum('commands_count'),
            'records' => $progressRecords->keyBy('scenario_id'),
        ];
    }

    /**
     * Complete a scenario and award XP (25 XP per scenario, claimed once).
     */
    public function completeScenario(User $user, string $scenarioId, int $commandsCount = 1): array
    {
        return DB::transaction(function () use ($user, $scenarioId, $commandsCount) {
            $progress = UserGitPlaygroundProgress::firstOrCreate(
                ['user_id' => $user->id, 'scenario_id' => $scenarioId],
                [
                    'is_completed' => false,
                    'commands_count' => 0,
                    'reward_claimed' => false,
                    'xp_awarded' => 0,
                ]
            );

            $progress->commands_count += max(1, $commandsCount);
            $xpAwarded = 0;
            $isFirstCompletion = false;

            if (!$progress->is_completed || !$progress->reward_claimed) {
                $progress->is_completed = true;
                $progress->completed_at = $progress->completed_at ?? now();

                if (!$progress->reward_claimed) {
                    $xpAwarded = 25; // 25 XP per scenario
                    $progress->reward_claimed = true;
                    $progress->xp_awarded = $xpAwarded;
                    $user->increment('xp', $xpAwarded);
                    $isFirstCompletion = true;

                    Notification::create([
                        'user_id' => $user->id,
                        'type' => 'achievement',
                        'title' => '🐙 Git Scenario Mastered!',
                        'message' => "You conquered Git scenario '{$scenarioId}' and earned +{$xpAwarded} XP!",
                        'data' => [
                            'scenario_id' => $scenarioId,
                            'xp' => $xpAwarded,
                        ],
                    ]);
                }
            }

            $progress->save();
            $user->refresh();

            return [
                'success' => true,
                'scenario_id' => $scenarioId,
                'is_first_completion' => $isFirstCompletion,
                'xp_awarded' => $xpAwarded,
                'user_xp' => $user->xp,
                'user_level' => $user->calculateLevel(),
                'commands_count' => $progress->commands_count,
            ];
        });
    }
}
