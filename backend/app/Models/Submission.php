<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Submission extends Model
{
    use HasFactory;

    public const STATUS_PENDING = 'Pending';
    public const STATUS_RUNNING = 'Running';
    public const STATUS_ACCEPTED = 'Accepted';
    public const STATUS_WRONG_ANSWER = 'Wrong Answer';
    public const STATUS_COMPILATION_ERROR = 'Compilation Error';
    public const STATUS_RUNTIME_ERROR = 'Runtime Error';
    public const STATUS_TIME_LIMIT_EXCEEDED = 'Time Limit Exceeded';
    public const STATUS_INTERNAL_ERROR = 'Internal Error';

    protected $fillable = [
        'user_id',
        'challenge_id',
        'language',
        'source_code',
        'status',
        'score',
        'execution_time_ms',
        'memory_kb',
        'judge_token',
        'error_message',
        'submitted_at',
        'finished_at',
    ];

    protected $casts = [
        'score' => 'integer',
        'execution_time_ms' => 'integer',
        'memory_kb' => 'integer',
        'submitted_at' => 'datetime',
        'finished_at' => 'datetime',
    ];

    protected $hidden = [
        'judge_token',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function challenge(): BelongsTo
    {
        return $this->belongsTo(Challenge::class);
    }

    public function testResults(): HasMany
    {
        return $this->hasMany(SubmissionTestResult::class);
    }

    public function isAccepted(): bool
    {
        return $this->status === self::STATUS_ACCEPTED;
    }
}
