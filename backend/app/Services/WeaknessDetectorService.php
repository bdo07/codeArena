<?php

namespace App\Services;

use App\Models\Challenge;
use App\Models\Submission;
use App\Models\User;
use App\Models\UserChallengeProgress;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;

class WeaknessDetectorService
{
    /**
     * Minimum submissions required to classify a topic with statistical confidence.
     */
    public const CONFIDENCE_THRESHOLD = 3;

    /**
     * Cache TTL in seconds (1 hour).
     */
    public const CACHE_TTL_SECONDS = 3600;

    /**
     * Detect user weaknesses, strengths, trends, and targeted recommendations.
     */
    public function detectWeaknesses(User $user, bool $forceFresh = false): array
    {
        $cacheKey = "user_weakness_insights_{$user->id}";

        if (!$forceFresh && Cache::has($cacheKey)) {
            $cached = Cache::get($cacheKey);
            if (is_array($cached)) {
                return $cached;
            }
        }

        // 1. Fetch all user submissions with challenge and associated tags
        $submissions = Submission::where('user_id', $user->id)
            ->with(['challenge.tags'])
            ->orderBy('created_at', 'asc')
            ->get();

        // 2. Fetch user challenge progress records
        $progressRecords = UserChallengeProgress::where('user_id', $user->id)->get()->keyBy('challenge_id');
        $solvedChallengeIds = $progressRecords->whereNotNull('solved_at')->keys()->toArray();

        $totalSubmissionsCount = $submissions->count();
        $totalChallengesSolvedCount = count($solvedChallengeIds);

        // 3. Check for onboarding state (< 3 submissions overall)
        if ($totalSubmissionsCount < self::CONFIDENCE_THRESHOLD) {
            $starterRecommendations = $this->getStarterRecommendations($solvedChallengeIds);

            $result = [
                'is_onboarding' => true,
                'onboarding' => [
                    'message' => 'Complete at least 3 coding submissions across different topics to unlock your personalized weakness diagnosis and skill recommendations.',
                    'current_submissions' => $totalSubmissionsCount,
                    'required_submissions' => self::CONFIDENCE_THRESHOLD,
                    'progress_percentage' => (int) round(($totalSubmissionsCount / self::CONFIDENCE_THRESHOLD) * 100),
                ],
                'summary' => [
                    'total_submissions' => $totalSubmissionsCount,
                    'total_challenges_solved' => $totalChallengesSolvedCount,
                    'overall_accuracy' => 0,
                    'weaknesses_count' => 0,
                    'strengths_count' => 0,
                    'insufficient_data_count' => 0,
                ],
                'weaknesses' => [],
                'strengths' => [],
                'insufficient_data' => [],
                'recommendations' => $starterRecommendations,
                'progress_timeline' => [],
            ];

            Cache::put($cacheKey, $result, self::CACHE_TTL_SECONDS);
            return $result;
        }

        // 4. Group submissions by topic (tags and categories)
        $topicStats = [];

        foreach ($submissions as $sub) {
            $challenge = $sub->challenge;
            if (!$challenge) {
                continue;
            }

            $topicsForSub = [];

            // Add challenge category
            if (!empty($challenge->category)) {
                $catName = ucfirst(trim($challenge->category));
                $topicsForSub["cat:{$catName}"] = [
                    'name' => $catName,
                    'slug' => strtolower(str_replace(' ', '-', $catName)),
                    'type' => 'category',
                ];
            }

            // Add challenge tags
            if ($challenge->tags) {
                foreach ($challenge->tags as $tag) {
                    $topicsForSub["tag:{$tag->slug}"] = [
                        'name' => $tag->name,
                        'slug' => $tag->slug,
                        'type' => 'tag',
                    ];
                }
            }

            $isAccepted = in_array(strtolower((string) $sub->status), ['accepted', 'pass']);
            $statusNormalized = strtolower((string) $sub->status);

            foreach ($topicsForSub as $key => $meta) {
                if (!isset($topicStats[$key])) {
                    $topicStats[$key] = [
                        'name' => $meta['name'],
                        'slug' => $meta['slug'],
                        'type' => $meta['type'],
                        'total_attempts' => 0,
                        'accepted_attempts' => 0,
                        'failed_attempts' => 0,
                        'challenges_attempted' => [],
                        'challenges_solved' => [],
                        'error_breakdown' => [
                            'wrong_answer' => 0,
                            'time_limit_exceeded' => 0,
                            'runtime_error' => 0,
                            'compilation_error' => 0,
                            'other' => 0,
                        ],
                        'submission_history' => [],
                        'last_attempt_at' => null,
                    ];
                }

                $topicStats[$key]['total_attempts']++;
                $topicStats[$key]['challenges_attempted'][$challenge->id] = true;
                $topicStats[$key]['last_attempt_at'] = $sub->created_at?->toIso8601String();

                if ($isAccepted) {
                    $topicStats[$key]['accepted_attempts']++;
                    $topicStats[$key]['challenges_solved'][$challenge->id] = true;
                } else {
                    $topicStats[$key]['failed_attempts']++;

                    if (str_contains($statusNormalized, 'wrong answer')) {
                        $topicStats[$key]['error_breakdown']['wrong_answer']++;
                    } elseif (str_contains($statusNormalized, 'time limit')) {
                        $topicStats[$key]['error_breakdown']['time_limit_exceeded']++;
                    } elseif (str_contains($statusNormalized, 'runtime error')) {
                        $topicStats[$key]['error_breakdown']['runtime_error']++;
                    } elseif (str_contains($statusNormalized, 'compilation') || str_contains($statusNormalized, 'syntax')) {
                        $topicStats[$key]['error_breakdown']['compilation_error']++;
                    } else {
                        $topicStats[$key]['error_breakdown']['other']++;
                    }
                }

                $topicStats[$key]['submission_history'][] = [
                    'is_accepted' => $isAccepted,
                    'created_at' => $sub->created_at,
                ];
            }
        }

        // 5. Analyze and classify each topic
        $weaknesses = [];
        $strengths = [];
        $insufficientData = [];

        foreach ($topicStats as $key => $data) {
            $attempts = $data['total_attempts'];
            $accepted = $data['accepted_attempts'];
            $failed = $data['failed_attempts'];
            $successRate = $attempts > 0 ? (int) round(($accepted / $attempts) * 100) : 0;
            $uniqueAttempted = count($data['challenges_attempted']);
            $uniqueSolved = count($data['challenges_solved']);

            // Calculate dominant error
            $dominantError = $this->determineDominantError($data['error_breakdown']);

            // Calculate improvement trend
            $trendInfo = $this->calculateTrend($data['submission_history']);

            $topicObject = [
                'name' => $data['name'],
                'slug' => $data['slug'],
                'type' => $data['type'],
                'total_attempts' => $attempts,
                'accepted_attempts' => $accepted,
                'failed_attempts' => $failed,
                'unique_challenges_attempted' => $uniqueAttempted,
                'unique_challenges_solved' => $uniqueSolved,
                'success_rate' => $successRate,
                'error_breakdown' => $data['error_breakdown'],
                'dominant_error' => $dominantError,
                'trend' => $trendInfo['direction'],
                'trend_message' => $trendInfo['message'],
                'last_attempt_at' => $data['last_attempt_at'],
            ];

            // Distinction: Insufficient Data vs Verified Struggle vs Strength
            if ($attempts < self::CONFIDENCE_THRESHOLD) {
                $topicObject['status'] = 'insufficient_data';
                $topicObject['note'] = "Needs at least " . self::CONFIDENCE_THRESHOLD . " attempts for diagnostic confidence (currently {$attempts}/" . self::CONFIDENCE_THRESHOLD . ").";
                $insufficientData[] = $topicObject;
                continue;
            }

            // High or Moderate Weakness:
            // Low success rate (< 50%) OR high failure count with uncompleted challenges
            $unsolvedRatio = $uniqueAttempted > 0 ? ($uniqueAttempted - $uniqueSolved) / $uniqueAttempted : 0;

            if ($successRate < 50 || ($failed >= 3 && $unsolvedRatio >= 0.5)) {
                $severity = $successRate < 30 ? 'high' : 'moderate';
                $topicObject['status'] = 'weakness';
                $topicObject['severity'] = $severity;
                $topicObject['diagnosis'] = $this->generateDiagnosis($data['name'], $successRate, $attempts, $dominantError);
                $weaknesses[] = $topicObject;
            } elseif ($successRate >= 75 && $uniqueSolved >= 1) {
                $topicObject['status'] = 'strength';
                $topicObject['diagnosis'] = "Demonstrated solid consistency with {$successRate}% pass rate across {$attempts} submissions.";
                $strengths[] = $topicObject;
            }
        }

        // Sort weaknesses: high severity first, then lowest success rate
        usort($weaknesses, function ($a, $b) {
            if ($a['severity'] !== $b['severity']) {
                return $a['severity'] === 'high' ? -1 : 1;
            }
            return $a['success_rate'] <=> $b['success_rate'];
        });

        // Sort strengths: highest success rate, most solved
        usort($strengths, function ($a, $b) {
            return $b['success_rate'] <=> $a['success_rate'];
        });

        // 6. Generate Targeted Challenge Recommendations with Explanations
        $recommendations = $this->generateRecommendations($weaknesses, $solvedChallengeIds);

        // 7. Calculate overall accuracy
        $acceptedTotal = $submissions->filter(fn ($s) => in_array(strtolower((string) $s->status), ['accepted', 'pass']))->count();
        $overallAccuracy = $totalSubmissionsCount > 0 ? (int) round(($acceptedTotal / $totalSubmissionsCount) * 100) : 0;

        // 8. Progress over time (last 8 weeks aggregated accuracy)
        $progressTimeline = $this->calculateProgressTimeline($submissions);

        $result = [
            'is_onboarding' => false,
            'summary' => [
                'total_submissions' => $totalSubmissionsCount,
                'total_challenges_solved' => $totalChallengesSolvedCount,
                'overall_accuracy' => $overallAccuracy,
                'weaknesses_count' => count($weaknesses),
                'strengths_count' => count($strengths),
                'insufficient_data_count' => count($insufficientData),
            ],
            'weaknesses' => $weaknesses,
            'strengths' => $strengths,
            'insufficient_data' => $insufficientData,
            'recommendations' => $recommendations,
            'progress_timeline' => $progressTimeline,
        ];

        Cache::put($cacheKey, $result, self::CACHE_TTL_SECONDS);

        return $result;
    }

