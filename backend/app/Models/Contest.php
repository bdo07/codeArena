<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Contest extends Model
{
    use HasFactory;

    protected $fillable = [
        'slug',
        'title',
        'description',
        'start_time',
        'end_time',
        'status',
        'banner_color',
        'created_by',
    ];

    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function challenges(): BelongsToMany
    {
        return $this->belongsToMany(Challenge::class, 'contest_challenges')
            ->withPivot(['points', 'position'])
            ->orderByPivot('position');
    }

    public function participants(): HasMany
    {
        return $this->hasMany(ContestParticipant::class)->orderByDesc('score')->orderBy('finish_time_ms');
    }

    public function isLive(): bool
    {
        $now = now();
        return $this->start_time <= $now && $this->end_time >= $now;
    }

    public function isUpcoming(): bool
    {
        return $this->start_time > now();
    }

    public function isEnded(): bool
    {
        return $this->end_time < now();
    }
}
