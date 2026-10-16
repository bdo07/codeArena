<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserDailyMissionProgress extends Model
{
    use HasFactory;

    protected $table = 'user_daily_mission_progress';

    protected $fillable = [
        'user_id',
        'mission_date',
        'mission_type',
        'title',
        'description',
        'target_count',
        'current_count',
        'reward_xp',
        'is_completed',
        'reward_claimed',
    ];

    protected $casts = [
        'mission_date' => 'date',
        'target_count' => 'integer',
        'current_count' => 'integer',
        'reward_xp' => 'integer',
        'is_completed' => 'boolean',
        'reward_claimed' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
