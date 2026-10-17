<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\AccountAppeal;
use App\Models\ModerationAuditLog;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AppealAdminController extends Controller
{
    /**
     * List user account appeals.
     */
    public function index(Request $request): JsonResponse
    {
        $query = AccountAppeal::with([
            'user:id,name,username,email,status,suspended_until,suspension_reason,banned_at,ban_reason,avatar',
            'reviewer:id,name,username',
        ])->latest();

        if ($status = $request->input('status')) {
            if (in_array($status, ['pending', 'approved', 'rejected'])) {
                $query->where('status', $status);
            }
        }

        $appeals = $query->paginate(15);

        $counts = [
            'pending' => AccountAppeal::where('status', 'pending')->count(),
            'approved' => AccountAppeal::where('status', 'approved')->count(),
            'rejected' => AccountAppeal::where('status', 'rejected')->count(),
            'total' => AccountAppeal::count(),
        ];

        return response()->json([
            'appeals' => $appeals,
            'counts' => $counts,
        ]);
    }

    /**
     * Review and resolve an account appeal.
     */
    public function review(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['approved', 'rejected'])],
            'resolution_notes' => 'required|string|min:3|max:2000',
            'rejection_reason' => 'nullable|string|max:1000',
            'auto_reinstate' => 'nullable|boolean',
        ]);

        $admin = $request->user();
        $appeal = AccountAppeal::with('user')->findOrFail($id);

        $targetUser = $appeal->user;
        $status = $validated['status'];

        $appeal->status = $status;
        $appeal->reviewed_by = $admin->id;
        $appeal->reviewed_at = now();
        $appeal->admin_notes = $validated['resolution_notes'];
        $appeal->rejection_reason = $status === 'rejected' ? ($validated['rejection_reason'] ?? $validated['resolution_notes']) : null;
        $appeal->save();

        $actionType = $status === 'approved' ? 'appeal_approved' : 'appeal_rejected';

        // If approved and auto_reinstate is true, lift suspension/ban
        $reinstated = false;
        if ($status === 'approved' && ($validated['auto_reinstate'] ?? true) && $targetUser) {
            if ($targetUser->status === User::STATUS_SUSPENDED) {
                $targetUser->status = User::STATUS_ACTIVE;
                $targetUser->suspended_until = null;
                $targetUser->suspension_reason = null;
                $targetUser->save();
                $reinstated = true;
            } elseif ($targetUser->status === User::STATUS_BANNED) {
                $targetUser->status = User::STATUS_ACTIVE;
                $targetUser->banned_at = null;
                $targetUser->ban_reason = null;
                $targetUser->save();
                $reinstated = true;
            }
        }

        // Record audit log
        ModerationAuditLog::record(
            $admin->id,
            $targetUser?->id,
            $actionType,
            "Appeal #{$appeal->id} {$status} by administrator.",
            $validated['resolution_notes'],
            [
                'appeal_id' => $appeal->id,
                'target_username' => $targetUser?->username,
                'reinstated' => $reinstated,
            ],
            $request->ip()
        );

        // Notify user if exists
        if ($targetUser) {
            $notificationMessage = $status === 'approved'
                ? 'Your account appeal has been approved by our moderation team. Your access has been restored.'
                : 'Your account appeal was reviewed and rejected. Reason: ' . ($appeal->rejection_reason ?? 'Violation confirmed.');

            Notification::create([
                'user_id' => $targetUser->id,
                'type' => 'appeal_' . $status,
                'title' => 'Appeal Decision: ' . ucfirst($status),
                'message' => $notificationMessage,
                'data' => [
                    'appeal_id' => $appeal->id,
                    'status' => $status,
                ],
                'is_read' => false,
            ]);
        }

        return response()->json([
            'message' => "Appeal #{$appeal->id} marked as {$status}.",
            'appeal' => $appeal->load('reviewer:id,name,username'),
            'reinstated' => $reinstated,
        ]);
    }
}
