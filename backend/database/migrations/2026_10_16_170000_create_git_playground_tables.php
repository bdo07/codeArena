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
        Schema::create('user_git_playground_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('scenario_id');
            $table->boolean('is_completed')->default(false);
            $table->unsignedInteger('commands_count')->default(0);
            $table->timestamp('completed_at')->nullable();
            $table->boolean('reward_claimed')->default(false);
            $table->unsignedInteger('xp_awarded')->default(0);
            $table->timestamps();

            $table->unique(['user_id', 'scenario_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_git_playground_progress');
    }
};
