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
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $appends = [
        'level',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'xp' => 'integer',
        ];
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

    public function roadmapProgress(): HasMany
    {
        return $this->hasMany(UserRoadmapProgress::class);
    }

    public function dailyCompletions(): HasMany
    {
        return $this->hasMany(DailyCompletion::class);
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
