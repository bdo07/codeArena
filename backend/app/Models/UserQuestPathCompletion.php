<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserQuestPathCompletion extends Model
{
    use HasFactory;

    protected $table = 'user_quest_path_completions';

    protected $fillable = [
        'user_id',
        'quest_path_id',
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

    public function path(): BelongsTo
    {
        return $this->belongsTo(QuestPath::class, 'quest_path_id');
    }
}
