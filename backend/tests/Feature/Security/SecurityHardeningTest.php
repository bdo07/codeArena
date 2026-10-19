<?php

namespace Tests\Feature\Security;

use App\Models\InterviewSession;
use App\Models\User;
use App\Services\CodeExecutionService;
use App\Services\SqlExecutionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SecurityHardeningTest extends TestCase
{
    use RefreshDatabase;

    /**
     * 1. CODE EXECUTION: Verify dangerous host system calls/modules are blocked.
     */
    public function test_code_runner_blocks_dangerous_host_system_calls_in_python(): void
    {
        $service = app(CodeExecutionService::class);

        $maliciousCode = "import os\nprint(os.listdir('/'))";
        $result = $service->execute('python', $maliciousCode, '', 'expected');

        $this->assertEquals('Runtime Error', $result['status']);
        $this->assertFalse($result['passed']);
        $this->assertStringContainsString('Security Violation', $result['stderr']);
    }

    public function test_code_runner_blocks_dangerous_eval_in_python(): void
    {
        $service = app(CodeExecutionService::class);

        $maliciousCode = "x = eval(\"__import__('os').system('ls')\")";
        $result = $service->execute('python', $maliciousCode, '', 'expected');

        $this->assertEquals('Runtime Error', $result['status']);
        $this->assertStringContainsString('Security Violation', $result['stderr']);
    }

    public function test_code_runner_blocks_dangerous_modules_in_javascript(): void
    {
        $service = app(CodeExecutionService::class);

        $maliciousCode = "const fs = require('fs');\nconsole.log(fs.readFileSync('/etc/passwd'));";
        $result = $service->execute('javascript', $maliciousCode, '', 'expected');

        $this->assertEquals('Runtime Error', $result['status']);
        $this->assertStringContainsString('Security Violation', $result['stderr']);
    }

    public function test_code_runner_blocks_host_headers_in_cpp(): void
    {
        $service = app(CodeExecutionService::class);

        $maliciousCode = "#include <cstdlib>\nint main() { system(\"ls\"); return 0; }";
        $result = $service->execute('cpp', $maliciousCode, '', 'expected');

        $this->assertEquals('Runtime Error', $result['status']);
        $this->assertStringContainsString('Security Violation', $result['stderr']);
    }

    /**
     * 2. SQL RUNNER: Verify mutating and multi-statement queries are strictly blocked.
     */
    public function test_sql_runner_blocks_mutating_and_ddl_queries(): void
    {
        $service = app(SqlExecutionService::class);
        $schema = "CREATE TABLE items (id INT, name TEXT);";
        $seed = "INSERT INTO items VALUES (1, 'Widget');";

        // DROP TABLE
        $resDrop = $service->execute($schema, $seed, "DROP TABLE items;");
        $this->assertFalse($resDrop['success']);
        $this->assertStringContainsString('Disallowed SQL statement', $resDrop['error']);

        // DELETE
        $resDelete = $service->execute($schema, $seed, "DELETE FROM items WHERE id = 1;");
        $this->assertFalse($resDelete['success']);
        $this->assertStringContainsString('Disallowed SQL statement', $resDelete['error']);

        // Non-SELECT query (UPDATE)
        $resUpdate = $service->execute($schema, $seed, "UPDATE items SET name = 'Hacked';");
        $this->assertFalse($resUpdate['success']);
        $this->assertStringContainsString('Disallowed SQL statement', $resUpdate['error']);
    }

    public function test_sql_runner_blocks_multi_statement_queries(): void
    {
        $service = app(SqlExecutionService::class);
        $schema = "CREATE TABLE items (id INT, name TEXT);";
        $seed = "INSERT INTO items VALUES (1, 'Widget');";

        $res = $service->execute($schema, $seed, "SELECT * FROM items; DROP TABLE items;");
        $this->assertFalse($res['success']);
        $this->assertStringContainsString('Multi-statement', $res['error']);
    }

    public function test_sql_runner_caps_excessive_row_fetching_to_prevent_dos(): void
    {
        $service = app(SqlExecutionService::class);
        $schema = "CREATE TABLE nums (val INT);";
        // Create 600 records in seed
        $seedRows = [];
        for ($i = 0; $i < 600; $i++) {
            $seedRows[] = "({$i})";
        }
        $seed = "INSERT INTO nums VALUES " . implode(',', $seedRows) . ";";

        // Query returning all 600 rows
        $res = $service->execute($schema, $seed, "SELECT * FROM nums;");
        $this->assertFalse($res['success']);
        $this->assertStringContainsString('Query returned too many rows', $res['error']);
    }

    /**
     * 3. IDOR / BOLA: Interview results and learning reports.
     */
    public function test_user_cannot_view_another_users_interview_results(): void
    {
        $owner = User::factory()->create();
        $stranger = User::factory()->create();

        $session = InterviewSession::create([
            'user_id' => $owner->id,
            'session_token' => 'secure-interview-token-12345',
            'topic' => 'algorithms',
            'difficulty' => 'Medium',
            'duration_minutes' => 30,
            'status' => 'completed',
            'questions_payload' => [],
            'answers_payload' => [],
            'score' => 85,
            'started_at' => now(),
            'expires_at' => now()->addMinutes(30),
            'completed_at' => now(),
        ]);

        // Unauthenticated access attempt
        $resUnauth = $this->getJson("/api/v1/interviews/{$session->session_token}/result");
        $resUnauth->assertStatus(403);

        // Stranger access attempt
        $resStranger = $this->actingAs($stranger, 'sanctum')
            ->getJson("/api/v1/interviews/{$session->session_token}/result");
        $resStranger->assertStatus(403);

        // Owner access attempt
        $resOwner = $this->actingAs($owner, 'sanctum')
            ->getJson("/api/v1/interviews/{$session->session_token}/result");
        $resOwner->assertStatus(200);
    }

    public function test_user_cannot_view_another_users_learning_report(): void
    {
        $userA = User::factory()->create(['role' => 'user']);
        $userB = User::factory()->create(['role' => 'user']);
        $admin = User::factory()->create(['role' => 'admin']);

        // User A attempts to view User B's report
        $res = $this->actingAs($userA, 'sanctum')->getJson("/api/v1/reports/learning/{$userB->id}");
        $res->assertStatus(403);

        // User A views own report
        $resOwn = $this->actingAs($userA, 'sanctum')->getJson("/api/v1/reports/learning/{$userA->id}");
        $resOwn->assertStatus(200);

        // Admin views User B's report
        $resAdmin = $this->actingAs($admin, 'sanctum')->getJson("/api/v1/reports/learning/{$userB->id}");
        $resAdmin->assertStatus(200);
    }

    /**
     * 4. MASS ASSIGNMENT & ROLE MANIPULATION: Protected fields cannot be modified via profile update.
     */
    public function test_profile_update_ignores_role_and_xp_tampering(): void
    {
        $user = User::factory()->create([
            'role' => 'user',
            'xp' => 100,
            'name' => 'Original Name',
            'username' => 'originaluser',
        ]);

        $response = $this->actingAs($user, 'sanctum')->putJson('/api/v1/profile', [
            'name' => 'Updated Name',
            'username' => 'updateduser',
            'role' => 'admin',     // Malicious escalation attempt
            'xp' => 999999,        // Malicious XP tampering attempt
            'status' => 'banned',  // Malicious status tampering attempt
        ]);

        $response->assertStatus(200);

        $user->refresh();
        $this->assertEquals('Updated Name', $user->name);
        $this->assertEquals('updateduser', $user->username);
        // Crucial: role and XP must NOT change
        $this->assertEquals('user', $user->role);
        $this->assertEquals(100, $user->xp);
    }

    /**
     * 5. FILE UPLOADS: Invalid images and polyglot files are rejected.
     */
    public function test_avatar_upload_rejects_fake_or_text_files_masquerading_as_images(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();

        // Fake image file containing PHP/HTML text instead of image bytes
        $fakeImage = UploadedFile::fake()->createWithContent('avatar.png', '<?php phpinfo(); ?>');

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/profile/avatar', [
            'avatar' => $fakeImage,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('avatar');
    }

    public function test_avatar_upload_accepts_valid_image(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();

        $validImage = UploadedFile::fake()->image('avatar.jpg', 200, 200);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/profile/avatar', [
            'avatar' => $validImage,
        ]);

        $response->assertStatus(200);
        $this->assertNotNull($response->json('avatar_url'));
    }

    /**
     * 6. HTTP SECURITY HEADERS: Verify defensive headers on responses.
     */
    public function test_responses_contain_security_headers(): void
    {
        $response = $this->getJson('/api/health');

        $response->assertStatus(200);
        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $response->assertHeader('X-Frame-Options', 'SAMEORIGIN');
        $response->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->assertHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    }
}
