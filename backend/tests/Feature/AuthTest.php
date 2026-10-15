<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register_with_valid_data(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'John Doe',
            'username' => 'johndoe',
            'email' => 'john@example.com',
            'password' => 'SecurePass123!',
            'password_confirmation' => 'SecurePass123!',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'user' => ['id', 'name', 'username', 'email', 'role', 'xp', 'level'],
                'token',
            ]);

        $this->assertDatabaseHas('users', [
            'username' => 'johndoe',
            'email' => 'john@example.com',
            'role' => 'user',
        ]);
    }

    public function test_registration_fails_with_duplicate_email_or_username(): void
    {
        User::factory()->create([
            'username' => 'existing_user',
            'email' => 'existing@example.com',
        ]);

        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Another User',
            'username' => 'existing_user',
            'email' => 'existing@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['username', 'email']);
    }

    public function test_user_can_login_with_email_or_username(): void
    {
        $user = User::factory()->create([
            'username' => 'devcoder',
            'email' => 'coder@example.com',
            'password' => bcrypt('Secret123!'),
        ]);

        // Login with email
        $resEmail = $this->postJson('/api/v1/auth/login', [
            'login' => 'coder@example.com',
            'password' => 'Secret123!',
        ]);
        $resEmail->assertStatus(200)->assertJsonStructure(['user', 'token']);

        // Login with username
        $resUsername = $this->postJson('/api/v1/auth/login', [
            'login' => 'devcoder',
            'password' => 'Secret123!',
        ]);
        $resUsername->assertStatus(200)->assertJsonStructure(['user', 'token']);
    }

    public function test_authenticated_user_can_fetch_own_profile(): void
    {
        $user = User::factory()->create(['username' => 'activecoder']);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/auth/me');

        $response->assertStatus(200)
            ->assertJsonPath('user.username', 'activecoder');
    }
}
