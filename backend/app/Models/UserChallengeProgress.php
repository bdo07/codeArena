<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserChallengeProgress extends Model
{
    use HasFactory;

    protected $table = 'user_challenge_progress';

    protected $fillable = [
        'user_id',
        'challenge_id',
        'best_score',
        'attempts_count',
        'solved_at',
    ];

    protected $casts = [
        'best_score' => 'integer',
        'attempts_count' => 'integer',
        'solved_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function challenge(): BelongsTo
    {
        return $this->belongsTo(Challenge::class);
    }
}
