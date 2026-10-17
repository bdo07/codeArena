<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAccountActive
{
    /**
     * Handle an incoming request.
     * Enforce account active status on protected actions.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return $next($request);
        }

        // Check if soft-deleted
        if ($user->trashed()) {
            return response()->json([
                'message' => 'Account has been deleted.',
                'account_status' => 'deleted',
            ], 403);
        }

        // Check if banned
        if ($user->isBanned()) {
            return response()->json([
                'message' => 'Your account has been permanently banned from CodeArena.',
                'account_status' => 'banned',
                'reason' => $user->ban_reason,
                'banned_at' => $user->banned_at?->toIso8601String(),
                'can_appeal' => true,
            ], 403);
        }

        // Check if suspended (handles auto-expiration within isSuspended)
        if ($user->isSuspended()) {
            return response()->json([
                'message' => 'Your account is suspended and cannot perform this action.',
                'account_status' => 'suspended',
                'reason' => $user->suspension_reason,
                'suspended_until' => $user->suspended_until?->toIso8601String(),
                'is_indefinite' => is_null($user->suspended_until),
                'can_appeal' => true,
            ], 403);
        }

        return $next($request);
    }
}
