<?php

namespace App\Services;

use App\Models\Badge;
use App\Models\Challenge;
use App\Models\Notification;
use App\Models\QuestPath;
use App\Models\QuestStage;
use App\Models\User;
use App\Models\UserChallengeProgress;
use App\Models\UserDailyMissionProgress;
use App\Models\UserQuestPathCompletion;
use App\Models\UserQuestProgress;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class QuestService
{
    /**
     * Get all published quest paths with user's progress.
     */
    public function getPathsWithProgress(?User $user): array
    {
        $paths = QuestPath::where('is_published', true)
            ->with(['stages.challenges', 'rewardBadge'])
            ->orderBy('position')
            ->get();

        $solvedChallengeIds = [];
        $userStageProgressMap = [];
        $userPathCompletionsMap = [];

        if ($user) {
            $solvedChallengeIds = UserChallengeProgress::where('user_id', $user->id)
                ->whereNotNull('solved_at')
                ->pluck('challenge_id')
                ->flip()
                ->toArray();

            $userStageProgressMap = UserQuestProgress::where('user_id', $user->id)
                ->get()
                ->keyBy('quest_stage_id');

            $userPathCompletionsMap = UserQuestPathCompletion::where('user_id', $user->id)
                ->get()
                ->keyBy('quest_path_id');
        }

        $formattedPaths = $paths->map(function ($path) use ($user, $solvedChallengeIds, $userStageProgressMap, $userPathCompletionsMap) {
            $stages = $path->stages;
            $totalStages = $stages->count();
            $completedStages = 0;
            $totalChallenges = 0;
            $completedChallenges = 0;

            foreach ($stages as $stage) {
                $stageChallenges = $stage->challenges;
                $totalChallenges += $stageChallenges->count();

                $stageSolvedCount = 0;
                foreach ($stageChallenges as $ch) {
                    if (isset($solvedChallengeIds[$ch->id])) {
                        $stageSolvedCount++;
                        $completedChallenges++;
                    }
                }

                $isStageCompleted = ($stageChallenges->count() > 0 && $stageSolvedCount >= $stageChallenges->count());
                if ($isStageCompleted) {
                    $completedStages++;
                }
            }

            $percentage = $totalStages > 0 ? (int) round(($completedStages / $totalStages) * 100) : 0;
            $isPathCompleted = ($totalStages > 0 && $completedStages === $totalStages);

            return [
                'id' => $path->id,
                'slug' => $path->slug,
                'title' => $path->title,
                'description' => $path->description,
                'category' => $path->category,
                'icon' => $path->icon,
                'difficulty' => $path->difficulty,
                'estimated_hours' => $path->estimated_hours,
                'position' => $path->position,
                'reward_xp' => $path->reward_xp,
                'reward_badge' => $path->rewardBadge ? [
                    'id' => $path->rewardBadge->id,
                    'name' => $path->rewardBadge->name,
                    'slug' => $path->rewardBadge->slug,
                    'description' => $path->rewardBadge->description,
                    'icon' => $path->rewardBadge->icon,
                ] : null,
                'total_stages' => $totalStages,
                'completed_stages' => $completedStages,
                'total_challenges' => $totalChallenges,
                'completed_challenges' => $completedChallenges,
                'progress_percentage' => $percentage,
                'is_completed' => $isPathCompleted,
                'is_reward_claimed' => isset($userPathCompletionsMap[$path->id]) && $userPathCompletionsMap[$path->id]->reward_claimed,
            ];
        });

        return [
            'paths' => $formattedPaths,
            'daily_missions' => $this->getDailyMissions($user),
            'progression' => $this->getProgressionDashboard($user),
        ];
    }

    /**
     * Get details for a specific quest path, including stages, prerequisites, and challenge nodes.
     */
    public function getPathDetail(string $slug, ?User $user): ?array
    {
        $path = QuestPath::where('slug', $slug)
            ->where('is_published', true)
            ->with(['stages.challenges', 'stages.prerequisite', 'stages.rewardBadge', 'rewardBadge'])
            ->first();

        if (!$path) {
            return null;
        }

        $solvedChallengeIds = [];
        $userStageProgressMap = [];

        if ($user) {
            $solvedChallengeIds = UserChallengeProgress::where('user_id', $user->id)
                ->whereNotNull('solved_at')
                ->pluck('challenge_id')
                ->flip()
                ->toArray();

            $userStageProgressMap = UserQuestProgress::where('user_id', $user->id)
                ->get()
                ->keyBy('quest_stage_id');
        }

        // Determine stages completion status in sequence
        $stageCompletionStatus = [];
        $stages = $path->stages->sortBy('position')->values();

        $formattedStages = [];
        foreach ($stages as $index => $stage) {
            $stageChallenges = $stage->challenges->sortBy('pivot.position')->values();
            $totalChallengesInStage = $stageChallenges->count();
            $solvedInStage = 0;

            $challengesList = $stageChallenges->map(function ($ch) use ($solvedChallengeIds, &$solvedInStage) {
                $isSolved = isset($solvedChallengeIds[$ch->id]);
                if ($isSolved) {
                    $solvedInStage++;
                }

                return [
                    'id' => $ch->id,
                    'title' => $ch->title,
                    'slug' => $ch->slug,
                    'category' => $ch->category,
                    'difficulty' => $ch->difficulty,
                    'type' => $ch->type,
                    'is_solved' => $isSolved,
                ];
            });

            // Prerequisite evaluation
            $hasPrereq = (bool) $stage->prerequisite_stage_id;
            $prereqMet = true;

            if ($hasPrereq) {
                $prereqMet = !empty($stageCompletionStatus[$stage->prerequisite_stage_id]);
            }

            // Determine status
            $status = 'locked';
            $isCompleted = ($totalChallengesInStage > 0 && $solvedInStage >= $totalChallengesInStage);

            if ($isCompleted) {
                $status = 'completed';
                $stageCompletionStatus[$stage->id] = true;
            } elseif ($prereqMet) {
                $status = ($solvedInStage > 0) ? 'in_progress' : 'available';
                $stageCompletionStatus[$stage->id] = false;
            } else {
                $status = 'locked';
                $stageCompletionStatus[$stage->id] = false;
            }

            // For guests, show first stage as available and subsequent with locked indicator
            if (!$user) {
                $status = ($index === 0) ? 'available' : 'locked';
            }

            $userProgressRecord = $user ? ($userStageProgressMap[$stage->id] ?? null) : null;
            $rewardClaimed = $userProgressRecord ? (bool) $userProgressRecord->reward_claimed : false;
            $canClaimReward = ($user !== null && $isCompleted && !$rewardClaimed);

            // Sync UserQuestProgress state if user is logged in
            if ($user && $userProgressRecord === null && ($status !== 'locked')) {
                UserQuestProgress::create([
                    'user_id' => $user->id,
                    'quest_stage_id' => $stage->id,
                    'status' => $status,
                    'reward_claimed' => false,
                    'completed_at' => $isCompleted ? now() : null,
                ]);
            } elseif ($user && $userProgressRecord) {
                if ($userProgressRecord->status !== $status || ($isCompleted && !$userProgressRecord->completed_at)) {
                    $userProgressRecord->status = $status;
                    if ($isCompleted && !$userProgressRecord->completed_at) {
                        $userProgressRecord->completed_at = now();
                    }
                    $userProgressRecord->save();
                }
            }

            $formattedStages[] = [
                'id' => $stage->id,
                'slug' => $stage->slug,
                'title' => $stage->title,
                'description' => $stage->description,
                'position' => $stage->position,
                'reward_xp' => $stage->reward_xp,
                'reward_badge' => $stage->rewardBadge ? [
                    'id' => $stage->rewardBadge->id,
                    'name' => $stage->rewardBadge->name,
                    'slug' => $stage->rewardBadge->slug,
                    'icon' => $stage->rewardBadge->icon,
                ] : null,
                'status' => $status,
                'prerequisite' => $stage->prerequisite ? [
                    'id' => $stage->prerequisite->id,
                    'slug' => $stage->prerequisite->slug,
                    'title' => $stage->prerequisite->title,
                    'is_met' => $prereqMet,
                ] : null,
                'total_challenges' => $totalChallengesInStage,
                'solved_challenges' => $solvedInStage,
                'is_completed' => $isCompleted,
                'reward_claimed' => $rewardClaimed,
                'can_claim_reward' => $canClaimReward,
                'challenges' => $challengesList,
            ];
        }

        $allStagesCompleted = count($formattedStages) > 0 && collect($formattedStages)->every(fn($s) => $s['is_completed']);
        $pathCompletionRecord = $user ? UserQuestPathCompletion::where('user_id', $user->id)->where('quest_path_id', $path->id)->first() : null;

        return [
            'id' => $path->id,
            'slug' => $path->slug,
            'title' => $path->title,
            'description' => $path->description,
            'category' => $path->category,
            'icon' => $path->icon,
            'difficulty' => $path->difficulty,
            'estimated_hours' => $path->estimated_hours,
            'position' => $path->position,
            'reward_xp' => $path->reward_xp,
            'reward_badge' => $path->rewardBadge ? [
                'id' => $path->rewardBadge->id,
                'name' => $path->rewardBadge->name,
                'slug' => $path->rewardBadge->slug,
                'description' => $path->rewardBadge->description,
                'icon' => $path->rewardBadge->icon,
            ] : null,
            'stages' => $formattedStages,
            'is_all_completed' => $allStagesCompleted,
            'is_reward_claimed' => $pathCompletionRecord ? (bool) $pathCompletionRecord->reward_claimed : false,
            'can_claim_path_reward' => ($user !== null && $allStagesCompleted && (!$pathCompletionRecord || !$pathCompletionRecord->reward_claimed)),
        ];
    }

    /**
     * Claim reward for completing a stage.
     * Prevents duplicate XP rewards and enforces prerequisites on the server.
     */
    public function claimStageReward(QuestStage $stage, User $user): array
    {
        return DB::transaction(function () use ($stage, $user) {
            $stage->load(['challenges', 'path', 'prerequisite']);

            // 1. Verify prerequisite
            if ($stage->prerequisite_stage_id) {
                $prereqStage = $stage->prerequisite;
                $prereqChallengesCount = $prereqStage->challenges()->count();
                $prereqSolvedCount = UserChallengeProgress::where('user_id', $user->id)
                    ->whereIn('challenge_id', $prereqStage->challenges()->pluck('challenges.id'))
                    ->whereNotNull('solved_at')
                    ->count();

                if ($prereqChallengesCount === 0 || $prereqSolvedCount < $prereqChallengesCount) {
                    abort(422, 'Prerequisite stage must be completed before claiming this stage reward.');
                }
            }

            // 2. Verify all challenges in this stage are solved
            $stageChallenges = $stage->challenges;
            $requiredChallengeIds = $stageChallenges->pluck('id');
            $solvedCount = UserChallengeProgress::where('user_id', $user->id)
                ->whereIn('challenge_id', $requiredChallengeIds)
                ->whereNotNull('solved_at')
                ->count();

            if ($stageChallenges->count() === 0 || $solvedCount < $stageChallenges->count()) {
                abort(422, 'All challenges in this stage must be solved to claim the reward.');
            }

            // 3. Prevent duplicate claim
            $progress = UserQuestProgress::firstOrCreate(
                ['user_id' => $user->id, 'quest_stage_id' => $stage->id],
                ['status' => 'completed', 'reward_claimed' => false]
            );

            if ($progress->reward_claimed) {
                abort(422, 'Reward for this stage has already been claimed.');
            }

            // Award Stage XP
            $stageXp = $stage->reward_xp;
            $user->increment('xp', $stageXp);

            $progress->status = 'completed';
            $progress->reward_claimed = true;
            $progress->completed_at = $progress->completed_at ?? now();
            $progress->save();

            $newBadges = [];

            // If stage has a specific badge reward
            if ($stage->reward_badge_id) {
                if (!$user->badges()->where('badges.id', $stage->reward_badge_id)->exists()) {
                    $user->badges()->attach($stage->reward_badge_id, ['earned_at' => now()]);
                    $badge = Badge::find($stage->reward_badge_id);
                    if ($badge) {
                        $newBadges[] = $badge;
                    }
                }
            }

            // 4. Check if whole Path is completed
            $path = $stage->path;
            $allStages = $path->stages()->with('challenges')->get();
            $pathFullyCompleted = true;

            foreach ($allStages as $s) {
                $cIds = $s->challenges->pluck('id');
                $cSolved = UserChallengeProgress::where('user_id', $user->id)
                    ->whereIn('challenge_id', $cIds)
                    ->whereNotNull('solved_at')
                    ->count();
                if ($cIds->count() === 0 || $cSolved < $cIds->count()) {
                    $pathFullyCompleted = false;
                    break;
                }
            }

            $pathRewardGranted = false;
            $pathXpAwarded = 0;

            if ($pathFullyCompleted) {
                $pathCompletion = UserQuestPathCompletion::firstOrCreate(
                    ['user_id' => $user->id, 'quest_path_id' => $path->id],
                    ['reward_claimed' => false, 'completed_at' => now()]
                );

                if (!$pathCompletion->reward_claimed) {
                    $pathXpAwarded = $path->reward_xp;
                    $user->increment('xp', $pathXpAwarded);
                    $pathCompletion->reward_claimed = true;
                    $pathCompletion->save();
                    $pathRewardGranted = true;

                    // Award path badge if present
                    if ($path->reward_badge_id) {
                        if (!$user->badges()->where('badges.id', $path->reward_badge_id)->exists()) {
                            $user->badges()->attach($path->reward_badge_id, ['earned_at' => now()]);
                            $pBadge = Badge::find($path->reward_badge_id);
                            if ($pBadge) {
                                $newBadges[] = $pBadge;
                            }
                        }
                    }

                    // Check if ALL 5 quest paths are completed -> Quest Master
                    $totalPublishedPaths = QuestPath::where('is_published', true)->count();
                    $userCompletedPaths = UserQuestPathCompletion::where('user_id', $user->id)
                        ->where('reward_claimed', true)
                        ->count();

                    if ($userCompletedPaths >= $totalPublishedPaths) {
                        $masterBadge = Badge::where('rule_key', 'quest_all_complete')->first();
                        if ($masterBadge && !$user->badges()->where('badges.id', $masterBadge->id)->exists()) {
                            $user->badges()->attach($masterBadge->id, ['earned_at' => now()]);
                            $newBadges[] = $masterBadge;
                        }
                    }
                }
            }

            // Update daily mission progress if applicable
            $this->incrementDailyMissionProgress($user, 'complete_quest_stage', 1);

            Notification::create([
                'user_id' => $user->id,
                'type' => 'achievement',
                'title' => '🌟 Quest Stage Conquered!',
                'message' => "You completed '{$stage->title}' and earned +{$stageXp} XP!",
                'data' => [
                    'stage_id' => $stage->id,
                    'stage_title' => $stage->title,
                    'xp' => $stageXp,
                ],
            ]);

            $user->refresh();

            return [
                'success' => true,
                'message' => "Stage reward claimed! +{$stageXp} XP awarded.",
                'stage_xp_awarded' => $stageXp,
                'path_xp_awarded' => $pathXpAwarded,
                'total_xp_awarded' => $stageXp + $pathXpAwarded,
                'user_xp' => $user->xp,
                'user_level' => $user->calculateLevel(),
                'path_completed' => $pathFullyCompleted,
                'new_badges' => $newBadges,
            ];
        });
    }

    /**
     * Get or initialize today's daily missions for user.
     */
    public function getDailyMissions(?User $user): array
    {
        $today = Carbon::today()->toDateString();

        $defaultMissions = [
            [
                'mission_type' => 'solve_any_challenge',
                'title' => 'Daily Warmup',
                'description' => 'Solve at least 1 coding or quiz challenge today.',
                'target_count' => 1,
                'reward_xp' => 30,
            ],
            [
                'mission_type' => 'solve_quest_challenge',
                'title' => 'Quest Path Explorer',
                'description' => 'Conquer a challenge belonging to any active Quest Path.',
                'target_count' => 1,
                'reward_xp' => 40,
            ],
            [
                'mission_type' => 'earn_xp',
                'title' => 'XP Vanguard',
                'description' => 'Earn 100 or more XP from challenges and quests today.',
                'target_count' => 100,
                'reward_xp' => 50,
            ],
        ];

        if (!$user) {
            return array_map(function ($m) {
                return array_merge($m, [
                    'id' => null,
                    'current_count' => 0,
                    'is_completed' => false,
                    'reward_claimed' => false,
                    'can_claim' => false,
                ]);
            }, $defaultMissions);
        }

        // Dynamically compute real daily counts
        $todaySolves = UserChallengeProgress::where('user_id', $user->id)
            ->whereDate('solved_at', $today)
            ->count();

        // Quest challenges solved today
        $questChallengeIds = DB::table('quest_stage_challenges')->pluck('challenge_id')->toArray();
        $todayQuestSolves = UserChallengeProgress::where('user_id', $user->id)
            ->whereIn('challenge_id', $questChallengeIds)
            ->whereDate('solved_at', $today)
            ->count();

        // Today XP earned estimate from progress solved today + stage claims today
        $stageXpToday = UserQuestProgress::where('user_id', $user->id)
            ->where('reward_claimed', true)
            ->whereDate('completed_at', $today)
            ->join('quest_stages', 'user_quest_progress.quest_stage_id', '=', 'quest_stages.id')
            ->sum('quest_stages.reward_xp');

        $challengesXpToday = $todaySolves * 50; // standard approx
        $totalXpToday = $stageXpToday + $challengesXpToday;

        $missions = [];
        foreach ($defaultMissions as $def) {
            $record = UserDailyMissionProgress::firstOrCreate(
                [
                    'user_id' => $user->id,
                    'mission_date' => $today,
                    'mission_type' => $def['mission_type'],
                ],
                [
                    'title' => $def['title'],
                    'description' => $def['description'],
                    'target_count' => $def['target_count'],
                    'current_count' => 0,
                    'reward_xp' => $def['reward_xp'],
                    'is_completed' => false,
                    'reward_claimed' => false,
                ]
            );

            // Update real dynamic progress
            $actualCount = match ($def['mission_type']) {
                'solve_any_challenge' => $todaySolves,
                'solve_quest_challenge' => $todayQuestSolves,
                'earn_xp' => (int) $totalXpToday,
                default => $record->current_count,
            };

            if ($actualCount > $record->current_count) {
                $record->current_count = min($actualCount, $record->target_count);
            }

            if ($record->current_count >= $record->target_count && !$record->is_completed) {
                $record->is_completed = true;
            }

            $record->save();

            $missions[] = [
                'id' => $record->id,
                'mission_type' => $record->mission_type,
                'title' => $record->title,
                'description' => $record->description,
                'target_count' => $record->target_count,
                'current_count' => $record->current_count,
                'reward_xp' => $record->reward_xp,
                'is_completed' => (bool) $record->is_completed,
                'reward_claimed' => (bool) $record->reward_claimed,
                'can_claim' => ($record->is_completed && !$record->reward_claimed),
            ];
        }

        return $missions;
    }

    /**
     * Claim daily mission XP reward.
     */
    public function claimDailyMission(int $missionId, User $user): array
    {
        return DB::transaction(function () use ($missionId, $user) {
            $mission = UserDailyMissionProgress::where('id', $missionId)
                ->where('user_id', $user->id)
                ->firstOrFail();

            if (!$mission->is_completed) {
                abort(422, 'Daily mission objectives have not been completed yet.');
            }

            if ($mission->reward_claimed) {
                abort(422, 'Mission reward has already been claimed.');
            }

            $mission->reward_claimed = true;
            $mission->save();

            $user->increment('xp', $mission->reward_xp);
            $user->refresh();

            Notification::create([
                'user_id' => $user->id,
                'type' => 'daily',
                'title' => '🎯 Daily Mission Reward Claimed!',
                'message' => "You completed '{$mission->title}' and received +{$mission->reward_xp} XP!",
                'data' => [
                    'mission_id' => $mission->id,
                    'xp' => $mission->reward_xp,
                ],
            ]);

            return [
                'success' => true,
                'message' => "+{$mission->reward_xp} XP added for completing '{$mission->title}'.",
                'xp_awarded' => $mission->reward_xp,
                'user_xp' => $user->xp,
                'user_level' => $user->calculateLevel(),
            ];
        });
    }

    /**
     * Increment progress for a daily mission type atomically.
     */
    public function incrementDailyMissionProgress(User $user, string $type, int $amount = 1): void
    {
        $today = Carbon::today()->toDateString();
        $record = UserDailyMissionProgress::where('user_id', $user->id)
            ->where('mission_date', $today)
            ->where('mission_type', $type)
            ->first();

        if ($record && !$record->reward_claimed) {
            $record->current_count = min($record->current_count + $amount, $record->target_count);
            if ($record->current_count >= $record->target_count) {
                $record->is_completed = true;
            }
            $record->save();
        }
    }

    /**
     * Compute personal progression dashboard with deterministic recommendation.
     */
    public function getProgressionDashboard(?User $user): ?array
    {
        if (!$user) {
            return null;
        }

        $allPaths = QuestPath::where('is_published', true)->with('stages.challenges')->get();
        $totalPaths = $allPaths->count();
        $totalStages = 0;

        foreach ($allPaths as $p) {
            $totalStages += $p->stages->count();
        }

        $completedStagesCount = UserQuestProgress::where('user_id', $user->id)
            ->where('status', 'completed')
            ->count();

        $completedPathsCount = UserQuestPathCompletion::where('user_id', $user->id)
            ->where('reward_claimed', true)
            ->count();

        // Skills practiced from solved challenges
        $solvedChallenges = Challenge::join('user_challenge_progress', 'challenges.id', '=', 'user_challenge_progress.challenge_id')
            ->where('user_challenge_progress.user_id', $user->id)
            ->whereNotNull('user_challenge_progress.solved_at')
            ->select('challenges.category', DB::raw('count(*) as count'))
            ->groupBy('challenges.category')
            ->orderByDesc('count')
            ->get();

        $skillsPracticed = $solvedChallenges->map(function ($item) {
            return [
                'skill' => ucfirst($item->category),
                'count' => (int) $item->count,
            ];
        });

        // Deterministic Next Recommended Challenge
        $nextRecommendation = $this->determineNextRecommendedChallenge($user, $allPaths);

        return [
            'total_paths' => $totalPaths,
            'completed_paths' => $completedPathsCount,
            'total_stages' => $totalStages,
            'completed_stages' => $completedStagesCount,
            'skills_practiced' => $skillsPracticed,
            'next_recommended_challenge' => $nextRecommendation,
        ];
    }

    /**
     * Deterministic recommendation algorithm:
     * 1. Finds the user's current active quest stage (first unlocked, uncompleted stage).
     * 2. Recommends the first unsolved challenge in that stage.
     * 3. Fallback: If all quest stages completed or none available, recommend the least practiced category's lowest unsolved challenge.
     */
    protected function determineNextRecommendedChallenge(User $user, $allPaths): ?array
    {
        $solvedChallengeIds = UserChallengeProgress::where('user_id', $user->id)
            ->whereNotNull('solved_at')
            ->pluck('challenge_id')
            ->flip()
            ->toArray();

        // 1. Scan paths in order
        foreach ($allPaths as $path) {
            $stages = $path->stages->sortBy('position');
            foreach ($stages as $stage) {
                // Check if prereq is met
                if ($stage->prerequisite_stage_id) {
                    $prereqStage = $stage->prerequisite;
                    if ($prereqStage) {
                        $pSolved = UserChallengeProgress::where('user_id', $user->id)
                            ->whereIn('challenge_id', $prereqStage->challenges->pluck('id'))
                            ->whereNotNull('solved_at')
                            ->count();
                        if ($pSolved < $prereqStage->challenges->count()) {
                            continue; // locked, move on
                        }
                    }
                }

                // Check for first unsolved challenge
                foreach ($stage->challenges->sortBy('pivot.position') as $challenge) {
                    if (!isset($solvedChallengeIds[$challenge->id])) {
                        return [
                            'id' => $challenge->id,
                            'title' => $challenge->title,
                            'slug' => $challenge->slug,
                            'category' => $challenge->category,
                            'difficulty' => $challenge->difficulty,
                            'type' => $challenge->type,
                            'reason' => "Next step in {$path->title} ({$stage->title})",
                            'path_title' => $path->title,
                            'stage_title' => $stage->title,
                        ];
                    }
                }
            }
        }

        // 2. Fallback: Find lowest unsolved challenge in user's least practiced category
        $practicedCategories = UserChallengeProgress::where('user_id', $user->id)
            ->whereNotNull('solved_at')
            ->join('challenges', 'user_challenge_progress.challenge_id', '=', 'challenges.id')
            ->select('challenges.category', DB::raw('count(*) as solves'))
            ->groupBy('challenges.category')
            ->pluck('solves', 'challenges.category')
            ->toArray();

        $allCategories = Challenge::distinct()->pluck('category')->toArray();
        $minSolves = 999999;
        $targetCategory = $allCategories[0] ?? 'algorithms';

        foreach ($allCategories as $cat) {
            $count = $practicedCategories[$cat] ?? 0;
            if ($count < $minSolves) {
                $minSolves = $count;
                $targetCategory = $cat;
            }
        }

        $fallbackChallenge = Challenge::where('category', $targetCategory)
            ->whereNotIn('id', array_keys($solvedChallengeIds))
            ->orderByRaw("CASE difficulty WHEN 'Beginner' THEN 1 WHEN 'Easy' THEN 2 WHEN 'Medium' THEN 3 WHEN 'Hard' THEN 4 WHEN 'Expert' THEN 5 END ASC")
            ->first();

        if ($fallbackChallenge) {
            return [
                'id' => $fallbackChallenge->id,
                'title' => $fallbackChallenge->title,
                'slug' => $fallbackChallenge->slug,
                'category' => $fallbackChallenge->category,
                'difficulty' => $fallbackChallenge->difficulty,
                'type' => $fallbackChallenge->type,
                'reason' => "Expand your skills in {$targetCategory}",
                'path_title' => 'Independent Mastery',
                'stage_title' => 'Skill Expansion',
            ];
        }

        return null;
    }
}
