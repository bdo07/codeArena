<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuestStageChallenge extends Model
{
    use HasFactory;

    protected $table = 'quest_stage_challenges';

    protected $fillable = [
        'quest_stage_id',
        'challenge_id',
        'position',
    ];

    protected $casts = [
        'position' => 'integer',
    ];

    public function stage(): BelongsTo
    {
        return $this->belongsTo(QuestStage::class, 'quest_stage_id');
    }

    public function challenge(): BelongsTo
    {
        return $this->belongsTo(Challenge::class, 'challenge_id');
    }
}
