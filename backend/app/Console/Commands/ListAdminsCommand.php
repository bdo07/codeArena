<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class ListAdminsCommand extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'codearena:list-admins';

    /**
     * The console command description.
     */
    protected $description = 'List all accounts with administrator privileges on CodeArena';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $admins = User::withTrashed()
            ->where('role', 'admin')
            ->orderBy('id', 'asc')
            ->get(['id', 'username', 'email', 'name', 'status', 'created_at', 'deleted_at']);

        if ($admins->isEmpty()) {
            $this->warn('No administrator accounts found on this platform.');
            return Command::SUCCESS;
        }

        $headers = ['ID', 'Username', 'Email', 'Name', 'Status', 'Deleted?'];
        $rows = $admins->map(fn ($admin) => [
            $admin->id,
            $admin->username,
            $admin->email,
            $admin->name,
            $admin->status ?? 'active',
            $admin->trashed() ? 'YES (Soft-Deleted)' : 'No',
        ])->toArray();

        $this->table($headers, $rows);
        $this->info("Total administrators: {$admins->count()}");

        return Command::SUCCESS;
    }
}
