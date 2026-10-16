<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserGitPlaygroundProgress extends Model
{
    use HasFactory;

    protected $table = 'user_git_playground_progress';

    protected $fillable = [
        'user_id',
        'scenario_id',
        'is_completed',
        'commands_count',
        'completed_at',
        'reward_claimed',
        'xp_awarded',
    ];

    protected $casts = [
        'is_completed' => 'boolean',
        'reward_claimed' => 'boolean',
        'commands_count' => 'integer',
        'xp_awarded' => 'integer',
        'completed_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
