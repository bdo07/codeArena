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
        Schema::create('interview_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('session_token')->unique();
            $table->string('topic'); // algorithms, frontend, backend, sql, fullstack
            $table->enum('difficulty', ['Beginner', 'Easy', 'Medium', 'Hard', 'Expert'])->default('Medium');
            $table->unsignedInteger('duration_minutes')->default(30);
            $table->timestamp('started_at');
            $table->timestamp('expires_at');
            $table->timestamp('completed_at')->nullable();
            $table->enum('status', ['in_progress', 'completed', 'expired', 'abandoned'])->default('in_progress');
            $table->unsignedInteger('score')->nullable();
            $table->unsignedInteger('total_score')->default(100);
            $table->boolean('passed')->default(false);
            $table->unsignedInteger('xp_awarded')->default(0);
            $table->json('feedback_summary')->nullable();
            $table->timestamps();
        });

        Schema::create('interview_session_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('interview_session_id')->constrained('interview_sessions')->cascadeOnDelete();
            $table->foreignId('challenge_id')->nullable()->constrained('challenges')->nullOnDelete();
            $table->unsignedInteger('position')->default(1);
            $table->string('title');
            $table->text('description');
            $table->enum('question_type', ['code', 'sql', 'quiz', 'conceptual'])->default('code');
            $table->string('language')->nullable();
            $table->text('starter_code')->nullable();
            $table->json('rubric')->nullable();
            $table->text('user_answer')->nullable();
            $table->boolean('is_correct')->nullable();
            $table->unsignedInteger('score')->default(0);
            $table->unsignedInteger('max_score')->default(25);
            $table->text('evaluation_notes')->nullable();
            $table->json('evaluation_details')->nullable();
            $table->timestamps();

            $table->unique(['interview_session_id', 'position']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('interview_session_questions');
        Schema::dropIfExists('interview_sessions');
    }
};
