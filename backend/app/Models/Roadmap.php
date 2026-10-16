<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Roadmap extends Model
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
        'is_published',
    ];

    protected $casts = [
        'is_published' => 'boolean',
        'estimated_hours' => 'integer',
        'position' => 'integer',
    ];

    public function modules(): HasMany
    {
        return $this->hasMany(RoadmapModule::class)->orderBy('position');
    }

    public function userProgress(): HasMany
    {
        return $this->hasMany(UserRoadmapProgress::class);
    }
}
