<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\ModerationAuditLog;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class UserAdminController extends Controller
{
    /**
     * List and search users with pagination and moderation filters.
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::withTrashed();

        // 1. Search by name, username, or email
        if ($search = $request->input('search')) {
            $search = strtolower(trim($search));
            $query->where(function ($q) use ($search) {
                $q->where(DB::raw('LOWER(name)'), 'like', "%{$search}%")
                  ->orWhere(DB::raw('LOWER(username)'), 'like', "%{$search}%")
                  ->orWhere(DB::raw('LOWER(email)'), 'like', "%{$search}%");
            });
        }

        // 2. Filter by role
        if ($role = $request->input('role')) {
            if (in_array($role, ['admin', 'user'])) {
                $query->where('role', $role);
            }
        }

        // 3. Filter by status
        if ($status = $request->input('status')) {
            if ($status === 'deleted') {
                $query->onlyTrashed();
            } elseif ($status === 'suspended') {
                $query->whereNull('deleted_at')
                      ->where('status', User::STATUS_SUSPENDED);
            } elseif ($status === 'banned') {
                $query->whereNull('deleted_at')
                      ->where('status', User::STATUS_BANNED);
            } elseif ($status === 'active') {
                $query->whereNull('deleted_at')
                      ->where(function ($q) {
                          $q->where('status', User::STATUS_ACTIVE)
                            ->orWhereNull('status');
                      });
            }
        }

        // 4. Sorting
        $allowedSorts = ['created_at', 'username', 'xp', 'status', 'name'];
        $sortBy = in_array($request->input('sort_by'), $allowedSorts) ? $request->input('sort_by') : 'created_at';
        $sortDir = strtolower($request->input('sort_dir')) === 'asc' ? 'asc' : 'desc';
        $query->orderBy($sortBy, $sortDir);

        // 5. Pagination
        $perPage = min(max((int) $request->input('per_page', 15), 5), 100);
        $paginated = $query->paginate($perPage);

        // Transform results safely (never expose password or remember_token)
        $paginated->getCollection()->transform(function (User $user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
                'role' => $user->role,
                'status' => $user->status ?? User::STATUS_ACTIVE,
                'is_suspended' => $user->isSuspended(),
                'suspended_until' => $user->suspended_until?->toIso8601String(),
                'suspension_reason' => $user->suspension_reason,
                'is_banned' => $user->isBanned(),
                'banned_at' => $user->banned_at?->toIso8601String(),
                'ban_reason' => $user->ban_reason,
                'xp' => $user->xp,
                'level' => $user->calculateLevel(),
                'avatar_url' => $user->avatar_url,
                'created_at' => $user->created_at?->toIso8601String(),
                'deleted_at' => $user->deleted_at?->toIso8601String(),
                'is_deleted' => $user->trashed(),
                'moderation_actions_count' => $user->targetModerationLogs()->count(),
                'pending_appeals_count' => $user->appeals()->where('status', 'pending')->count(),
            ];
        });

        // Overview summary metrics
        $stats = [
            'total' => User::withTrashed()->count(),
            'active' => User::whereNull('deleted_at')->where(fn ($q) => $q->where('status', User::STATUS_ACTIVE)->orWhereNull('status'))->count(),
            'suspended' => User::whereNull('deleted_at')->where('status', User::STATUS_SUSPENDED)->count(),
            'banned' => User::whereNull('deleted_at')->where('status', User::STATUS_BANNED)->count(),
            'deleted' => User::onlyTrashed()->count(),
            'admins' => User::whereNull('deleted_at')->where('role', 'admin')->count(),
        ];

        return response()->json([
            'users' => $paginated,
            'stats' => $stats,
        ]);
    }

    /**
     * Show full user details including complete moderation history and appeals.
     */
    public function show(int $id): JsonResponse
    {
        $user = User::withTrashed()->findOrFail($id);

        $moderationLogs = ModerationAuditLog::where('target_user_id', $user->id)
            ->with(['admin:id,name,username,email'])
            ->latest()
            ->get();

        $appeals = $user->appeals()
            ->with(['reviewer:id,name,username'])
            ->latest()
            ->get();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
                'role' => $user->role,
                'status' => $user->status ?? User::STATUS_ACTIVE,
                'is_suspended' => $user->isSuspended(),
                'suspended_until' => $user->suspended_until?->toIso8601String(),
                'suspension_reason' => $user->suspension_reason,
                'is_banned' => $user->isBanned(),
                'banned_at' => $user->banned_at?->toIso8601String(),
                'ban_reason' => $user->ban_reason,
                'xp' => $user->xp,
                'level' => $user->calculateLevel(),
                'avatar_url' => $user->avatar_url,
                'bio' => $user->bio,
                'location' => $user->location,
                'created_at' => $user->created_at?->toIso8601String(),
                'deleted_at' => $user->deleted_at?->toIso8601String(),
                'is_deleted' => $user->trashed(),
                'stats' => [
                    'solved_challenges' => $user->progress()->where('status', 'solved')->count(),
                    'total_submissions' => $user->submissions()->count(),
                ],
            ],
            'moderation_logs' => $moderationLogs,
            'appeals' => $appeals,
        ]);
    }

    /**
     * Send an official warning to a user.
     */
    public function warn(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'reason' => 'required|string|min:3|max:1000',
            'internal_notes' => 'nullable|string|max:2000',
        ]);

        $user = User::withTrashed()->findOrFail($id);
        $admin = $request->user();

        // Record audit log
        $log = ModerationAuditLog::record(
            $admin->id,
            $user->id,
            'warn',
            $validated['reason'],
            $validated['internal_notes'] ?? null,
            ['target_username' => $user->username],
            $request->ip()
        );

        // Notify user via in-app notification
        Notification::create([
            'user_id' => $user->id,
            'type' => 'moderation_warning',
            'title' => 'Official Account Notice & Warning',
            'message' => $validated['reason'],
            'data' => [
                'action' => 'warn',
                'created_at' => now()->toIso8601String(),
            ],
            'is_read' => false,
        ]);

        return response()->json([
            'message' => "Warning successfully issued to @{$user->username}.",
            'log' => $log,
        ]);
    }

    /**
     * Temporarily or indefinitely suspend a user.
     */
    public function suspend(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'reason' => 'required|string|min:3|max:1000',
            'duration_days' => 'nullable|integer|min:0|max:3650',
            'internal_notes' => 'nullable|string|max:2000',
        ]);

        $admin = $request->user();
        $user = User::withTrashed()->findOrFail($id);

        // Guard: Cannot suspend yourself
        if ($admin->id === $user->id) {
            return response()->json([
                'message' => 'Action forbidden: You cannot suspend your own administrative account.',
            ], 422);
        }

        $durationDays = ! empty($validated['duration_days']) ? (int) $validated['duration_days'] : null;
        $suspendedUntil = $durationDays ? now()->addDays($durationDays) : null;

        $user->status = User::STATUS_SUSPENDED;
        $user->suspended_until = $suspendedUntil;
        $user->suspension_reason = $validated['reason'];
        $user->save();

        // Revoke active API tokens to force re-evaluation of permissions
        $user->tokens()->delete();

        // Record audit log
        ModerationAuditLog::record(
            $admin->id,
            $user->id,
            'suspend',
            $validated['reason'],
            $validated['internal_notes'] ?? null,
            [
                'duration_days' => $durationDays,
                'suspended_until' => $suspendedUntil?->toIso8601String(),
                'target_username' => $user->username,
            ],
            $request->ip()
        );

        // Create notification
        $noticeDuration = $durationDays ? "for {$durationDays} days (until " . $suspendedUntil->toFormattedDateString() . ")" : 'indefinitely';
        Notification::create([
            'user_id' => $user->id,
            'type' => 'account_suspended',
            'title' => 'Account Suspended',
            'message' => "Your account has been suspended {$noticeDuration}. Reason: {$validated['reason']}. You may submit an appeal via your account banner.",
            'data' => [
                'action' => 'suspend',
                'suspended_until' => $suspendedUntil?->toIso8601String(),
                'reason' => $validated['reason'],
            ],
            'is_read' => false,
        ]);

        return response()->json([
            'message' => "Account @{$user->username} has been suspended.",
            'user' => [
                'id' => $user->id,
                'status' => $user->status,
                'suspended_until' => $user->suspended_until?->toIso8601String(),
                'suspension_reason' => $user->suspension_reason,
            ],
        ]);
    }

    /**
     * Lift suspension from a user account.
     */
    public function unsuspend(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'reason' => 'nullable|string|max:1000',
            'internal_notes' => 'nullable|string|max:2000',
        ]);

        $admin = $request->user();
        $user = User::withTrashed()->findOrFail($id);

        if ($user->status !== User::STATUS_SUSPENDED) {
            return response()->json([
                'message' => 'User is not currently suspended.',
            ], 422);
        }

        $user->status = User::STATUS_ACTIVE;
        $user->suspended_until = null;
        $user->suspension_reason = null;
        $user->save();

        $reason = $validated['reason'] ?? 'Suspension lifted by administrator.';

        // Record audit log
        ModerationAuditLog::record(
            $admin->id,
            $user->id,
            'unsuspend',
            $reason,
            $validated['internal_notes'] ?? null,
            ['target_username' => $user->username],
            $request->ip()
        );

        // Notification
        Notification::create([
            'user_id' => $user->id,
            'type' => 'account_reinstated',
            'title' => 'Account Suspension Lifted',
            'message' => 'Your CodeArena account suspension has been lifted. Full platform access is restored.',
            'data' => ['action' => 'unsuspend'],
            'is_read' => false,
        ]);

        return response()->json([
            'message' => "Suspension lifted for @{$user->username}.",
            'user' => [
                'id' => $user->id,
                'status' => $user->status,
            ],
        ]);
    }

    /**
     * Permanently ban a user account.
     */
    public function ban(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'reason' => 'required|string|min:3|max:1000',
            'internal_notes' => 'nullable|string|max:2000',
        ]);

        $admin = $request->user();
        $user = User::withTrashed()->findOrFail($id);

        // Guard: Cannot ban yourself
        if ($admin->id === $user->id) {
            return response()->json([
                'message' => 'Action forbidden: You cannot ban your own administrator account.',
            ], 422);
        }

        $user->status = User::STATUS_BANNED;
        $user->banned_at = now();
        $user->ban_reason = $validated['reason'];
        $user->save();

        // Revoke all tokens
        $user->tokens()->delete();

        // Record audit log
        ModerationAuditLog::record(
            $admin->id,
            $user->id,
            'ban',
            $validated['reason'],
            $validated['internal_notes'] ?? null,
            ['target_username' => $user->username, 'banned_at' => $user->banned_at->toIso8601String()],
            $request->ip()
        );

        // Notification
        Notification::create([
            'user_id' => $user->id,
            'type' => 'account_banned',
            'title' => 'Account Permanently Banned',
            'message' => "Your account has been permanently banned from CodeArena due to serious violations: {$validated['reason']}.",
            'data' => ['action' => 'ban', 'reason' => $validated['reason']],
            'is_read' => false,
        ]);

        return response()->json([
            'message' => "Account @{$user->username} has been permanently banned.",
            'user' => [
                'id' => $user->id,
                'status' => $user->status,
                'banned_at' => $user->banned_at?->toIso8601String(),
                'ban_reason' => $user->ban_reason,
            ],
        ]);
    }

    /**
     * Unban a user account.
     */
    public function unban(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'reason' => 'nullable|string|max:1000',
            'internal_notes' => 'nullable|string|max:2000',
        ]);

        $admin = $request->user();
        $user = User::withTrashed()->findOrFail($id);

        if ($user->status !== User::STATUS_BANNED) {
            return response()->json([
                'message' => 'User is not currently banned.',
            ], 422);
        }

        $user->status = User::STATUS_ACTIVE;
        $user->banned_at = null;
        $user->ban_reason = null;
        $user->save();

        $reason = $validated['reason'] ?? 'Ban revoked by administrator.';

        // Record audit log
        ModerationAuditLog::record(
            $admin->id,
            $user->id,
            'unban',
            $reason,
            $validated['internal_notes'] ?? null,
            ['target_username' => $user->username],
            $request->ip()
        );

        // Notification
        Notification::create([
            'user_id' => $user->id,
            'type' => 'account_reinstated',
            'title' => 'Account Ban Revoked',
            'message' => 'Your CodeArena account ban has been revoked. You can log in and participate again.',
            'data' => ['action' => 'unban'],
            'is_read' => false,
        ]);

        return response()->json([
            'message' => "Ban revoked for @{$user->username}.",
            'user' => [
                'id' => $user->id,
                'status' => $user->status,
            ],
        ]);
    }

    /**
     * Update user role (promote to admin or demote to user) with safeguard against removing the last admin.
     */
    public function updateRole(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'role' => ['required', Rule::in(['admin', 'user'])],
            'reason' => 'required|string|min:3|max:1000',
        ]);

        $admin = $request->user();
        $user = User::withTrashed()->findOrFail($id);
        $newRole = $validated['role'];

        if ($user->role === $newRole) {
            return response()->json([
                'message' => "User is already assigned the '{$newRole}' role.",
            ], 422);
        }

        // Safeguard: Check if demoting the last active administrator
        if ($user->role === 'admin' && $newRole === 'user') {
            $activeAdminCount = User::whereNull('deleted_at')
                ->where('role', 'admin')
                ->count();

            if ($activeAdminCount <= 1) {
                return response()->json([
                    'message' => 'Security safeguard: Cannot demote the platform’s last remaining active administrator.',
                ], 422);
            }
        }

        $oldRole = $user->role;
        $user->role = $newRole;
        $user->save();

        // Record audit log
        ModerationAuditLog::record(
            $admin->id,
            $user->id,
            'role_change',
            $validated['reason'],
            "Role modified from {$oldRole} to {$newRole}",
            [
                'target_username' => $user->username,
                'previous_role' => $oldRole,
                'new_role' => $newRole,
            ],
            $request->ip()
        );

        // Notification
        Notification::create([
            'user_id' => $user->id,
            'type' => 'role_updated',
            'title' => 'Account Role Updated',
            'message' => "Your CodeArena account role has been updated to {$newRole}.",
            'data' => ['old_role' => $oldRole, 'new_role' => $newRole],
            'is_read' => false,
        ]);

        return response()->json([
            'message' => "Role for @{$user->username} updated to '{$newRole}'.",
            'user' => [
                'id' => $user->id,
                'role' => $user->role,
            ],
        ]);
    }

    /**
     * Soft-delete account with safety checks and reversible recovery window.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'reason' => 'required|string|min:3|max:1000',
            'internal_notes' => 'nullable|string|max:2000',
        ]);

        $admin = $request->user();
        $user = User::findOrFail($id);

        // Safeguard 1: Admin cannot delete themselves
        if ($admin->id === $user->id) {
            return response()->json([
                'message' => 'Security safeguard: Administrators cannot delete their own account from the admin dashboard.',
            ], 422);
        }

        // Safeguard 2: Cannot delete the last active administrator
        if ($user->role === 'admin') {
            $activeAdminCount = User::whereNull('deleted_at')
                ->where('role', 'admin')
                ->count();

            if ($activeAdminCount <= 1) {
                return response()->json([
                    'message' => 'Security safeguard: Cannot delete the platform’s last remaining active administrator.',
                ], 422);
            }
        }

        // Revoke tokens
        $user->tokens()->delete();

        // Record audit log before deletion
        ModerationAuditLog::record(
            $admin->id,
            $user->id,
            'soft_delete',
            $validated['reason'],
            $validated['internal_notes'] ?? null,
            [
                'target_username' => $user->username,
                'target_email' => $user->email,
            ],
            $request->ip()
        );

        // Soft delete
        $user->delete();

        return response()->json([
            'message' => "Account @{$user->username} has been soft-deleted. It can be restored during the recovery window.",
        ]);
    }

    /**
     * Restore a soft-deleted user account.
     */
    public function restore(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'reason' => 'nullable|string|max:1000',
            'internal_notes' => 'nullable|string|max:2000',
        ]);

        $admin = $request->user();
        $user = User::onlyTrashed()->findOrFail($id);

        $user->restore();

        $reason = $validated['reason'] ?? 'Account restored by administrator from recovery window.';

        // Record audit log
        ModerationAuditLog::record(
            $admin->id,
            $user->id,
            'restore',
            $reason,
            $validated['internal_notes'] ?? null,
            ['target_username' => $user->username],
            $request->ip()
        );

        return response()->json([
            'message' => "Account @{$user->username} has been restored successfully.",
            'user' => [
                'id' => $user->id,
                'status' => $user->status,
                'deleted_at' => null,
            ],
        ]);
    }

    /**
     * Permanently purge user data after double-confirmation.
     */
    public function forceDelete(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'confirm_username' => 'required|string',
            'reason' => 'required|string|min:3|max:1000',
            'internal_notes' => 'nullable|string|max:2000',
        ]);

        $admin = $request->user();
        $user = User::withTrashed()->findOrFail($id);

        if ($admin->id === $user->id) {
            return response()->json([
                'message' => 'Security safeguard: You cannot permanently delete your own account.',
            ], 422);
        }

        if (strtolower(trim($validated['confirm_username'])) !== strtolower($user->username)) {
            return response()->json([
                'message' => 'Confirmation failure: Provided username does not match the target account.',
            ], 422);
        }

        if ($user->role === 'admin') {
            $adminCount = User::where('role', 'admin')->count();
            if ($adminCount <= 1) {
                return response()->json([
                    'message' => 'Security safeguard: Cannot permanently purge the only platform administrator.',
                ], 422);
            }
        }

        $userId = $user->id;
        $username = $user->username;
        $email = $user->email;

        // Record audit log entry before destroying user reference
        ModerationAuditLog::record(
            $admin->id,
            null, // user id will be nullified
            'force_delete',
            $validated['reason'],
            $validated['internal_notes'] ?? null,
            [
                'purged_user_id' => $userId,
                'purged_username' => $username,
                'purged_email' => $email,
            ],
            $request->ip()
        );

        // Safe cascading / clean-up of personal data
        DB::transaction(function () use ($user) {
            // Delete personal tokens, streak, scratchpad notes, notifications, interview sessions
            $user->tokens()->delete();
            $user->streak()->delete();
            $user->notes()->delete();
            $user->notifications()->delete();
            $user->shareableCard()->delete();
            $user->interviewSessions()->delete();
            $user->gitPlaygroundProgress()->delete();
            $user->dailyMissions()->delete();
            $user->questProgress()->delete();
            $user->questPathCompletions()->delete();
            $user->dailyCompletions()->delete();
            $user->roadmapProgress()->delete();
            $user->snakeGames()->delete();
            $user->contestParticipants()->delete();

            // Force delete user model
            $user->forceDelete();
        });

        return response()->json([
            'message' => "Account @{$username} and personal records have been permanently purged according to data-retention policy.",
        ]);
    }
}
