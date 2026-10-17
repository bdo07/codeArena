<?php

namespace Tests\Feature;

use App\Models\AccountAppeal;
use App\Models\Challenge;
use App\Models\ModerationAuditLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminUserManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_regular_user_cannot_access_user_management_endpoints(): void
    {
        $regularUser = User::factory()->create(['role' => 'user']);
        $targetUser = User::factory()->create(['role' => 'user']);

        $resIndex = $this->actingAs($regularUser, 'sanctum')->getJson('/api/v1/admin/users');
        $resIndex->assertStatus(403);

        $resWarn = $this->actingAs($regularUser, 'sanctum')->postJson("/api/v1/admin/users/{$targetUser->id}/warn", [
            'reason' => 'Test reason',
        ]);
        $resWarn->assertStatus(403);

        $resSuspend = $this->actingAs($regularUser, 'sanctum')->postJson("/api/v1/admin/users/{$targetUser->id}/suspend", [
            'reason' => 'Test reason',
        ]);
        $resSuspend->assertStatus(403);

        $resAudit = $this->actingAs($regularUser, 'sanctum')->getJson('/api/v1/admin/audit-logs');
        $resAudit->assertStatus(403);
    }

    public function test_admin_can_list_search_and_filter_users(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'username' => 'superadmin']);
        $user1 = User::factory()->create(['name' => 'Alice Wonder', 'username' => 'alice', 'role' => 'user', 'status' => 'active']);
        $user2 = User::factory()->create(['name' => 'Bob Marley', 'username' => 'bob', 'role' => 'user', 'status' => 'suspended']);

        // List all
        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/users');
        $response->assertStatus(200)
            ->assertJsonStructure([
                'users' => [
                    'data' => [
                        '*' => ['id', 'username', 'email', 'role', 'status', 'is_suspended', 'is_banned', 'xp', 'level'],
                    ],
                ],
                'stats' => ['total', 'active', 'suspended', 'banned', 'deleted', 'admins'],
            ]);

        // Search by username
        $searchRes = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/users?search=alice');
        $searchRes->assertStatus(200)
            ->assertJsonCount(1, 'users.data')
            ->assertJsonPath('users.data.0.username', 'alice');

        // Filter by status = suspended
        $filterRes = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/users?status=suspended');
        $filterRes->assertStatus(200)
            ->assertJsonPath('users.data.0.username', 'bob');

        // Ensure passwords and remember tokens are NOT in response
        $this->assertStringNotContainsString('password', json_encode($response->json()));
        $this->assertStringNotContainsString('remember_token', json_encode($response->json()));
    }

    public function test_admin_can_warn_user_and_create_audit_log_and_notification(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $targetUser = User::factory()->create(['role' => 'user', 'username' => 'troublemaker']);

        $response = $this->actingAs($admin, 'sanctum')->postJson("/api/v1/admin/users/{$targetUser->id}/warn", [
            'reason' => 'Inappropriate discussion comments regarding problem hints.',
            'internal_notes' => 'First verbal warning before temporary suspension.',
        ]);

        $response->assertStatus(200);

        // Verify audit log
        $this->assertDatabaseHas('moderation_audit_logs', [
            'admin_id' => $admin->id,
            'target_user_id' => $targetUser->id,
            'action' => 'warn',
            'reason' => 'Inappropriate discussion comments regarding problem hints.',
            'internal_notes' => 'First verbal warning before temporary suspension.',
        ]);

        // Verify target user received notification
        $this->assertDatabaseHas('notifications', [
            'user_id' => $targetUser->id,
            'type' => 'moderation_warning',
            'message' => 'Inappropriate discussion comments regarding problem hints.',
        ]);
    }

    public function test_admin_can_suspend_user_and_enforce_block_on_actions(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $targetUser = User::factory()->create(['role' => 'user']);
        $challenge = Challenge::create([
            'slug' => 'test-submission-prob',
            'title' => 'Test Prob',
            'description' => 'Test Desc',
            'difficulty' => 'Easy',
            'time_limit_ms' => 2000,
            'memory_limit_mb' => 128,
            'is_published' => true,
        ]);

        // 1. Admin suspends user for 7 days
        $suspendRes = $this->actingAs($admin, 'sanctum')->postJson("/api/v1/admin/users/{$targetUser->id}/suspend", [
            'reason' => 'Suspicious automated submission rate detected.',
            'duration_days' => 7,
            'internal_notes' => 'Investigate bot activity.',
        ]);

        $suspendRes->assertStatus(200);

        $targetUser->refresh();
        $this->assertEquals('suspended', $targetUser->status);
        $this->assertNotNull($targetUser->suspended_until);
        $this->assertTrue($targetUser->isSuspended());

        // 2. Suspended user cannot perform protected actions (e.g. submit challenge)
        $actionRes = $this->actingAs($targetUser, 'sanctum')->postJson("/api/v1/challenges/{$challenge->id}/submit", [
            'language' => 'python',
            'code' => 'print(1)',
        ]);

        $actionRes->assertStatus(403)
            ->assertJsonPath('account_status', 'suspended')
            ->assertJsonPath('reason', 'Suspicious automated submission rate detected.')
            ->assertJsonPath('can_appeal', true);

        // Verify internal notes are NOT in the 403 response
        $this->assertStringNotContainsString('Investigate bot activity', json_encode($actionRes->json()));
    }

    public function test_temporary_suspension_auto_expires(): void
    {
        $user = User::factory()->create([
            'status' => 'suspended',
            'suspended_until' => now()->subMinutes(10), // expired in past
            'suspension_reason' => 'Past suspension',
        ]);

        // When isSuspended() is called, it auto-restores to active
        $this->assertFalse($user->isSuspended());

        $user->refresh();
        $this->assertEquals('active', $user->status);
        $this->assertNull($user->suspended_until);

        // Verify auto-unsuspend audit log created
        $this->assertDatabaseHas('moderation_audit_logs', [
            'target_user_id' => $user->id,
            'action' => 'unsuspend',
        ]);
    }

    public function test_admin_can_unsuspend_user(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $targetUser = User::factory()->create([
            'status' => 'suspended',
            'suspended_until' => now()->addDays(5),
            'suspension_reason' => 'Suspended for review',
        ]);

        $response = $this->actingAs($admin, 'sanctum')->postJson("/api/v1/admin/users/{$targetUser->id}/unsuspend", [
            'reason' => 'Account cleared after identity verification.',
        ]);

        $response->assertStatus(200);
        $targetUser->refresh();
        $this->assertEquals('active', $targetUser->status);
        $this->assertNull($targetUser->suspended_until);

        $this->assertDatabaseHas('moderation_audit_logs', [
            'admin_id' => $admin->id,
            'target_user_id' => $targetUser->id,
            'action' => 'unsuspend',
        ]);
    }

    public function test_admin_can_permanently_ban_user_and_block_login(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $targetUser = User::factory()->create([
            'role' => 'user',
            'email' => 'banned@codearena.dev',
            'password' => bcrypt('Secret123!'),
        ]);

        // Ban user
        $banRes = $this->actingAs($admin, 'sanctum')->postJson("/api/v1/admin/users/{$targetUser->id}/ban", [
            'reason' => 'Severe plagiarism and harassment violation.',
            'internal_notes' => 'IP blacklisted.',
        ]);

        $banRes->assertStatus(200);
        $targetUser->refresh();
        $this->assertEquals('banned', $targetUser->status);
        $this->assertNotNull($targetUser->banned_at);

        // Attempt login with valid credentials
        $loginRes = $this->postJson('/api/v1/auth/login', [
            'login' => 'banned@codearena.dev',
            'password' => 'Secret123!',
        ]);

        $loginRes->assertStatus(403)
            ->assertJsonPath('account_status', 'banned')
            ->assertJsonPath('can_appeal', true);
    }

    public function test_admin_cannot_suspend_or_ban_or_delete_self(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        // Self-suspend forbidden
        $suspendRes = $this->actingAs($admin, 'sanctum')->postJson("/api/v1/admin/users/{$admin->id}/suspend", [
            'reason' => 'Self suspend attempt',
        ]);
        $suspendRes->assertStatus(422);

        // Self-ban forbidden
        $banRes = $this->actingAs($admin, 'sanctum')->postJson("/api/v1/admin/users/{$admin->id}/ban", [
            'reason' => 'Self ban attempt',
        ]);
        $banRes->assertStatus(422);

        // Self-delete forbidden
        $delRes = $this->actingAs($admin, 'sanctum')->deleteJson("/api/v1/admin/users/{$admin->id}", [
            'reason' => 'Self delete attempt',
        ]);
        $delRes->assertStatus(422);
    }

    public function test_cannot_demote_or_delete_the_last_administrator(): void
    {
        // Only 1 admin in system
        $lastAdmin = User::factory()->create(['role' => 'admin']);

        $demoteRes = $this->actingAs($lastAdmin, 'sanctum')->putJson("/api/v1/admin/users/{$lastAdmin->id}/role", [
            'role' => 'user',
            'reason' => 'Demote attempt',
        ]);
        $demoteRes->assertStatus(422);

        $deleteRes = $this->actingAs($lastAdmin, 'sanctum')->deleteJson("/api/v1/admin/users/{$lastAdmin->id}", [
            'reason' => 'Delete attempt',
        ]);
        $deleteRes->assertStatus(422);
    }

    public function test_soft_delete_and_restoration_lifecycle(): void
    {
        $admin1 = User::factory()->create(['role' => 'admin']);
        $admin2 = User::factory()->create(['role' => 'admin']); // ensures > 1 admin
        $targetUser = User::factory()->create(['role' => 'user', 'username' => 'to_delete']);

        // Soft delete
        $delRes = $this->actingAs($admin1, 'sanctum')->deleteJson("/api/v1/admin/users/{$targetUser->id}", [
            'reason' => 'Account deleted per user request under privacy policy.',
        ]);
        $delRes->assertStatus(200);

        $targetUser->refresh();
        $this->assertTrue($targetUser->trashed());

        // Restore
        $restoreRes = $this->actingAs($admin1, 'sanctum')->postJson("/api/v1/admin/users/{$targetUser->id}/restore", [
            'reason' => 'Account restored upon user request within recovery window.',
        ]);
        $restoreRes->assertStatus(200);

        $targetUser->refresh();
        $this->assertFalse($targetUser->trashed());
    }

    public function test_appeal_submission_and_admin_review_workflow(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $suspendedUser = User::factory()->create([
            'role' => 'user',
            'status' => 'suspended',
            'suspended_until' => now()->addDays(14),
            'suspension_reason' => 'Suspicious activity',
        ]);

        // 1. User submits an appeal
        $appealRes = $this->actingAs($suspendedUser, 'sanctum')->postJson('/api/v1/appeals', [
            'reason' => 'My account was accessed from an unexpected IP address while traveling.',
            'contact_email' => 'appeal@example.com',
        ]);
        $appealRes->assertStatus(201);
        $appealId = $appealRes->json('appeal.id');

        // Cannot submit duplicate pending appeal
        $dupRes = $this->actingAs($suspendedUser, 'sanctum')->postJson('/api/v1/appeals', [
            'reason' => 'Second appeal attempt.',
        ]);
        $dupRes->assertStatus(422);

        // 2. Admin reviews and approves appeal with auto-reinstatement
        $reviewRes = $this->actingAs($admin, 'sanctum')->postJson("/api/v1/admin/appeals/{$appealId}/review", [
            'status' => 'approved',
            'resolution_notes' => 'Travel verified with support ticket #4912.',
            'auto_reinstate' => true,
        ]);

        $reviewRes->assertStatus(200)
            ->assertJsonPath('reinstated', true);

        $suspendedUser->refresh();
        $this->assertEquals('active', $suspendedUser->status);

        // Verify audit log for appeal review
        $this->assertDatabaseHas('moderation_audit_logs', [
            'admin_id' => $admin->id,
            'target_user_id' => $suspendedUser->id,
            'action' => 'appeal_approved',
        ]);
    }
}
