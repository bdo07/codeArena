<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Challenge;
use App\Models\Discussion;
use App\Models\DiscussionLike;
use App\Models\DiscussionReply;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DiscussionController extends Controller
{
    /**
     * List discussions for a challenge
     */
    public function index(Challenge $challenge, Request $request): JsonResponse
    {
        $user = $request->user('sanctum');

        $discussions = Discussion::where('challenge_id', $challenge->id)
            ->with(['user:id,name,username,xp,avatar', 'replies.user:id,name,username,xp,avatar'])
            ->orderByDesc('is_pinned')
            ->orderByDesc('upvotes_count')
            ->orderByDesc('created_at')
            ->paginate(20);

        $likedDiscussionIds = [];
        $likedReplyIds = [];
        if ($user) {
            $likedDiscussionIds = DiscussionLike::where('user_id', $user->id)
                ->where('likable_type', Discussion::class)
                ->pluck('likable_id')
                ->toArray();

            $likedReplyIds = DiscussionLike::where('user_id', $user->id)
                ->where('likable_type', DiscussionReply::class)
                ->pluck('likable_id')
                ->toArray();
        }

        return response()->json([
            'data' => $discussions->items(),
            'meta' => [
                'current_page' => $discussions->currentPage(),
                'last_page' => $discussions->lastPage(),
                'total' => $discussions->total(),
            ],
            'liked_discussion_ids' => $likedDiscussionIds,
            'liked_reply_ids' => $likedReplyIds,
        ]);
    }

    /**
     * Post a new discussion topic
     */
    public function store(Challenge $challenge, Request $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validate([
            'title' => 'required|string|max:200',
            'content' => 'required|string|max:10000',
            'category' => 'in:question,solution,general',
        ]);

        $discussion = Discussion::create([
            'user_id' => $user->id,
            'challenge_id' => $challenge->id,
            'title' => $validated['title'],
            'content' => $validated['content'],
            'category' => $validated['category'] ?? 'question',
            'upvotes_count' => 0,
        ]);

        $discussion->load('user:id,name,username,xp');

        return response()->json(['data' => $discussion], 201);
    }

    /**
     * Reply to a discussion
     */
    public function reply(int $discussionId, Request $request): JsonResponse
    {
        $user = $request->user();
        $discussion = Discussion::findOrFail($discussionId);

        $validated = $request->validate([
            'content' => 'required|string|max:5000',
        ]);

        $reply = DiscussionReply::create([
            'discussion_id' => $discussion->id,
            'user_id' => $user->id,
            'content' => $validated['content'],
            'upvotes_count' => 0,
        ]);

        // Send notification to discussion author if different user
        if ($discussion->user_id !== $user->id) {
            Notification::create([
                'user_id' => $discussion->user_id,
                'type' => 'reply',
                'title' => '💬 New Reply to Your Discussion',
                'message' => "{$user->username} replied to '{$discussion->title}'",
                'data' => [
                    'discussion_id' => $discussion->id,
                    'challenge_id' => $discussion->challenge_id,
                ],
            ]);
        }

        $reply->load('user:id,name,username,xp');

        return response()->json(['data' => $reply], 201);
    }

    /**
     * Toggle upvote/like on a discussion
     */
    public function toggleLikeDiscussion(int $id, Request $request): JsonResponse
    {
        $user = $request->user();
        $discussion = Discussion::findOrFail($id);

        $existing = DiscussionLike::where('user_id', $user->id)
            ->where('likable_type', Discussion::class)
            ->where('likable_id', $discussion->id)
            ->first();

        if ($existing) {
            $existing->delete();
            $discussion->decrement('upvotes_count');
            $liked = false;
        } else {
            DiscussionLike::create([
                'user_id' => $user->id,
                'likable_type' => Discussion::class,
                'likable_id' => $discussion->id,
            ]);
            $discussion->increment('upvotes_count');
            $liked = true;
        }

        return response()->json([
            'liked' => $liked,
            'upvotes_count' => $discussion->fresh()->upvotes_count,
        ]);
    }

    /**
     * Toggle upvote/like on a reply
     */
    public function toggleLikeReply(int $id, Request $request): JsonResponse
    {
        $user = $request->user();
        $reply = DiscussionReply::findOrFail($id);

        $existing = DiscussionLike::where('user_id', $user->id)
            ->where('likable_type', DiscussionReply::class)
            ->where('likable_id', $reply->id)
            ->first();

        if ($existing) {
            $existing->delete();
            $reply->decrement('upvotes_count');
            $liked = false;
        } else {
            DiscussionLike::create([
                'user_id' => $user->id,
                'likable_type' => DiscussionReply::class,
                'likable_id' => $reply->id,
            ]);
            $reply->increment('upvotes_count');
            $liked = true;
        }

        return response()->json([
            'liked' => $liked,
            'upvotes_count' => $reply->fresh()->upvotes_count,
        ]);
    }
}
