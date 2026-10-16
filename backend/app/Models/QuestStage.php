<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class QuestStage extends Model
{
    use HasFactory;

    protected $fillable = [
        'quest_path_id',
        'slug',
        'title',
        'description',
        'position',
        'prerequisite_stage_id',
        'reward_xp',
        'reward_badge_id',
    ];

    protected $casts = [
        'position' => 'integer',
        'reward_xp' => 'integer',
    ];

    public function path(): BelongsTo
    {
        return $this->belongsTo(QuestPath::class, 'quest_path_id');
    }

    public function prerequisite(): BelongsTo
    {
        return $this->belongsTo(QuestStage::class, 'prerequisite_stage_id');
    }

    public function dependentStages(): HasMany
    {
        return $this->hasMany(QuestStage::class, 'prerequisite_stage_id');
    }

    public function challenges(): BelongsToMany
    {
        return $this->belongsToMany(Challenge::class, 'quest_stage_challenges', 'quest_stage_id', 'challenge_id')
            ->withPivot('position')
            ->orderByPivot('position');
    }

    public function rewardBadge(): BelongsTo
    {
        return $this->belongsTo(Badge::class, 'reward_badge_id');
    }

    public function userProgress(): HasMany
    {
        return $this->hasMany(UserQuestProgress::class);
    }
}
