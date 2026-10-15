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
        Schema::create('challenges', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique()->index();
            $table->string('title');
            $table->longText('description');
            $table->text('input_description')->nullable();
            $table->text('output_description')->nullable();
            $table->text('constraints')->nullable();
            $table->enum('difficulty', ['Easy', 'Medium', 'Hard'])->default('Easy')->index();
            $table->json('starter_code')->nullable();
            $table->unsignedInteger('time_limit_ms')->default(2000);
            $table->unsignedInteger('memory_limit_mb')->default(128);
            $table->boolean('is_published')->default(true)->index();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('tags', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->timestamps();
        });

        Schema::create('challenge_tag', function (Blueprint $table) {
            $table->id();
            $table->foreignId('challenge_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tag_id')->constrained()->cascadeOnDelete();
            $table->unique(['challenge_id', 'tag_id']);
        });

        Schema::create('test_cases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('challenge_id')->constrained()->cascadeOnDelete();
            $table->longText('input_data');
            $table->longText('expected_output');
            $table->boolean('is_sample')->default(false)->index();
            $table->unsignedInteger('points')->default(10);
            $table->unsignedInteger('position')->default(1);
            $table->timestamps();
        });

        Schema::create('submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('challenge_id')->constrained()->cascadeOnDelete();
            $table->string('language');
            $table->longText('source_code');
            $table->string('status')->default('Pending')->index(); // Pending, Running, Accepted, Wrong Answer, Compilation Error, Runtime Error, Time Limit Exceeded, Internal Error
            $table->unsignedInteger('score')->default(0);
            $table->unsignedInteger('execution_time_ms')->nullable();
            $table->unsignedInteger('memory_kb')->nullable();
            $table->string('judge_token')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'challenge_id']);
            $table->index(['challenge_id', 'status']);
        });

        Schema::create('submission_test_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('submission_id')->constrained()->cascadeOnDelete();
            $table->foreignId('test_case_id')->constrained()->cascadeOnDelete();
            $table->string('status');
            $table->unsignedInteger('execution_time_ms')->nullable();
            $table->unsignedInteger('memory_kb')->nullable();
            $table->unsignedInteger('points_awarded')->default(0);
            $table->timestamps();
        });

        Schema::create('user_challenge_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('challenge_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('best_score')->default(0);
            $table->unsignedInteger('attempts_count')->default(1);
            $table->timestamp('solved_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'challenge_id']);
        });

        Schema::create('badges', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description');
            $table->string('icon');
            $table->string('rule_key');
            $table->timestamps();
        });

        Schema::create('user_badges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('badge_id')->constrained()->cascadeOnDelete();
            $table->timestamp('earned_at');
            $table->timestamps();

            $table->unique(['user_id', 'badge_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_badges');
        Schema::dropIfExists('badges');
        Schema::dropIfExists('user_challenge_progress');
        Schema::dropIfExists('submission_test_results');
        Schema::dropIfExists('submissions');
        Schema::dropIfExists('test_cases');
        Schema::dropIfExists('challenge_tag');
        Schema::dropIfExists('tags');
        Schema::dropIfExists('challenges');
    }
};
