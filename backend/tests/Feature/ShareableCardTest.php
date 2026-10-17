<?php

namespace Tests\Feature;

use App\Models\Badge;
use App\Models\Challenge;
use App\Models\Submission;
use App\Models\User;
use App\Models\UserChallengeProgress;
use App\Models\UserShareableCard;
use App\Models\UserStreak;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ShareableCardTest extends TestCase
{
    use RefreshDatabase;

    public function test_get_settings_requires_authentication(): void
    {
        $response = $this->getJson('/api/v1/share-card/settings');
        $response->assertStatus(401);
    }

    public function test_authenticated_user_can_get_or_create_settings(): void
    {
        $user = User::factory()->create([
            'name' => 'Alice Developer',
            'username' => 'alicedev',
            'xp' => 350,
        ]);

        UserStreak::create([
            'user_id' => $user->id,
            'current_streak' => 4,
            'longest_streak' => 9,
            'last_activity_date' => now()->toDateString(),
        ]);

        $challenge = Challenge::create([
            'slug' => 'two-sum-card',
            'title' => 'Two Sum Challenge',
            'description' => 'Algorithm problem',
            'difficulty' => 'Easy',
            'category' => 'algorithms',
            'is_published' => true,
        ]);

        UserChallengeProgress::create([
            'user_id' => $user->id,
            'challenge_id' => $challenge->id,
            'best_score' => 100,
            'attempts_count' => 1,
            'solved_at' => now(),
        ]);

        Submission::create([
            'user_id' => $user->id,
            'challenge_id' => $challenge->id,
            'language' => 'python',
            'source_code' => 'def solve(): return 42',
            'status' => 'Accepted',
        ]);

        $response = $this->actingAs($user)->getJson('/api/v1/share-card/settings');

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.card.is_public', false) // Private by default
            ->assertJsonPath('data.card.template', 'modern')
            ->assertJsonPath('data.stats.solved_challenges', 1)
            ->assertJsonPath('data.stats.current_streak', 4);

        $this->assertDatabaseHas('user_shareable_cards', [
            'user_id' => $user->id,
            'is_public' => false,
        ]);
    }

    public function test_authenticated_user_can_update_card_settings(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->putJson('/api/v1/share-card/settings', [
            'is_public' => true,
            'template' => 'terminal',
            'card_theme' => 'obsidian',
            'layout' => 'square',
            'custom_tagline' => 'Building scalable web systems',
            'selected_fields' => ['avatar', 'tagline', 'solved', 'xp_level'],
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.card.is_public', true)
            ->assertJsonPath('data.card.template', 'terminal')
            ->assertJsonPath('data.card.card_theme', 'obsidian')
            ->assertJsonPath('data.card.layout', 'square')
            ->assertJsonPath('data.card.custom_tagline', 'Building scalable web systems');

        $this->assertDatabaseHas('user_shareable_cards', [
            'user_id' => $user->id,
            'is_public' => true,
            'template' => 'terminal',
        ]);
    }

    public function test_authenticated_user_can_regenerate_share_token(): void
    {
        $user = User::factory()->create();

        $initialCard = UserShareableCard::create([
            'user_id' => $user->id,
            'share_token' => 'old-initial-token-12345',
            'is_public' => true,
        ]);

        $response = $this->actingAs($user)->postJson('/api/v1/share-card/regenerate-token');

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success');

        $newToken = $response->json('data.share_token');
        $this->assertNotEmpty($newToken);
        $this->assertNotEquals('old-initial-token-12345', $newToken);

        $this->assertDatabaseMissing('user_shareable_cards', [
            'share_token' => 'old-initial-token-12345',
        ]);
        $this->assertDatabaseHas('user_shareable_cards', [
            'user_id' => $user->id,
            'share_token' => $newToken,
        ]);
    }

    public function test_public_card_endpoint_returns_404_when_card_is_private(): void
    {
        $user = User::factory()->create();
        $card = UserShareableCard::create([
            'user_id' => $user->id,
            'share_token' => 'secret-private-token-999',
            'is_public' => false, // Private!
        ]);

        $response = $this->getJson("/api/v1/share-card/public/{$card->share_token}");
        $response->assertStatus(404)
            ->assertJsonPath('status', 'error');
    }

    public function test_public_card_endpoint_returns_sanitized_data_when_public(): void
    {
        $user = User::factory()->create([
            'name' => 'Bob Smith',
            'username' => 'bobsmith',
            'email' => 'bob.secret@example.com',
            'xp' => 600,
        ]);

        $card = UserShareableCard::create([
            'user_id' => $user->id,
            'share_token' => 'valid-public-token-abc',
            'is_public' => true,
            'template' => 'modern',
            'card_theme' => 'dark',
            'layout' => 'horizontal',
            'custom_tagline' => 'Fullstack Dev',
            'selected_fields' => ['avatar', 'tagline', 'solved', 'xp_level'],
        ]);

        $response = $this->getJson("/api/v1/share-card/public/{$card->share_token}");

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.user.username', 'bobsmith')
            ->assertJsonPath('data.card.custom_tagline', 'Fullstack Dev');

        // Verify privacy: email must NEVER be returned in public card data
        $this->assertArrayNotHasKey('email', $response->json('data.user'));
        $this->assertArrayNotHasKey('password', $response->json('data.user'));
    }

    public function test_regenerating_token_invalidates_previous_public_url(): void
    {
        $user = User::factory()->create();
        $card = UserShareableCard::create([
            'user_id' => $user->id,
            'share_token' => 'revokable-token-111',
            'is_public' => true,
        ]);

        // Initially public URL works
        $firstResponse = $this->getJson("/api/v1/share-card/public/{$card->share_token}");
        $firstResponse->assertStatus(200);

        // Regenerate token
        $this->actingAs($user)->postJson('/api/v1/share-card/regenerate-token');

        // Previous token must now 404
        $secondResponse = $this->getJson('/api/v1/share-card/public/revokable-token-111');
        $secondResponse->assertStatus(404);
    }
}
