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
        Schema::create('quest_paths', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('title');
            $table->text('description');
            $table->string('category');
            $table->string('icon')->default('Compass');
            $table->enum('difficulty', ['Beginner', 'Easy', 'Medium', 'Hard', 'Expert'])->default('Beginner');
            $table->unsignedInteger('estimated_hours')->default(10);
            $table->unsignedInteger('position')->default(1);
            $table->unsignedInteger('reward_xp')->default(100);
            $table->foreignId('reward_badge_id')->nullable()->constrained('badges')->nullOnDelete();
            $table->boolean('is_published')->default(true);
            $table->timestamps();
        });

        Schema::create('quest_stages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quest_path_id')->constrained('quest_paths')->cascadeOnDelete();
            $table->string('slug');
            $table->string('title');
            $table->text('description');
            $table->unsignedInteger('position')->default(1);
            $table->foreignId('prerequisite_stage_id')->nullable()->constrained('quest_stages')->nullOnDelete();
            $table->unsignedInteger('reward_xp')->default(50);
            $table->foreignId('reward_badge_id')->nullable()->constrained('badges')->nullOnDelete();
            $table->timestamps();

            $table->unique(['quest_path_id', 'slug']);
        });

        Schema::create('quest_stage_challenges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quest_stage_id')->constrained('quest_stages')->cascadeOnDelete();
            $table->foreignId('challenge_id')->constrained('challenges')->cascadeOnDelete();
            $table->unsignedInteger('position')->default(1);
            $table->timestamps();

            $table->unique(['quest_stage_id', 'challenge_id']);
        });

        Schema::create('user_quest_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('quest_stage_id')->constrained('quest_stages')->cascadeOnDelete();
            $table->enum('status', ['locked', 'available', 'in_progress', 'completed'])->default('available');
            $table->boolean('reward_claimed')->default(false);
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'quest_stage_id']);
        });

        Schema::create('user_quest_path_completions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('quest_path_id')->constrained('quest_paths')->cascadeOnDelete();
            $table->boolean('reward_claimed')->default(false);
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'quest_path_id']);
        });

        Schema::create('user_daily_mission_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->date('mission_date');
            $table->string('mission_type');
            $table->string('title');
            $table->string('description');
            $table->unsignedInteger('target_count')->default(1);
            $table->unsignedInteger('current_count')->default(0);
            $table->unsignedInteger('reward_xp')->default(25);
            $table->boolean('is_completed')->default(false);
            $table->boolean('reward_claimed')->default(false);
            $table->timestamps();

            $table->unique(['user_id', 'mission_date', 'mission_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_daily_mission_progress');
        Schema::dropIfExists('user_quest_path_completions');
        Schema::dropIfExists('user_quest_progress');
        Schema::dropIfExists('quest_stage_challenges');
        Schema::dropIfExists('quest_stages');
        Schema::dropIfExists('quest_paths');
    }
};
