<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Challenge extends Model
{
    use HasFactory;

    protected $fillable = [
        'slug',
        'title',
        'description',
        'input_description',
        'output_description',
        'constraints',
        'difficulty',
        'starter_code',
        'time_limit_ms',
        'memory_limit_mb',
        'is_published',
        'created_by',
    ];

    protected $casts = [
        'starter_code' => 'array',
        'time_limit_ms' => 'integer',
        'memory_limit_mb' => 'integer',
        'is_published' => 'boolean',
    ];

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class, 'challenge_tag');
    }

    public function testCases(): HasMany
    {
        return $this->hasMany(TestCase::class)->orderBy('position');
    }

    public function sampleTestCases(): HasMany
    {
        return $this->hasMany(TestCase::class)
            ->where('is_sample', true)
            ->orderBy('position');
    }

    public function hiddenTestCases(): HasMany
    {
        return $this->hasMany(TestCase::class)
            ->where('is_sample', false)
            ->orderBy('position');
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(Submission::class);
    }

    public function progress(): HasMany
    {
        return $this->hasMany(UserChallengeProgress::class);
    }

    public function getStarterCodeForLanguage(string $language): ?string
    {
        if (is_array($this->starter_code) && isset($this->starter_code[$language])) {
            return $this->starter_code[$language];
        }

        return null;
    }

    public function getTotalPointsAttribute(): int
    {
        return (int) $this->testCases()->sum('points');
    }
}
