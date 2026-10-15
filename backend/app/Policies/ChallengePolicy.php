<?php

namespace App\Policies;

use App\Models\Challenge;
use App\Models\User;

class ChallengePolicy
{
    /**
     * Determine whether the user can create challenges.
     */
    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can update the challenge.
     */
    public function update(User $user, Challenge $challenge): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can delete the challenge.
     */
    public function delete(User $user, Challenge $challenge): bool
    {
        return $user->isAdmin();
    }
}
