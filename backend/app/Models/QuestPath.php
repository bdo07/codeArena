<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class QuestPath extends Model
{
    use HasFactory;

    protected $fillable = [
        'slug',
        'title',
        'description',
        'category',
        'icon',
        'difficulty',
        'estimated_hours',
        'position',
        'reward_xp',
        'reward_badge_id',
        'is_published',
    ];

    protected $casts = [
        'is_published' => 'boolean',
        'estimated_hours' => 'integer',
        'position' => 'integer',
        'reward_xp' => 'integer',
    ];

    public function stages(): HasMany
    {
        return $this->hasMany(QuestStage::class)->orderBy('position');
    }

    public function rewardBadge(): BelongsTo
    {
        return $this->belongsTo(Badge::class, 'reward_badge_id');
    }

    public function pathCompletions(): HasMany
    {
        return $this->hasMany(UserQuestPathCompletion::class);
    }
}