    /**
     * Clear cached weakness insights for a user.
     */
    public function clearCache(int $userId): void
    {
        Cache::forget("user_weakness_insights_{$userId}");
    }

    /**
     * Determine dominant error type and diagnostic insight.
     */
    protected function determineDominantError(array $errors): array
    {
        arsort($errors);
        $topError = array_key_first($errors);
        $topCount = $errors[$topError] ?? 0;

        if ($topCount === 0) {
            return [
                'type' => 'none',
                'count' => 0,
                'title' => 'No repeated errors',
                'description' => 'Submissions pass consistently.',
            ];
        }

        return match ($topError) {
            'wrong_answer' => [
                'type' => 'wrong_answer',
                'count' => $topCount,
                'title' => 'Wrong Answer',
                'description' => 'Logic discrepancies or unhandled corner cases / edge inputs.',
            ],
            'time_limit_exceeded' => [
                'type' => 'time_limit_exceeded',
                'count' => $topCount,
                'title' => 'Time Limit Exceeded',
                'description' => 'Suboptimal time complexity (e.g. O(N^2) instead of O(N log N) or O(N)).',
            ],
            'runtime_error' => [
                'type' => 'runtime_error',
                'count' => $topCount,
                'title' => 'Runtime Error',
                'description' => 'Uncaught exceptions, null pointer references, or index out of bounds.',
            ],
            'compilation_error' => [
                'type' => 'compilation_error',
                'count' => $topCount,
                'title' => 'Syntax & Compilation',
                'description' => 'Type mismatch, missing imports, or language syntax errors.',
            ],
            default => [
                'type' => 'other',
                'count' => $topCount,
                'title' => 'Execution Error',
                'description' => 'Unexpected submission failure.',
            ],
        };
    }

