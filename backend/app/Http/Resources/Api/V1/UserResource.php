<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'username' => $this->username,
            'email' => $this->email,
            'role' => $this->role,
            'xp' => $this->xp,
            'level' => $this->calculateLevel(),
            'avatar_url' => $this->avatar_url,
            'tagline' => $this->tagline,
            'bio' => $this->bio,
            'location' => $this->location,
            'website_url' => $this->website_url,
            'github_url' => $this->github_url,
            'linkedin_url' => $this->linkedin_url,
            'favorite_languages' => $this->favorite_languages ?? [],
            'is_activity_public' => (bool) ($this->is_activity_public ?? true),
            'status' => $this->status ?? 'active',
            'is_suspended' => $this->isSuspended(),
            'suspended_until' => $this->suspended_until?->toIso8601String(),
            'suspension_reason' => $this->suspension_reason,
            'is_banned' => $this->isBanned(),
            'banned_at' => $this->banned_at?->toIso8601String(),
            'ban_reason' => $this->ban_reason,
            'deleted_at' => $this->deleted_at?->toIso8601String(),
            'badges' => $this->badges ? $this->badges->map(fn ($b) => [
                'id' => $b->id,
                'name' => $b->name,
                'slug' => $b->slug,
                'description' => $b->description,
                'icon' => $b->icon,
                'earned_at' => $b->pivot?->earned_at,
            ]) : [],
            'created_at' => $this->created_at?->toIso8601String(),
            'joined_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
