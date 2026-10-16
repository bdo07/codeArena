<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InterviewSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'session_token',
        'topic',
        'difficulty',
        'duration_minutes',
        'started_at',
        'expires_at',
        'completed_at',
        'status',
        'score',
        'total_score',
        'passed',
        'xp_awarded',
        'feedback_summary',
    ];

    protected $casts = [
        'duration_minutes' => 'integer',
        'score' => 'integer',
        'total_score' => 'integer',
        'passed' => 'boolean',
        'xp_awarded' => 'integer',
        'started_at' => 'datetime',
        'expires_at' => 'datetime',
        'completed_at' => 'datetime',
        'feedback_summary' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function questions(): HasMany
    {
        return $this->hasMany(InterviewSessionQuestion::class)->orderBy('position');
    }
}
