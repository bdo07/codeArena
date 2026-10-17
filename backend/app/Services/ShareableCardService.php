<?php

namespace App\Services;

use App\Models\InterviewSession;
use App\Models\Submission;
use App\Models\User;
use App\Models\UserChallengeProgress;
use App\Models\UserGitPlaygroundProgress;
use App\Models\UserQuestPathCompletion;
use App\Models\UserShareableCard;
use Illuminate\Support\Facades\DB;

class ShareableCardService
{
    public const DEFAULT_FIELDS = [
        'avatar',
        'tagline',
        'solved',
        'xp_level',
        'streak',
        'badges',
        'skills',
        'git',
        'interviews',
    ];

    /**
     * Get or create private shareable card settings for user.
     */
    public function getOrCreateSettings(User $user): array
    {
        $card = UserShareableCard::firstOrCreate(
            ['user_id' => $user->id],
            [
                'share_token' => UserShareableCard::generateToken(),
                'is_public' => false,
                'template' => 'modern',
                'card_theme' => 'dark',
                'layout' => 'horizontal',
                'selected_fields' => self::DEFAULT_FIELDS,
                'custom_tagline' => $user->tagline ?? 'Software Engineer & Problem Solver',
            ]
        );

        return [
            'card' => $card,
            'stats' => $this->formatUserStats($user, $card),
        ];
    }

    /**
     * Update card settings.
     */
    public function updateSettings(User $user, array $data): array
    {
        $card = UserShareableCard::firstOrCreate(['user_id' => $user->id], [
            'share_token' => UserShareableCard::generateToken(),
        ]);

        if (array_key_exists('is_public', $data)) {
            $card->is_public = (bool) $data['is_public'];
        }
        if (!empty($data['template'])) {
            $card->template = $data['template'];
        }
        if (!empty($data['card_theme'])) {
            $card->card_theme = $data['card_theme'];
        }
        if (!empty($data['layout'])) {
            $card->layout = $data['layout'];
        }
        if (array_key_exists('selected_fields', $data)) {
            $card->selected_fields = (array) $data['selected_fields'];
        }
        if (array_key_exists('custom_tagline', $data)) {
            $card->custom_tagline = $data['custom_tagline'];
        }

        $card->save();

        return [
            'card' => $card,
            'stats' => $this->formatUserStats($user, $card),
        ];
    }

    /**
     * Regenerate share token (revokes previous public URL).
     */
    public function regenerateToken(User $user): UserShareableCard
    {
        $card = UserShareableCard::firstOrCreate(['user_id' => $user->id]);
        $card->share_token = UserShareableCard::generateToken();
        $card->save();

        return $card;
    }

    /**
     * Retrieve publicly shared card data.
     */
    public function getPublicCard(string $token): ?array
    {
        $card = UserShareableCard::where('share_token', $token)
            ->where('is_public', true)
            ->with(['user.badges', 'user.streak'])
            ->first();

        if (!$card || !$card->user) {
            return null;
        }

        $user = $card->user;
        $stats = $this->formatUserStats($user, $card);

        return [
            'user' => [
                'name' => $user->name,
                'username' => $user->username,
                'avatar_url' => $user->avatar_url,
                'xp' => $user->xp,
                'level' => $user->level,
                'created_at' => $user->created_at?->toIso8601String(),
            ],
            'card' => [
                'share_token' => $card->share_token,
                'is_public' => true,
                'template' => $card->template,
                'card_theme' => $card->card_theme,
                'layout' => $card->layout,
                'selected_fields' => $card->selected_fields ?? self::DEFAULT_FIELDS,
                'custom_tagline' => $card->custom_tagline,
                'updated_at' => $card->updated_at?->toIso8601String(),
            ],
            'stats' => $stats,
        ];
    }

    /**
     * Gather actual, authentic user statistics.
     */
    public function formatUserStats(User $user, UserShareableCard $card): array
    {
        // 1. Solved Challenges count
        $solvedCount = UserChallengeProgress::where('user_id', $user->id)
            ->whereNotNull('solved_at')
            ->count();

        // 2. Submissions & success rate
        $totalSubmissions = Submission::where('user_id', $user->id)->count();
        $acceptedCount = Submission::where('user_id', $user->id)
            ->whereIn(DB::raw('LOWER(status)'), ['accepted', 'pass'])
            ->count();
        $successRate = $totalSubmissions > 0 ? (int) round(($acceptedCount / $totalSubmissions) * 100) : 0;

        // 3. Streak
        $streak = $user->streak;
        $currentStreak = $streak?->current_streak ?? 0;
        $bestStreak = $streak?->longest_streak ?? 0;

        // 4. Badges
        $badges = $user->badges()
            ->orderBy('pivot_earned_at', 'desc')
            ->limit(5)
            ->get()
            ->map(fn($b) => [
                'id' => $b->id,
                'name' => $b->name,
                'icon' => $b->icon,
                'description' => $b->description,
                'earned_at' => $b->pivot?->earned_at,
            ])
            ->toArray();

        // 5. Favorite languages / Top skills from user profile & submissions
        $favLanguages = $user->favorite_languages ?? [];
        if (empty($favLanguages)) {
            $favLanguages = Submission::where('user_id', $user->id)
                ->whereIn(DB::raw('LOWER(status)'), ['accepted', 'pass'])
                ->select('language', DB::raw('count(*) as count'))
                ->groupBy('language')
                ->orderBy('count', 'desc')
                ->limit(4)
                ->pluck('language')
                ->toArray();
        }

        // 6. Quest Paths Completed
        $questPathsCompleted = UserQuestPathCompletion::where('user_id', $user->id)->count();

        // 7. Git Playground missions
        $gitMissionsCount = UserGitPlaygroundProgress::where('user_id', $user->id)->count();

        // 8. Mock Interviews passed
        $interviewsPassed = InterviewSession::where('user_id', $user->id)
            ->where('passed', true)
            ->count();

        return [
            'solved_challenges' => $solvedCount,
            'total_submissions' => $totalSubmissions,
            'success_rate' => $successRate,
            'current_streak' => $currentStreak,
            'best_streak' => $bestStreak,
            'badges' => $badges,
            'skills' => array_values(array_filter($favLanguages)),
            'quest_paths_completed' => $questPathsCompleted,
            'git_scenarios_completed' => $gitMissionsCount,
            'interviews_passed' => $interviewsPassed,
        ];
    }
}
