<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ChangePasswordTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_successfully_change_password(): void
    {
        $user = User::factory()->create([
            'email' => 'alex@example.com',
            'password' => Hash::make('OldPassword123!'),
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->putJson('/api/v1/auth/password', [
                'current_password' => 'OldPassword123!',
                'password' => 'BrandNewPassword123!',
                'password_confirmation' => 'BrandNewPassword123!',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Password changed successfully.',
            ])
            ->assertJsonMissing(['password', 'password_hash']);

        // Verify password was updated in database and hashed
        $user->refresh();
        $this->assertTrue(Hash::check('BrandNewPassword123!', $user->password));
        $this->assertFalse(Hash::check('OldPassword123!', $user->password));

        // Verify user can login with new password
        $loginRes = $this->postJson('/api/v1/auth/login', [
            'login' => 'alex@example.com',
            'password' => 'BrandNewPassword123!',
        ]);
        $loginRes->assertStatus(200);

        // Verify old password fails
        $oldLoginRes = $this->postJson('/api/v1/auth/login', [
            'login' => 'alex@example.com',
            'password' => 'OldPassword123!',
        ]);
        $oldLoginRes->assertStatus(422);
    }

    public function test_password_change_fails_with_incorrect_current_password(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('CorrectPassword123!'),
        ]);

        $response = $this->actingAs($user, 'sanctum')->putJson('/api/v1/auth/password', [
            'current_password' => 'WrongCurrentPassword!',
            'password' => 'NewStrongPassword123!',
            'password_confirmation' => 'NewStrongPassword123!',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['current_password']);

        $user->refresh();
        $this->assertTrue(Hash::check('CorrectPassword123!', $user->password));
    }

    public function test_password_change_fails_when_confirmation_does_not_match(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('OriginalPassword123!'),
        ]);

        $response = $this->actingAs($user, 'sanctum')->putJson('/api/v1/auth/password', [
            'current_password' => 'OriginalPassword123!',
            'password' => 'NewPassword123!',
            'password_confirmation' => 'MismatchingConfirmation123!',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);

        $user->refresh();
        $this->assertTrue(Hash::check('OriginalPassword123!', $user->password));
    }

    public function test_password_change_fails_when_password_too_short(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('OriginalPassword123!'),
        ]);

        $response = $this->actingAs($user, 'sanctum')->putJson('/api/v1/auth/password', [
            'current_password' => 'OriginalPassword123!',
            'password' => 'short',
            'password_confirmation' => 'short',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    public function test_password_change_fails_when_new_password_is_same_as_current(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('SamePassword123!'),
        ]);

        $response = $this->actingAs($user, 'sanctum')->putJson('/api/v1/auth/password', [
            'current_password' => 'SamePassword123!',
            'password' => 'SamePassword123!',
            'password_confirmation' => 'SamePassword123!',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $response = $this->putJson('/api/v1/auth/password', [
            'current_password' => 'CurrentSecret123!',
            'password' => 'NewSecretPassword123!',
            'password_confirmation' => 'NewSecretPassword123!',
        ]);

        $response->assertStatus(401);
    }

    public function test_one_user_cannot_change_another_users_password(): void
    {
        $victim = User::factory()->create([
            'password' => Hash::make('VictimPass123!'),
        ]);

        $attacker = User::factory()->create([
            'password' => Hash::make('AttackerPass123!'),
        ]);

        // Attacker attempts to target victim by supplying victim's user ID or fields
        $response = $this->actingAs($attacker, 'sanctum')->putJson('/api/v1/auth/password', [
            'user_id' => $victim->id,
            'id' => $victim->id,
            'current_password' => 'AttackerPass123!',
            'password' => 'AttackerNewPass123!',
            'password_confirmation' => 'AttackerNewPass123!',
        ]);

        $response->assertStatus(200);

        // Attacker's password was changed
        $attacker->refresh();
        $this->assertTrue(Hash::check('AttackerNewPass123!', $attacker->password));

        // Victim's password remains unchanged
        $victim->refresh();
        $this->assertTrue(Hash::check('VictimPass123!', $victim->password));
        $this->assertFalse(Hash::check('AttackerNewPass123!', $victim->password));
    }

    public function test_password_change_revokes_other_tokens_but_preserves_current_token(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('OldPass123!'),
        ]);

        $currentToken = $user->createToken('current_device');
        $otherToken1 = $user->createToken('other_device_1');
        $otherToken2 = $user->createToken('other_device_2');

        $this->assertCount(3, $user->tokens);

        $response = $this->withHeader('Authorization', "Bearer {$currentToken->plainTextToken}")
            ->putJson('/api/v1/auth/password', [
                'current_password' => 'OldPass123!',
                'password' => 'NewPass123!',
                'password_confirmation' => 'NewPass123!',
            ]);

        $response->assertStatus(200);

        $user->refresh();
        // Only current token should remain
        $this->assertCount(1, $user->tokens);
        $this->assertEquals($currentToken->accessToken->id, $user->tokens->first()->id);

        // Current token is still valid for subsequent requests
        $meResponse = $this->withHeader('Authorization', "Bearer {$currentToken->plainTextToken}")
            ->getJson('/api/v1/auth/me');
        $meResponse->assertStatus(200);

        // Other tokens are revoked from database
        $this->assertDatabaseMissing('personal_access_tokens', [
            'id' => $otherToken1->accessToken->id,
        ]);
        $this->assertDatabaseMissing('personal_access_tokens', [
            'id' => $otherToken2->accessToken->id,
        ]);

        // Reset test environment guard cache so Sanctum re-authenticates token
        $this->app['auth']->forgetGuards();

        // Other tokens are revoked (cannot authenticate)
        $revokedResponse = $this->withHeader('Authorization', "Bearer {$otherToken1->plainTextToken}")
            ->getJson('/api/v1/auth/me');
        $revokedResponse->assertStatus(401);
    }

    public function test_password_change_endpoint_is_rate_limited(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('OldPass123!'),
        ]);

        // Attempt 5 requests (throttle limit is 5 per minute)
        for ($i = 0; $i < 5; $i++) {
            $response = $this->actingAs($user, 'sanctum')->putJson('/api/v1/auth/password', [
                'current_password' => 'WrongPass',
                'password' => 'NewPass123!',
                'password_confirmation' => 'NewPass123!',
            ]);
            $this->assertNotEquals(429, $response->getStatusCode());
        }

        // 6th attempt should be blocked by rate limiter
        $blockedResponse = $this->actingAs($user, 'sanctum')->putJson('/api/v1/auth/password', [
            'current_password' => 'WrongPass',
            'password' => 'NewPass123!',
            'password_confirmation' => 'NewPass123!',
        ]);

        $blockedResponse->assertStatus(429);
    }
}
