<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'username',
        'email',
        'password',
        'role',
        'xp',
        'avatar',
        'tagline',
        'bio',
        'location',
        'website_url',
        'github_url',
        'linkedin_url',
        'favorite_languages',
        'is_activity_public',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $appends = [
        'level',
        'avatar_url',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'xp' => 'integer',
            'favorite_languages' => 'array',
            'is_activity_public' => 'boolean',
        ];
    }

    public function getAvatarUrlAttribute(): ?string
    {
        if (! $this->avatar) {
            return null;
        }

        if (str_starts_with($this->avatar, 'http://') || str_starts_with($this->avatar, 'https://')) {
            return $this->avatar;
        }

        return url('/storage/' . ltrim($this->avatar, '/'));
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(Submission::class);
    }

    public function progress(): HasMany
    {
        return $this->hasMany(UserChallengeProgress::class);
    }

    public function badges(): BelongsToMany
    {
        return $this->belongsToMany(Badge::class, 'user_badges')
            ->withPivot('earned_at')
            ->withTimestamps();
    }

    public function streak(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(UserStreak::class);
    }

    public function notes(): HasMany
    {
        return $this->hasMany(ChallengeNote::class);
    }

    public function collections(): HasMany
    {
        return $this->hasMany(Collection::class);
    }

    public function discussions(): HasMany
    {
        return $this->hasMany(Discussion::class);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class)->latest();
    }

    public function contestParticipants(): HasMany
    {
        return $this->hasMany(ContestParticipant::class);
    }

    public function snakeGames(): HasMany
    {
        return $this->hasMany(SnakeGame::class);
    }

    public function roadmapProgress(): HasMany
    {
        return $this->hasMany(UserRoadmapProgress::class);
    }

    public function dailyCompletions(): HasMany
    {
        return $this->hasMany(DailyCompletion::class);
    }

    public function questProgress(): HasMany
    {
        return $this->hasMany(UserQuestProgress::class);
    }

    public function questPathCompletions(): HasMany
    {
        return $this->hasMany(UserQuestPathCompletion::class);
    }

    public function dailyMissions(): HasMany
    {
        return $this->hasMany(UserDailyMissionProgress::class);
    }

    public function gitPlaygroundProgress(): HasMany
    {
        return $this->hasMany(UserGitPlaygroundProgress::class);
    }

    public function interviewSessions(): HasMany
    {
        return $this->hasMany(InterviewSession::class)->latest();
    }

    public function shareableCard(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(UserShareableCard::class);
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function getLevelAttribute(): int
    {
        return $this->calculateLevel();
    }

    /**
     * Compute user level based on XP.
     * Formula: Level 1 starts at 0 XP. Each level requires (Level * 100) XP.
     * Level = floor(sqrt(XP / 50)) + 1
     */
    public function calculateLevel(): int
    {
        if ($this->xp <= 0) {
            return 1;
        }

        return (int) floor(sqrt($this->xp / 50)) + 1;
    }
}
