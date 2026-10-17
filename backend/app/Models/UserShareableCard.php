<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class UserShareableCard extends Model
{
    use HasFactory;

    protected $table = 'user_shareable_cards';

    protected $fillable = [
        'user_id',
        'share_token',
        'is_public',
        'template',
        'card_theme',
        'layout',
        'selected_fields',
        'custom_tagline',
    ];

    protected $casts = [
        'is_public' => 'boolean',
        'selected_fields' => 'array',
    ];

    public static function generateToken(): string
    {
        return Str::random(40);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
