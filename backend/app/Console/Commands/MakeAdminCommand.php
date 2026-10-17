<?php

namespace App\Console\Commands;

use App\Models\ModerationAuditLog;
use App\Models\User;
use Illuminate\Console\Command;

class MakeAdminCommand extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'codearena:make-admin 
                            {identifier : Username or email of the user to promote or demote}
                            {--demote : Demote user from admin to regular user}';

    /**
     * The console command description.
     */
    protected $description = 'Promote or demote a user with administrative privileges via trusted server console';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $identifier = strtolower(trim($this->argument('identifier')));
        $isDemote = $this->option('demote');

        $user = User::withTrashed()
            ->where('username', $identifier)
            ->orWhere('email', $identifier)
            ->first();

        if (! $user) {
            $this->error("User not found with username or email: '{$identifier}'.");
            return Command::FAILURE;
        }

        if ($user->trashed()) {
            $this->error("Account for @{$user->username} is currently soft-deleted. Restore it first before modifying privileges.");
            return Command::FAILURE;
        }

        if ($isDemote) {
            if ($user->role !== 'admin') {
                $this->info("User @{$user->username} is not an administrator.");
                return Command::SUCCESS;
            }

            $adminCount = User::whereNull('deleted_at')->where('role', 'admin')->count();
            if ($adminCount <= 1) {
                $this->error("Security Safeguard: Cannot demote @{$user->username} because they are the last remaining active administrator.");
                return Command::FAILURE;
            }

            $user->role = 'user';
            $user->save();

            ModerationAuditLog::record(
                null,
                $user->id,
                'role_change',
                'Demoted from admin to user via trusted CLI console.',
                'CLI artisan codearena:make-admin command executed.',
                ['cli_action' => 'demote']
            );

            $this->info("Successfully demoted @{$user->username} to regular user role.");
            return Command::SUCCESS;
        }

        // Promote to admin
        if ($user->role === 'admin') {
            $this->info("User @{$user->username} is already an administrator.");
            return Command::SUCCESS;
        }

        $user->role = 'admin';
        $user->save();

        ModerationAuditLog::record(
            null,
            $user->id,
            'role_change',
            'Promoted to admin via trusted CLI console.',
            'CLI artisan codearena:make-admin command executed.',
            ['cli_action' => 'promote']
        );

        $this->info("Successfully promoted @{$user->username} ({$user->email}) to Administrator role.");
        return Command::SUCCESS;
    }
}
