<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\ShareableCardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShareableCardController extends Controller
{
    public function __construct(
        protected ShareableCardService $cardService
    ) {}

    /**
     * Get authenticated user's card settings and live statistics.
     */
    public function getSettings(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $result = $this->cardService->getOrCreateSettings($user);

        return response()->json([
            'status' => 'success',
            'data' => $result,
        ]);
    }

    /**
     * Update card customization settings.
     */
    public function updateSettings(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $validated = $request->validate([
            'is_public' => 'nullable|boolean',
            'template' => 'nullable|string|in:modern,terminal,minimal,badge_spotlight',
            'card_theme' => 'nullable|string|in:dark,light,obsidian,violet',
            'layout' => 'nullable|string|in:horizontal,square',
            'selected_fields' => 'nullable|array',
            'selected_fields.*' => 'string|in:avatar,tagline,solved,xp_level,streak,badges,skills,git,interviews',
            'custom_tagline' => 'nullable|string|max:100',
        ]);

        $result = $this->cardService->updateSettings($user, $validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Card settings updated.',
            'data' => $result,
        ]);
    }

    /**
     * Regenerate share token to revoke previous public link.
     */
    public function regenerateToken(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $card = $this->cardService->regenerateToken($user);

        return response()->json([
            'status' => 'success',
            'message' => 'Share token regenerated. Previous public link has been revoked.',
            'data' => [
                'share_token' => $card->share_token,
            ],
        ]);
    }

    /**
     * Get public sanitized progress card data.
     */
    public function showPublic(string $token): JsonResponse
    {
        $cardData = $this->cardService->getPublicCard($token);

        if (!$cardData) {
            return response()->json([
                'status' => 'error',
                'message' => 'This progress card is private or does not exist.',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => $cardData,
        ]);
    }
}
