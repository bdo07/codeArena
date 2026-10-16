<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DailyCompletion extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'challenge_id',
        'completed_date',
        'xp_awarded',
    ];

    protected $casts = [
        'completed_date' => 'date',
        'xp_awarded' => 'integer',
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
