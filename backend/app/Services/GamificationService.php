<?php

namespace App\Services;

use App\Models\Badge;
use App\Models\Challenge;
use App\Models\Submission;
use App\Models\User;
use App\Models\UserChallengeProgress;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class GamificationService
{
    /**
     * Award XP and badges on successful challenge completion.
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

            if ($isFirstSolve && $submission->isAccepted()) {
                $progress->solved_at = Carbon::now();

                // Compute XP according to difficulty
                $xpAwarded = match ($challenge->difficulty) {
                    'Easy' => 50,
                    'Medium' => 100,
                    'Hard' => 200,
                    default => 50,
                };

                // Award XP atomically
                $user->increment('xp', $xpAwarded);
                $user->refresh();

                $progress->save();

                // Check for new badges
                $newBadges = $this->checkAndAwardBadges($user, $challenge);
            } else {
                $progress->save();
            }

            return [
                'is_first_solve' => $isFirstSolve,
                'xp_awarded' => $xpAwarded,
                'total_xp' => $user->xp,
                'level' => $user->calculateLevel(),
                'new_badges' => $newBadges,
            ];
        });
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
            }
        }

        // 2. Problem Solver (3 solves)
        if ($solvedCount >= 3) {
            $badge = Badge::where('rule_key', 'solve_3')->first();
            if ($badge && !in_array($badge->id, $existingBadgeIds)) {
                $user->badges()->attach($badge->id, ['earned_at' => Carbon::now()]);
                $existingBadgeIds[] = $badge->id;
                $awarded[] = $badge;
            }
        }

        // 3. Decathlon Coder (5 solves)
        if ($solvedCount >= 5) {
            $badge = Badge::where('rule_key', 'solve_5')->first();
            if ($badge && !in_array($badge->id, $existingBadgeIds)) {
                $user->badges()->attach($badge->id, ['earned_at' => Carbon::now()]);
                $existingBadgeIds[] = $badge->id;
                $awarded[] = $badge;
            }
        }

        // 4. Apex Master (Hard solve)
        if ($currentChallenge->difficulty === 'Hard') {
            $badge = Badge::where('rule_key', 'hard_solve')->first();
            if ($badge && !in_array($badge->id, $existingBadgeIds)) {
                $user->badges()->attach($badge->id, ['earned_at' => Carbon::now()]);
                $existingBadgeIds[] = $badge->id;
                $awarded[] = $badge;
            }
        }

        return $awarded;
    }
}
