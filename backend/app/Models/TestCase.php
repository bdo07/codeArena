<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TestCase extends Model
{
    use HasFactory;

    protected $fillable = [
        'challenge_id',
        'input_data',
        'expected_output',
        'is_sample',
        'points',
        'position',
    ];

    protected $casts = [
        'is_sample' => 'boolean',
        'points' => 'integer',
        'position' => 'integer',
    ];

    public function challenge(): BelongsTo
    {
        return $this->belongsTo(Challenge::class);
    }
}
