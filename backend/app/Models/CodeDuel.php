<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class CodeDuel extends Model
{
    use HasFactory;

    public const STATUS_PENDING = 'pending';
    public const STATUS_ACTIVE = 'active';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_DECLINED = 'declined';
    public const STATUS_CANCELED = 'canceled';
    public const STATUS_TIMED_OUT = 'timed_out';

    protected $fillable = [
        'uuid',
        'creator_id',
        'opponent_id',
        'challenge_id',
        'status',
        'language',
        'duration_seconds',
        'started_at',
        'ends_at',
        'winner_id',
        'creator_score',
        'opponent_score',
        'creator_submission_id',
        'opponent_submission_id',
        'creator_submitted_at',
        'opponent_submitted_at',
        'creator_code',
        'opponent_code',
        'result_reason',
    ];

    protected $casts = [
        'duration_seconds' => 'integer',
        'creator_score' => 'integer',
        'opponent_score' => 'integer',
        'started_at' => 'datetime',
        'ends_at' => 'datetime',
        'creator_submitted_at' => 'datetime',
        'opponent_submitted_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($duel) {
            if (empty($duel->uuid)) {
                $duel->uuid = (string) Str::uuid();
            }
        });
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    public function opponent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'opponent_id');
    }

    public function challenge(): BelongsTo
    {
        return $this->belongsTo(Challenge::class);
    }

    public function winner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'winner_id');
    }

    public function creatorSubmission(): BelongsTo
    {
        return $this->belongsTo(Submission::class, 'creator_submission_id');
    }

    public function opponentSubmission(): BelongsTo
    {
        return $this->belongsTo(Submission::class, 'opponent_submission_id');
    }

    public function isParticipant(User $user): bool
    {
        return $this->creator_id === $user->id || $this->opponent_id === $user->id;
    }

    public function isCreator(User $user): bool
    {
        return $this->creator_id === $user->id;
    }

    public function isOpponent(User $user): bool
    {
        return $this->opponent_id === $user->id;
    }

    public function hasExpired(): bool
    {
        return $this->ends_at !== null && Carbon::now()->greaterThanOrEqualTo($this->ends_at);
    }

    /**
     * Check if match time expired and finalize result deterministically.
     */
    public function checkAndApplyTimeout(): bool
    {
        if ($this->status !== self::STATUS_ACTIVE) {
            return false;
        }

        if (!$this->hasExpired()) {
            return false;
        }

        // Finalize timeout
        $this->status = self::STATUS_TIMED_OUT;

        if ($this->creator_score > $this->opponent_score) {
            $this->winner_id = $this->creator_id;
            $this->result_reason = "Match time expired. {$this->creator->username} won with {$this->creator_score} points vs {$this->opponent_score} points.";
        } elseif ($this->opponent_score > $this->creator_score) {
            $this->winner_id = $this->opponent_id;
            $this->result_reason = "Match time expired. {$this->opponent->username} won with {$this->opponent_score} points vs {$this->creator_score} points.";
        } else {
            // Equal scores -> check who submitted first if any
            if ($this->creator_score > 0) {
                if ($this->creator_submitted_at && $this->opponent_submitted_at) {
                    if ($this->creator_submitted_at->lessThan($this->opponent_submitted_at)) {
                        $this->winner_id = $this->creator_id;
                        $this->result_reason = "Tie-breaker: {$this->creator->username} submitted first.";
                    } elseif ($this->opponent_submitted_at->lessThan($this->creator_submitted_at)) {
                        $this->winner_id = $this->opponent_id;
                        $this->result_reason = "Tie-breaker: {$this->opponent->username} submitted first.";
                    } else {
                        $this->winner_id = null;
                        $this->result_reason = "Match time expired with equal scores and equal timing (Draw).";
                    }
                } elseif ($this->creator_submitted_at) {
                    $this->winner_id = $this->creator_id;
                    $this->result_reason = "{$this->creator->username} submitted their solution.";
                } elseif ($this->opponent_submitted_at) {
                    $this->winner_id = $this->opponent_id;
                    $this->result_reason = "{$this->opponent->username} submitted their solution.";
                } else {
                    $this->winner_id = null;
                    $this->result_reason = "Match time expired with no submissions (Draw).";
                }
            } else {
                $this->winner_id = null;
                $this->result_reason = "Match time expired with no successful submissions (Draw).";
            }
        }

        $this->save();
        return true;
    }
}
