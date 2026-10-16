<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Language extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'category',
        'monaco_language',
        'judge0_id',
        'is_executable',
        'evaluator_type',
        'version',
        'icon',
        'description',
        'position',
    ];

    protected $casts = [
        'is_executable' => 'boolean',
        'judge0_id' => 'integer',
        'position' => 'integer',
    ];
}
