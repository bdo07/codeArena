<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SubmissionTestResult extends Model
{
    use HasFactory;

    protected $fillable = [
        'submission_id',
        'test_case_id',
        'status',
        'execution_time_ms',
        'memory_kb',
        'points_awarded',
    ];

    protected $casts = [
        'execution_time_ms' => 'integer',
        'memory_kb' => 'integer',
        'points_awarded' => 'integer',
    ];

    public function submission(): BelongsTo
    {
        return $this->belongsTo(Submission::class);
    }

    public function testCase(): BelongsTo
    {
        return $this->belongsTo(TestCase::class);
    }
}
