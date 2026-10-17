<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('status')->default('active')->index()->after('role'); // 'active', 'suspended', 'banned'
            $table->timestamp('suspended_until')->nullable()->after('status');
            $table->text('suspension_reason')->nullable()->after('suspended_until');
            $table->timestamp('banned_at')->nullable()->after('suspension_reason');
            $table->text('ban_reason')->nullable()->after('banned_at');
            $table->softDeletes()->after('updated_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropSoftDeletes();
            $table->dropColumn([
                'status',
                'suspended_until',
                'suspension_reason',
                'banned_at',
                'ban_reason',
            ]);
        });
    }
};
