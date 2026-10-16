<?php

namespace Tests\Feature;

use App\Models\Challenge;
use App\Models\Submission;
use App\Models\User;
use App\Models\UserChallengeProgress;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_view_public_profile_by_username(): void
    {
        $user = User::factory()->create([
            'name' => 'Alice Developer',
            'username' => 'alicedev',
            'tagline' => 'Systems Programmer & Rust lover',
            'bio' => 'Building fast tools and learning compilers.',
            'location' => 'Paris, France',
            'website_url' => 'https://alice.dev',
            'github_url' => 'https://github.com/alicedev',
            'linkedin_url' => 'https://linkedin.com/in/alicedev',
            'favorite_languages' => ['rust', 'c', 'python'],
            'xp' => 1250,
        ]);

        $response = $this->getJson('/api/v1/users/alicedev');

        $response->assertStatus(200)
            ->assertJsonPath('profile.username', 'alicedev')
            ->assertJsonPath('profile.name', 'Alice Developer')
            ->assertJsonPath('profile.tagline', 'Systems Programmer & Rust lover')
            ->assertJsonPath('profile.bio', 'Building fast tools and learning compilers.')
            ->assertJsonPath('profile.location', 'Paris, France')
            ->assertJsonPath('profile.website_url', 'https://alice.dev')
            ->assertJsonPath('profile.favorite_languages.0', 'rust')
            ->assertJsonMissing(['password', 'remember_token', 'email_verified_at']);

        // Check alias route /api/v1/profile/username as well
        $aliasResponse = $this->getJson('/api/v1/profile/alicedev');
        $aliasResponse->assertStatus(200)
            ->assertJsonPath('profile.username', 'alicedev');
    }

    public function test_public_profile_returns_404_for_unknown_user(): void
    {
        $response = $this->getJson('/api/v1/users/nonexistent_ghost_coder');
        $response->assertStatus(404);
    }

    public function test_authenticated_user_can_update_profile(): void
    {
        $user = User::factory()->create([
            'username' => 'coder1',
            'name' => 'Initial Name',
        ]);

        $response = $this->actingAs($user)->putJson('/api/v1/profile', [
            'name' => 'Updated Name',
            'username' => 'coder_pro',
            'tagline' => 'Fullstack Artisan',
            'bio' => 'New bio text within character limit.',
            'location' => 'San Francisco, CA',
            'website_url' => 'https://coder.example.com',
            'github_url' => 'https://github.com/coder',
            'linkedin_url' => 'https://linkedin.com/in/coder',
            'favorite_languages' => ['typescript', 'python'],
            'is_activity_public' => true,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('message', 'Profile updated successfully.')
            ->assertJsonPath('user.username', 'coder_pro')
            ->assertJsonPath('user.tagline', 'Fullstack Artisan')
            ->assertJsonPath('user.location', 'San Francisco, CA');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'username' => 'coder_pro',
            'name' => 'Updated Name',
            'tagline' => 'Fullstack Artisan',
        ]);
    }

    public function test_profile_update_validation_fails_for_duplicate_username(): void
    {
        User::factory()->create(['username' => 'taken_handle']);
        $user = User::factory()->create(['username' => 'my_handle']);

        $response = $this->actingAs($user)->putJson('/api/v1/profile', [
            'name' => 'My Name',
            'username' => 'taken_handle',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['username']);
    }

    public function test_unauthenticated_user_cannot_update_profile(): void
    {
        $response = $this->putJson('/api/v1/profile', [
            'name' => 'Hacker Name',
            'username' => 'hacker',
        ]);

        $response->assertStatus(401);
    }

    public function test_authenticated_user_can_upload_valid_avatar(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();

        $file = UploadedFile::fake()->image('avatar.png', 200, 200)->size(500); // 500 KB

        $response = $this->actingAs($user)->postJson('/api/v1/profile/avatar', [
            'avatar' => $file,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('message', 'Avatar uploaded successfully.')
            ->assertJsonStructure(['avatar_url', 'user']);

        $user->refresh();
        $this->assertNotNull($user->avatar);
        Storage::disk('public')->assertExists($user->avatar);
    }

    public function test_avatar_upload_rejects_invalid_file_types_and_size(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();

        // Invalid file format (text/plain)
        $invalidFile = UploadedFile::fake()->create('malicious.sh', 50, 'application/x-sh');
        $response = $this->actingAs($user)->postJson('/api/v1/profile/avatar', [
            'avatar' => $invalidFile,
        ]);
        $response->assertStatus(422)->assertJsonValidationErrors(['avatar']);

        // Exceeding 2MB limit (3000 KB)
        $oversizedFile = UploadedFile::fake()->image('giant.jpg')->size(3000);
        $sizeResponse = $this->actingAs($user)->postJson('/api/v1/profile/avatar', [
            'avatar' => $oversizedFile,
        ]);
        $sizeResponse->assertStatus(422)->assertJsonValidationErrors(['avatar']);
    }

    public function test_avatar_upload_replaces_old_avatar_file(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();

        // First upload
        $file1 = UploadedFile::fake()->image('first.jpg', 100, 100);
        $this->actingAs($user)->postJson('/api/v1/profile/avatar', ['avatar' => $file1]);
        $user->refresh();
        $oldPath = $user->avatar;
        Storage::disk('public')->assertExists($oldPath);

        // Second upload
        $file2 = UploadedFile::fake()->image('second.png', 100, 100);
        $this->actingAs($user)->postJson('/api/v1/profile/avatar', ['avatar' => $file2]);
        $user->refresh();
        $newPath = $user->avatar;

        $this->assertNotEquals($oldPath, $newPath);
        Storage::disk('public')->assertMissing($oldPath);
        Storage::disk('public')->assertExists($newPath);
    }

    public function test_authenticated_user_can_delete_avatar(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();

        $file = UploadedFile::fake()->image('to_delete.jpg', 100, 100);
        $this->actingAs($user)->postJson('/api/v1/profile/avatar', ['avatar' => $file]);
        $user->refresh();
        $avatarPath = $user->avatar;
        Storage::disk('public')->assertExists($avatarPath);

        $delResponse = $this->actingAs($user)->deleteJson('/api/v1/profile/avatar');
        $delResponse->assertStatus(200)
            ->assertJsonPath('avatar_url', null);

        $user->refresh();
        $this->assertNull($user->avatar);
        Storage::disk('public')->assertMissing($avatarPath);
    }

    public function test_private_activity_setting_hides_solved_challenges_from_public(): void
    {
        $owner = User::factory()->create([
            'username' => 'private_coder',
            'is_activity_public' => false,
        ]);

        $challenge = Challenge::create([
            'title' => 'Sample Challenge',
            'slug' => 'sample-challenge-' . uniqid(),
            'description' => 'A test challenge description',
            'difficulty' => 'Easy',
            'category' => 'Algorithms',
            'time_limit_ms' => 1000,
            'memory_limit_mb' => 128,
            'is_published' => true,
        ]);

        UserChallengeProgress::create([
            'user_id' => $owner->id,
            'challenge_id' => $challenge->id,
            'solved_at' => now(),
            'best_score' => 100,
            'attempts_count' => 1,
        ]);

        // Anonymous viewer: solved_challenges and recent_activity should be empty
        $anonResponse = $this->getJson('/api/v1/users/private_coder');
        $anonResponse->assertStatus(200)
            ->assertJsonPath('profile.is_activity_public', false)
            ->assertJsonPath('profile.is_owner', false)
            ->assertJsonCount(0, 'profile.solved_challenges')
            ->assertJsonCount(0, 'profile.recent_activity');

        // Owner viewer: can see their own solved_challenges and recent_activity
        $ownerResponse = $this->actingAs($owner)->getJson('/api/v1/users/private_coder');
        $ownerResponse->assertStatus(200)
            ->assertJsonPath('profile.is_owner', true)
            ->assertJsonCount(1, 'profile.solved_challenges');
    }
}
