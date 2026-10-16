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
        'category',
        'challenge_type',
        'estimated_time_min',
        'starter_code',
        'hints',
        'explanation',
        'reference_solution',
        'sql_schema',
        'sql_seed',
        'sql_solution',
        'web_template',
        'quiz_data',
        'time_limit_ms',
        'memory_limit_mb',
        'is_published',
        'is_daily',
        'daily_date',
        'created_by',
    ];

    protected $appends = [
        'supported_languages',
    ];

    protected $casts = [
        'starter_code' => 'array',
        'hints' => 'array',
        'web_template' => 'array',
        'quiz_data' => 'array',
        'time_limit_ms' => 'integer',
        'memory_limit_mb' => 'integer',
        'estimated_time_min' => 'integer',
        'is_published' => 'boolean',
        'is_daily' => 'boolean',
        'daily_date' => 'date',
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

    public function discussions(): HasMany
    {
        return $this->hasMany(Discussion::class)->orderByDesc('is_pinned')->orderByDesc('upvotes_count');
    }

    public function notes(): HasMany
    {
        return $this->hasMany(ChallengeNote::class);
    }

    public function collections(): BelongsToMany
    {
        return $this->belongsToMany(Collection::class, 'collection_challenges')
            ->withPivot('position')
            ->withTimestamps();
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

    public function getSupportedLanguagesAttribute(): array
    {
        if ($this->challenge_type === 'sql') {
            return ['sql'];
        }
        if ($this->challenge_type === 'web') {
            return ['html', 'css', 'javascript'];
        }
        if ($this->challenge_type === 'quiz') {
            return [];
        }
        if (is_array($this->starter_code)) {
            return array_keys($this->starter_code);
        }
        return ['python', 'javascript', 'cpp'];
    }
}
