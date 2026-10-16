<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SnakeGame extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'session_id',
        'score',
        'apples_eaten',
        'moves_count',
        'duration_seconds',
        'status',
        'is_verified',
        'is_imported',
        'started_at',
        'ended_at',
    ];

    protected function casts(): array
    {
        return [
            'score' => 'integer',
            'apples_eaten' => 'integer',
            'moves_count' => 'integer',
            'duration_seconds' => 'integer',
            'is_verified' => 'boolean',
            'is_imported' => 'boolean',
            'started_at' => 'datetime',
            'ended_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
