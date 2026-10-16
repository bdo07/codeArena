<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserRoadmapProgress extends Model
{
    use HasFactory;

    protected $table = 'user_roadmap_progress';

    protected $fillable = [
        'user_id',
        'roadmap_id',
        'completed_challenges_count',
        'is_completed',
        'completed_at',
    ];

    protected $casts = [
        'completed_challenges_count' => 'integer',
        'is_completed' => 'boolean',
        'completed_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function roadmap(): BelongsTo
    {
        return $this->belongsTo(Roadmap::class);
    }
}
