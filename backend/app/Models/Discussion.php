<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Discussion extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'challenge_id',
        'title',
        'content',
        'category',
        'upvotes_count',
        'is_pinned',
    ];

    protected $casts = [
        'upvotes_count' => 'integer',
        'is_pinned' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function challenge(): BelongsTo
    {
        return $this->belongsTo(Challenge::class);
    }

    public function replies(): HasMany
    {
        return $this->hasMany(DiscussionReply::class)->orderBy('created_at');
    }

    public function likes(): MorphMany
    {
        return $this->morphMany(DiscussionLike::class, 'likable');
    }
}
