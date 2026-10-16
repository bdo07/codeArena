<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InterviewSessionQuestion extends Model
{
    use HasFactory;

    protected $fillable = [
        'interview_session_id',
        'challenge_id',
        'position',
        'title',
        'description',
        'question_type',
        'language',
        'starter_code',
        'rubric',
        'user_answer',
        'is_correct',
        'score',
        'max_score',
        'evaluation_notes',
        'evaluation_details',
    ];

    protected $casts = [
        'position' => 'integer',
        'score' => 'integer',
        'max_score' => 'integer',
        'is_correct' => 'boolean',
        'rubric' => 'array',
        'evaluation_details' => 'array',
    ];

    public function session(): BelongsTo
    {
        return $this->belongsTo(InterviewSession::class, 'interview_session_id');
    }

    public function challenge(): BelongsTo
    {
        return $this->belongsTo(Challenge::class, 'challenge_id');
    }
}
