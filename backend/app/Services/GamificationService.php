<?php

namespace App\Services;

use App\Models\Badge;
use App\Models\Challenge;
use App\Models\DailyCompletion;
use App\Models\Notification;
use App\Models\Submission;
use App\Models\User;
use App\Models\UserChallengeProgress;
use App\Models\UserStreak;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class GamificationService
{
    /**
     * Award XP, badges, streaks, and notifications on successful challenge completion.
     * Prevents duplicate XP awards using database transactions and progress checks.
     */
    public function awardProgressAndXp(User $user, Challenge $challenge, Submission $submission): array
    {
        return DB::transaction(function () use ($user, $challenge, $submission) {
            $progress = UserChallengeProgress::firstOrNew([
                'user_id' => $user->id,
                'challenge_id' => $challenge->id,
            ]);

            $isFirstSolve = ($progress->solved_at === null);
            $xpAwarded = 0;
            $newBadges = [];

            // Update progress metadata
            $progress->attempts_count = ($progress->attempts_count ?? 0) + 1;
            if ($submission->score > ($progress->best_score ?? 0)) {
                $progress->best_score = $submission->score;
            }

            if ($submission->isAccepted()) {
                if ($isFirstSolve) {
                    $progress->solved_at = Carbon::now();

                    // Compute XP according to difficulty
                    $xpAwarded = match ($challenge->difficulty) {
                        'Beginner' => 25,
                        'Easy' => 50,
                        'Medium' => 100,
                        'Hard' => 200,
                        'Expert' => 300,
                        default => 50,
                    };

                    // Award base XP
                    $user->increment('xp', $xpAwarded);
                }

                // Streak & Daily Challenge update
                $streakInfo = $this->updateUserStreak($user);
                $dailyBonus = $this->checkAndAwardDailyBonus($user, $challenge);
                $xpAwarded += $dailyBonus;

                $user->refresh();
                $progress->save();

                // Check for new badges
                $newBadges = $this->checkAndAwardBadges($user, $challenge);
            } else {
                $progress->save();
                $streakInfo = $this->getUserStreakInfo($user);
            }

            return [
                'is_first_solve' => $isFirstSolve,
                'xp_awarded' => $xpAwarded,
                'total_xp' => $user->xp,
                'level' => $user->calculateLevel(),
                'new_badges' => $newBadges,
                'streak' => $streakInfo ?? $this->getUserStreakInfo($user),
            ];
        });
    }

    /**
     * Update user streak atomically.
     */
    public function updateUserStreak(User $user): array
    {
        $today = Carbon::today();
        $streak = UserStreak::firstOrCreate(
            ['user_id' => $user->id],
            ['current_streak' => 0, 'longest_streak' => 0, 'last_activity_date' => null]
        );

        if (!$streak->last_activity_date) {
            $streak->current_streak = 1;
            $streak->longest_streak = 1;
            $streak->last_activity_date = $today;
            $streak->save();
        } else {
            $lastActivity = Carbon::parse($streak->last_activity_date)->startOfDay();

            if ($lastActivity->equalTo($today)) {
                // Already counted today
            } elseif ($lastActivity->equalTo($today->copy()->subDay())) {
                // Streak continued!
                $streak->current_streak += 1;
                if ($streak->current_streak > $streak->longest_streak) {
                    $streak->longest_streak = $streak->current_streak;
                }
                $streak->last_activity_date = $today;
                $streak->save();

                // Check for streak milestone notifications
                if (in_array($streak->current_streak, [3, 7, 14, 30, 50, 100])) {
                    Notification::create([
                        'user_id' => $user->id,
                        'type' => 'streak',
                        'title' => "🔥 {$streak->current_streak}-Day Streak!",
                        'message' => "Incredible dedication! You've solved challenges {$streak->current_streak} days in a row.",
                        'data' => ['streak' => $streak->current_streak],
                    ]);
                }
            } else {
                // Streak broken, reset to 1
                $streak->current_streak = 1;
                $streak->last_activity_date = $today;
                $streak->save();
            }
        }

        return [
            'current_streak' => $streak->current_streak,
            'longest_streak' => $streak->longest_streak,
            'last_activity_date' => $streak->last_activity_date?->toDateString(),
        ];
    }

    /**
     * Get user streak info
     */
    public function getUserStreakInfo(User $user): array
    {
        $streak = UserStreak::where('user_id', $user->id)->first();
        if (!$streak) {
            return [
                'current_streak' => 0,
                'longest_streak' => 0,
                'last_activity_date' => null,
            ];
        }

        return [
            'current_streak' => $streak->current_streak,
            'longest_streak' => $streak->longest_streak,
            'last_activity_date' => $streak->last_activity_date?->toDateString(),
        ];
    }

    /**
     * Check if challenge is daily challenge and award daily bonus XP
     */
    protected function checkAndAwardDailyBonus(User $user, Challenge $challenge): int
    {
        $today = Carbon::today()->toDateString();
        $isTodayDaily = $challenge->is_daily && ($challenge->daily_date?->toDateString() === $today || $challenge->daily_date === null);

        if (!$isTodayDaily) {
            return 0;
        }

        $existing = DailyCompletion::where('user_id', $user->id)
            ->where('completed_date', $today)
            ->first();

        if ($existing) {
            return 0;
        }

        $dailyBonusXp = 50;
        DailyCompletion::create([
            'user_id' => $user->id,
            'challenge_id' => $challenge->id,
            'completed_date' => $today,
            'xp_awarded' => $dailyBonusXp,
        ]);

        $user->increment('xp', $dailyBonusXp);

        Notification::create([
            'user_id' => $user->id,
            'type' => 'daily',
            'title' => '🌟 Daily Challenge Solved!',
            'message' => "You conquered today's Daily Challenge ({$challenge->title}) and earned +{$dailyBonusXp} bonus XP!",
            'data' => ['challenge_id' => $challenge->id, 'xp' => $dailyBonusXp],
        ]);

        return $dailyBonusXp;
    }

    /**
     * Check if user qualifies for any new badges and attach them.
     */
    protected function checkAndAwardBadges(User $user, Challenge $currentChallenge): array
    {
        $awarded = [];
        $existingBadgeIds = $user->badges()->pluck('badges.id')->toArray();

        // 1. First Solve Badge
        $solvedCount = UserChallengeProgress::where('user_id', $user->id)
            ->whereNotNull('solved_at')
            ->count();

        if ($solvedCount >= 1) {
            $badge = Badge::where('rule_key', 'first_solve')->first();
            if ($badge && !in_array($badge->id, $existingBadgeIds)) {
                $user->badges()->attach($badge->id, ['earned_at' => Carbon::now()]);
                $existingBadgeIds[] = $badge->id;
                $awarded[] = $badge;

                Notification::create([
                    'user_id' => $user->id,
                    'type' => 'achievement',
                    'title' => '🏆 New Badge Unlocked!',
                    'message' => "You unlocked the '{$badge->name}' badge!",
                    'data' => ['badge_id' => $badge->id, 'badge_name' => $badge->name],
                ]);
            }
        }

        // 2. Problem Solver (3 solves)
        if ($solvedCount >= 3) {
            $badge = Badge::where('rule_key', 'solve_3')->first();
            if ($badge && !in_array($badge->id, $existingBadgeIds)) {
                $user->badges()->attach($badge->id, ['earned_at' => Carbon::now()]);
                $existingBadgeIds[] = $badge->id;
                $awarded[] = $badge;

                Notification::create([
                    'user_id' => $user->id,
                    'type' => 'achievement',
                    'title' => '🏆 New Badge Unlocked!',
                    'message' => "You unlocked the '{$badge->name}' badge!",
                    'data' => ['badge_id' => $badge->id, 'badge_name' => $badge->name],
                ]);
            }
        }

        // 3. Decathlon Coder (5 solves)
        if ($solvedCount >= 5) {
            $badge = Badge::where('rule_key', 'solve_5')->first();
            if ($badge && !in_array($badge->id, $existingBadgeIds)) {
                $user->badges()->attach($badge->id, ['earned_at' => Carbon::now()]);
                $existingBadgeIds[] = $badge->id;
                $awarded[] = $badge;

                Notification::create([
                    'user_id' => $user->id,
                    'type' => 'achievement',
                    'title' => '🏆 New Badge Unlocked!',
                    'message' => "You unlocked the '{$badge->name}' badge!",
                    'data' => ['badge_id' => $badge->id, 'badge_name' => $badge->name],
                ]);
            }
        }

        // 4. Apex Master (Hard or Expert solve)
        if (in_array($currentChallenge->difficulty, ['Hard', 'Expert'])) {
            $badge = Badge::where('rule_key', 'hard_solve')->first();
            if ($badge && !in_array($badge->id, $existingBadgeIds)) {
                $user->badges()->attach($badge->id, ['earned_at' => Carbon::now()]);
                $existingBadgeIds[] = $badge->id;
                $awarded[] = $badge;

                Notification::create([
                    'user_id' => $user->id,
                    'type' => 'achievement',
                    'title' => '🏆 Apex Master Badge!',
                    'message' => "You solved a difficult problem and earned '{$badge->name}'!",
                    'data' => ['badge_id' => $badge->id, 'badge_name' => $badge->name],
                ]);
            }
        }

        return $awarded;
    }
}