    /**
     * Calculate explainable improvement trend between early vs recent attempts.
     */
    protected function calculateTrend(array $history): array
    {
        $count = count($history);
        if ($count < 3) {
            return ['direction' => 'steady', 'message' => 'Not enough attempts yet to discern trend.'];
        }

        // Split into first half vs second half
        $half = (int) floor($count / 2);
        $early = array_slice($history, 0, $half);
        $recent = array_slice($history, $half);

        $earlyPassed = count(array_filter($early, fn ($h) => $h['is_accepted']));
        $earlyRate = count($early) > 0 ? ($earlyPassed / count($early)) * 100 : 0;

        $recentPassed = count(array_filter($recent, fn ($h) => $h['is_accepted']));
        $recentRate = count($recent) > 0 ? ($recentPassed / count($recent)) * 100 : 0;

        $diff = (int) round($recentRate - $earlyRate);

        if ($diff >= 15) {
            return [
                'direction' => 'improving',
                'message' => "Upward trend: pass rate improved by +{$diff}% in recent attempts.",
            ];
        }

        if ($diff <= -15) {
            return [
                'direction' => 'declining',
                'message' => "Recent attempts faced harder edge cases, showing a {$diff}% change in pass rate.",
            ];
        }

        return [
            'direction' => 'steady',
            'message' => 'Consistent performance across recent attempts.',
        ];
    }

    /**
     * Generate human-readable diagnosis text.
     */
    protected function generateDiagnosis(string $topicName, int $successRate, int $attempts, array $dominantError): string
    {
        $reason = "{$successRate}% success rate across {$attempts} attempts in {$topicName}.";
        if ($dominantError['count'] > 0) {
            $reason .= " Primary obstacle: {$dominantError['title']} ({$dominantError['count']} occurrences) — {$dominantError['description']}";
        }
        return $reason;
    }

