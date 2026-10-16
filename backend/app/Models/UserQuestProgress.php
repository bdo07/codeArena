<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserQuestProgress extends Model
{
    use HasFactory;

    protected $table = 'user_quest_progress';

    protected $fillable = [
        'user_id',
        'quest_stage_id',
        'status',
        'reward_claimed',
        'completed_at',
    ];

    protected $casts = [
        'reward_claimed' => 'boolean',
        'completed_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function stage(): BelongsTo
    {
        return $this->belongsTo(QuestStage::class, 'quest_stage_id');
    }
}
