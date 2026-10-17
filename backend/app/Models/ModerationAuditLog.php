<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ModerationAuditLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'admin_id',
        'target_user_id',
        'action',
        'reason',
        'internal_notes',
        'metadata',
        'ip_address',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    /**
     * Admin who performed the action.
     */
    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_id')->withTrashed();
    }

    /**
     * Target user affected by the moderation action.
     */
    public function targetUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'target_user_id')->withTrashed();
    }

    /**
     * Record a new append-only audit log entry.
     */
    public static function record(
        ?int $adminId,
        ?int $targetUserId,
        string $action,
        string $reason,
        ?string $internalNotes = null,
        ?array $metadata = null,
        ?string $ipAddress = null
    ): self {
        return self::create([
            'admin_id' => $adminId,
            'target_user_id' => $targetUserId,
            'action' => $action,
            'reason' => $reason,
            'internal_notes' => $internalNotes,
            'metadata' => $metadata,
            'ip_address' => $ipAddress,
        ]);
    }
}