    /**
     * Generate targeted challenge recommendations linking directly to real challenges with explainable reasons.
     */
    protected function generateRecommendations(array $weaknesses, array $solvedChallengeIds): array
    {
        $recommendations = [];
        $addedChallengeIds = [];

        // For each weakness, find unsolved published challenges in that topic
        foreach ($weaknesses as $w) {
            if (count($recommendations) >= 4) {
                break;
            }

            $query = Challenge::where('is_published', true)
                ->whereNotIn('id', array_merge($solvedChallengeIds, $addedChallengeIds));

            if ($w['type'] === 'tag') {
                $query->whereHas('tags', function ($tq) use ($w) {
                    $tq->where('slug', $w['slug']);
                });
            } else {
                $query->where('category', 'like', "%{$w['name']}%");
            }

            // Match difficulty ladder: prefer Beginner/Easy/Medium to reinforce fundamentals
            $candidate = (clone $query)->whereIn('difficulty', ['Beginner', 'Easy', 'Medium'])
                ->orderBy('xp_reward', 'asc')
                ->first();

            if (!$candidate) {
                $candidate = $query->first();
            }

            if ($candidate) {
                $addedChallengeIds[] = $candidate->id;
                $domErrorTitle = $w['dominant_error']['title'] ?? 'repeated attempts';
                $recommendations[] = [
                    'challenge' => [
                        'id' => $candidate->id,
                        'title' => $candidate->title,
                        'slug' => $candidate->slug,
                        'difficulty' => $candidate->difficulty,
                        'category' => $candidate->category,
                        'challenge_type' => $candidate->challenge_type,
                        'xp_reward' => $candidate->xp_reward,
                    ],
                    'topic' => $w['name'],
                    'severity' => $w['severity'] ?? 'moderate',
                    'reason' => "Recommended to overcome difficulties in {$w['name']}. You currently have a {$w['success_rate']}% pass rate across {$w['total_attempts']} attempts with frequent {$domErrorTitle}.",
                ];
            }
        }

        // If still fewer than 3 recommendations, supplement with unsolved popular challenges
        if (count($recommendations) < 3) {
            $filler = Challenge::where('is_published', true)
                ->whereNotIn('id', array_merge($solvedChallengeIds, $addedChallengeIds))
                ->whereIn('difficulty', ['Easy', 'Medium'])
                ->limit(3 - count($recommendations))
                ->get();

            foreach ($filler as $f) {
                $recommendations[] = [
                    'challenge' => [
                        'id' => $f->id,
                        'title' => $f->title,
                        'slug' => $f->slug,
                        'difficulty' => $f->difficulty,
                        'category' => $f->category,
                        'challenge_type' => $f->challenge_type,
                        'xp_reward' => $f->xp_reward,
                    ],
                    'topic' => $f->category,
                    'severity' => 'exploratory',
                    'reason' => "Recommended to broaden your skills in {$f->category} and build a well-rounded problem-solving foundation.",
                ];
            }
        }

        return $recommendations;
    }

    /**
     * Get starter recommendations for new users with onboarding state.
     */
    protected function getStarterRecommendations(array $solvedChallengeIds): array
    {
        $starterChallenges = Challenge::where('is_published', true)
            ->whereNotIn('id', $solvedChallengeIds)
            ->whereIn('difficulty', ['Beginner', 'Easy'])
            ->limit(3)
            ->get();

        return $starterChallenges->map(function ($ch) {
            return [
                'challenge' => [
                    'id' => $ch->id,
                    'title' => $ch->title,
                    'slug' => $ch->slug,
                    'difficulty' => $ch->difficulty,
                    'category' => $ch->category,
                    'challenge_type' => $ch->challenge_type,
                    'xp_reward' => $ch->xp_reward,
                ],
                'topic' => $ch->category,
                'severity' => 'starter',
                'reason' => "Starter challenge: complete this to calibrate your baseline problem-solving abilities and diagnostic profile.",
            ];
        })->toArray();
    }

    /**
     * Calculate 6-week timeline of submission accuracy over time.
     */
    protected function calculateProgressTimeline($submissions): array
    {
        $timeline = [];
        $now = Carbon::now();

        for ($i = 5; $i >= 0; $i--) {
            $weekStart = $now->copy()->subWeeks($i)->startOfWeek();
            $weekEnd = $weekStart->copy()->endOfWeek();
            $label = $weekStart->format('M d');

            $weekSubs = $submissions->filter(function ($s) use ($weekStart, $weekEnd) {
                return $s->created_at >= $weekStart && $s->created_at <= $weekEnd;
            });

            $total = $weekSubs->count();
            $accepted = $weekSubs->filter(fn ($s) => in_array(strtolower((string) $s->status), ['accepted', 'pass']))->count();
            $rate = $total > 0 ? (int) round(($accepted / $total) * 100) : 0;

            $timeline[] = [
                'period' => $label,
                'total' => $total,
                'accepted' => $accepted,
                'accuracy' => $rate,
            ];
        }

        return $timeline;
    }
}
