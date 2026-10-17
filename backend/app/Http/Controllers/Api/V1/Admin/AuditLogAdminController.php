<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\ModerationAuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AuditLogAdminController extends Controller
{
    /**
     * List moderation audit logs with filtering and pagination (append-only log).
     */
    public function index(Request $request): JsonResponse
    {
        $query = ModerationAuditLog::with([
            'admin:id,name,username,email,avatar',
            'targetUser:id,name,username,email,avatar',
        ])->latest();

        // 1. Filter by action
        if ($action = $request->input('action')) {
            if ($action !== 'all') {
                $query->where('action', $action);
            }
        }

        // 2. Filter by admin_id
        if ($adminId = $request->input('admin_id')) {
            $query->where('admin_id', $adminId);
        }

        // 3. Filter by target_user_id
        if ($targetId = $request->input('target_user_id')) {
            $query->where('target_user_id', $targetId);
        }

        // 4. Search by keyword
        if ($search = $request->input('search')) {
            $search = strtolower(trim($search));
            $query->where(function ($q) use ($search) {
                $q->where(DB::raw('LOWER(reason)'), 'like', "%{$search}%")
                  ->orWhere(DB::raw('LOWER(internal_notes)'), 'like', "%{$search}%")
                  ->orWhereHas('admin', function ($aq) use ($search) {
                      $aq->where(DB::raw('LOWER(username)'), 'like', "%{$search}%")
                         ->orWhere(DB::raw('LOWER(name)'), 'like', "%{$search}%");
                  })
                  ->orWhereHas('targetUser', function ($tq) use ($search) {
                      $tq->where(DB::raw('LOWER(username)'), 'like', "%{$search}%")
                         ->orWhere(DB::raw('LOWER(name)'), 'like', "%{$search}%");
                  });
            });
        }

        $perPage = min(max((int) $request->input('per_page', 20), 5), 100);
        $logs = $query->paginate($perPage);

        // Action statistics
        $actionCounts = ModerationAuditLog::selectRaw('action, count(*) as count')
            ->groupBy('action')
            ->pluck('count', 'action');

        return response()->json([
            'logs' => $logs,
            'action_counts' => $actionCounts,
        ]);
    }

    /**
     * Show single audit log detail.
     */
    public function show(int $id): JsonResponse
    {
        $log = ModerationAuditLog::with([
            'admin:id,name,username,email',
            'targetUser:id,name,username,email',
        ])->findOrFail($id);

        return response()->json([
            'log' => $log,
        ]);
    }
}
