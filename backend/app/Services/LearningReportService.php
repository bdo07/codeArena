<?php

namespace App\Services;

use App\Models\Challenge;
use App\Models\InterviewSession;
use App\Models\Submission;
use App\Models\User;
use App\Models\UserChallengeProgress;
use App\Models\UserGitPlaygroundProgress;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class LearningReportService
{
    /**
     * Generate comprehensive learning analytics report for a user.
     */
    public function generateReport(User $user, array $params = []): array
    {
        $range = $params['range'] ?? '30d';
        $now = Carbon::now();

        // Calculate date range bounds
        $startDate = match ($range) {
            '7d' => $now->copy()->subDays(7)->startOfDay(),
            '30d' => $now->copy()->subDays(30)->startOfDay(),
            '90d' => $now->copy()->subDays(90)->startOfDay(),
            'all' => Carbon::createFromTimestamp(0),
            'custom' => !empty($params['start_date'])
                ? Carbon::parse($params['start_date'])->startOfDay()
                : $now->copy()->subDays(30)->startOfDay(),
            default => $now->copy()->subDays(30)->startOfDay(),
        };

        $endDate = (!empty($params['end_date']) && $range === 'custom')
            ? Carbon::parse($params['end_date'])->endOfDay()
            : $now->copy()->endOfDay();

        // 1. Challenges attempted & solved in range
        $challengeProgressQuery = UserChallengeProgress::where('user_id', $user->id);
        if ($range !== 'all') {
            $challengeProgressQuery->whereBetween('updated_at', [$startDate, $endDate]);
        }
        $challengeProgress = $challengeProgressQuery->with('challenge')->get();

        $allTimeProgress = UserChallengeProgress::where('user_id', $user->id)->get();
        $allTimeSolvedCount = $allTimeProgress->whereNotNull('solved_at')->count();
        $allTimeAttemptedCount = $allTimeProgress->count();

        $rangeSolvedCount = $challengeProgress->whereNotNull('solved_at')->count();
        $rangeAttemptedCount = $challengeProgress->count();

        // 2. Submissions analysis in range
        $submissionsQuery = Submission::where('user_id', $user->id);
        if ($range !== 'all') {
            $submissionsQuery->whereBetween('created_at', [$startDate, $endDate]);
        }
        $submissions = $submissionsQuery->get();

        $totalSubmissions = $submissions->count();
        $acceptedSubmissions = $submissions->filter(fn($s) => in_array(strtolower((string)$s->status), ['accepted', 'pass']))->count();
        $accuracyRate = $totalSubmissions > 0
            ? (int) round(($acceptedSubmissions / $totalSubmissions) * 100)
            : 0;

        $completionRate = $rangeAttemptedCount > 0
            ? (int) round(($rangeSolvedCount / $rangeAttemptedCount) * 100)
            : ($allTimeAttemptedCount > 0 ? (int) round(($allTimeSolvedCount / $allTimeAttemptedCount) * 100) : 0);

        // 3. Active days count (distinct dates where user made a submission, played git, or completed an interview)
        $activeSubmissionDates = Submission::where('user_id', $user->id)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->selectRaw('DATE(created_at) as day')
            ->distinct()
            ->pluck('day')
            ->toArray();

        $activeInterviewDates = InterviewSession::where('user_id', $user->id)
            ->whereBetween('started_at', [$startDate, $endDate])
            ->selectRaw('DATE(started_at) as day')
            ->distinct()
            ->pluck('day')
            ->toArray();

        $activeGitDates = UserGitPlaygroundProgress::where('user_id', $user->id)
            ->whereBetween('completed_at', [$startDate, $endDate])
            ->selectRaw('DATE(completed_at) as day')
            ->distinct()
            ->pluck('day')
            ->toArray();

        $allActiveDays = array_unique(array_merge($activeSubmissionDates, $activeInterviewDates, $activeGitDates));
        $activeDaysCount = count($allActiveDays);

        // Streak info
        $streak = $user->streak;
        $currentStreak = $streak?->current_streak ?? 0;
        $bestStreak = $streak?->longest_streak ?? 0;

        // 4. Git Playground stats
        $gitProgress = UserGitPlaygroundProgress::where('user_id', $user->id)->get();
        $gitScenariosCompleted = $gitProgress->count();
        $gitCommandsCount = (int) $gitProgress->sum('commands_count');
        $gitXpEarned = (int) $gitProgress->sum('xp_awarded');

        // 5. Mock Interview stats
        $interviewQuery = InterviewSession::where('user_id', $user->id)
            ->where('status', 'completed');
        if ($range !== 'all') {
            $interviewQuery->whereBetween('completed_at', [$startDate, $endDate]);
        }
        $interviews = $interviewQuery->get();

        $interviewsCompleted = $interviews->count();
        $interviewsPassed = $interviews->where('passed', true)->count();
        $interviewPassRate = $interviewsCompleted > 0
            ? (int) round(($interviewsPassed / $interviewsCompleted) * 100)
            : 0;
        $interviewAvgScore = $interviewsCompleted > 0
            ? (int) round($interviews->avg('score'))
            : 0;

        // 6. Activity Timeline over time (grouped by day for recharts)
        $timelineData = [];
        $daysCount = $range === '7d' ? 7 : ($range === '90d' ? 90 : 30);
        if ($range === 'all') {
            $daysCount = 30; // Last 30 days window for timeline chart in all-time mode
        }

        for ($i = $daysCount - 1; $i >= 0; $i--) {
            $targetDate = $now->copy()->subDays($i)->format('Y-m-d');
            $timelineData[$targetDate] = [
                'date' => $targetDate,
                'submissions' => 0,
                'accepted' => 0,
                'interviews' => 0,
                'git_completed' => 0,
            ];
        }

        foreach ($submissions as $sub) {
            $dayKey = $sub->created_at->format('Y-m-d');
            if (isset($timelineData[$dayKey])) {
                $timelineData[$dayKey]['submissions']++;
                if (in_array(strtolower((string)$sub->status), ['accepted', 'pass'])) {
                    $timelineData[$dayKey]['accepted']++;
                }
            }
        }

        foreach ($interviews as $inv) {
            $dayKey = $inv->completed_at ? $inv->completed_at->format('Y-m-d') : null;
            if ($dayKey && isset($timelineData[$dayKey])) {
                $timelineData[$dayKey]['interviews']++;
            }
        }

        foreach ($gitProgress as $gp) {
            $dayKey = $gp->completed_at ? $gp->completed_at->format('Y-m-d') : null;
            if ($dayKey && isset($timelineData[$dayKey])) {
                $timelineData[$dayKey]['git_completed']++;
            }
        }

        $activityTimeline = array_values($timelineData);

        // 7. Topic & Skill Performance Breakdown
        // Aggregate all user progress by challenge category
        $categoryStats = [];
        $allProgressWithChallenge = UserChallengeProgress::where('user_id', $user->id)
            ->with('challenge')
            ->get();

        foreach ($allProgressWithChallenge as $prog) {
            $ch = $prog->challenge;
            if (!$ch) continue;

            $cat = ucfirst($ch->category ?: 'General');
            if (!isset($categoryStats[$cat])) {
                $categoryStats[$cat] = [
                    'category' => $cat,
                    'attempted' => 0,
                    'solved' => 0,
                ];
            }
            $categoryStats[$cat]['attempted'] += max(1, $prog->attempts_count);
            if ($prog->solved_at !== null) {
                $categoryStats[$cat]['solved']++;
            }
        }

        // Add percentages and sort
        $skillBreakdown = [];
        foreach ($categoryStats as $cat => $data) {
            $mastery = $data['attempted'] > 0
                ? (int) round(($data['solved'] / $data['attempted']) * 100)
                : 0;
            $skillBreakdown[] = [
                'category' => $cat,
                'attempted' => $data['attempted'],
                'solved' => $data['solved'],
                'mastery_percentage' => min(100, $mastery),
            ];
        }

        usort($skillBreakdown, fn($a, $b) => $b['solved'] <=> $a['solved']);

        // Strongest vs Topics Needing Practice
        $strongestTopics = array_slice(array_filter($skillBreakdown, fn($s) => $s['solved'] > 0), 0, 3);
        $needingPractice = array_slice(
            array_filter($skillBreakdown, fn($s) => $s['mastery_percentage'] < 75 || ($s['attempted'] > $s['solved'])),
            0,
            3
        );

        // 8. Deterministic Challenge Recommendations
        // Find real challenges not yet solved by user in topics needing practice (or top categories)
        $solvedChallengeIds = UserChallengeProgress::where('user_id', $user->id)
            ->whereNotNull('solved_at')
            ->pluck('challenge_id')
            ->toArray();

        $recommendedQuery = Challenge::where('is_published', true)
            ->whereNotIn('id', $solvedChallengeIds);

        if (!empty($needingPractice)) {
            $targetCats = array_map('strtolower', array_column($needingPractice, 'category'));
            $recommendedQuery->where(function ($q) use ($targetCats) {
                foreach ($targetCats as $cat) {
                    $q->orWhere('category', 'like', "%{$cat}%");
                }
            });
        }

        $recommendedChallenges = $recommendedQuery->inRandomOrder()->limit(3)->get()->map(function ($ch) {
            return [
                'id' => $ch->id,
                'title' => $ch->title,
                'slug' => $ch->slug,
                'difficulty' => $ch->difficulty,
                'category' => $ch->category,
                'xp_reward' => $ch->xp_reward,
                'description' => substr(strip_tags($ch->description), 0, 120) . '...',
            ];
        });

        // 9. Recent Badges & Achievements
        $badges = $user->badges()
            ->orderBy('pivot_earned_at', 'desc')
            ->limit(6)
            ->get()
            ->map(fn($b) => [
                'id' => $b->id,
                'name' => $b->name,
                'description' => $b->description,
                'icon' => $b->icon,
                'earned_at' => $b->pivot->earned_at,
            ]);

        // 10. Metric Explanations & Methodology
        $methodology = [
            'completion_rate' => 'Percentage of unique challenges successfully solved out of all challenges attempted in this timeframe.',
            'accuracy_rate' => 'Percentage of test-suite accepted code submissions out of all submissions sent to the evaluation engine.',
            'active_days' => 'Calendar days (UTC) with at least one recorded code submission, completed Git mission, or Mock Interview session.',
            'mastery_percentage' => 'Calculated per skill category based on the ratio of solved challenges to total attempts recorded.',
            'interview_pass_rate' => 'Percentage of timed technical mock interviews evaluated with a final score of 70% or higher.',
        ];

        return [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'avatar_url' => $user->avatar_url,
                'xp' => $user->xp,
                'level' => $user->level,
                'created_at' => $user->created_at?->toIso8601String(),
            ],
            'range' => $range,
            'start_date' => $startDate->toDateString(),
            'end_date' => $endDate->toDateString(),
            'overview' => [
                'challenges_attempted' => $rangeAttemptedCount,
                'challenges_solved' => $rangeSolvedCount,
                'completion_rate' => $completionRate,
                'all_time_solved' => $allTimeSolvedCount,
                'total_submissions' => $totalSubmissions,
                'accepted_submissions' => $acceptedSubmissions,
                'accuracy_rate' => $accuracyRate,
                'active_days_count' => $activeDaysCount,
                'current_streak' => $currentStreak,
                'best_streak' => $bestStreak,
            ],
            'git_playground' => [
                'scenarios_completed' => $gitScenariosCompleted,
                'total_scenarios' => 10,
                'commands_executed' => $gitCommandsCount,
                'xp_earned' => $gitXpEarned,
            ],
            'interview' => [
                'sessions_completed' => $interviewsCompleted,
                'sessions_passed' => $interviewsPassed,
                'pass_rate' => $interviewPassRate,
                'average_score' => $interviewAvgScore,
            ],
            'activity_timeline' => $activityTimeline,
            'skill_breakdown' => $skillBreakdown,
            'strongest_topics' => $strongestTopics,
            'topics_needing_practice' => $needingPractice,
            'recommended_challenges' => $recommendedChallenges,
            'recent_badges' => $badges,
            'methodology' => $methodology,
        ];
    }
}
