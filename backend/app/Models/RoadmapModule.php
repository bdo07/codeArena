<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class RoadmapModule extends Model
{
    use HasFactory;

    protected $fillable = [
        'roadmap_id',
        'title',
        'description',
        'position',
    ];

    protected $casts = [
        'position' => 'integer',
    ];

    public function roadmap(): BelongsTo
    {
        return $this->belongsTo(Roadmap::class);
    }

    public function challenges(): BelongsToMany
    {
        return $this->belongsToMany(Challenge::class, 'roadmap_module_challenges', 'module_id', 'challenge_id')
            ->withPivot('position')
            ->orderByPivot('position');
    }
}
