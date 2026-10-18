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
        Schema::create('code_duels', function (Blueprint $table) {
            $table->id();
            $table->string('uuid', 36)->unique();
            $table->foreignId('creator_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('opponent_id')->nullable()->constrained('users')->onDelete('cascade');
            $table->foreignId('challenge_id')->constrained('challenges')->onDelete('cascade');
            $table->string('status', 20)->default('pending'); // pending, active, completed, declined, canceled, timed_out
            $table->string('language', 30)->default('python');
            $table->integer('duration_seconds')->default(900); // 15 mins default
            $table->timestamp('started_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->foreignId('winner_id')->nullable()->constrained('users')->onDelete('set null');
            $table->integer('creator_score')->default(0);
            $table->integer('opponent_score')->default(0);
            $table->foreignId('creator_submission_id')->nullable()->constrained('submissions')->onDelete('set null');
            $table->foreignId('opponent_submission_id')->nullable()->constrained('submissions')->onDelete('set null');
            $table->timestamp('creator_submitted_at')->nullable();
            $table->timestamp('opponent_submitted_at')->nullable();
            $table->longText('creator_code')->nullable();
            $table->longText('opponent_code')->nullable();
            $table->string('result_reason')->nullable();
            $table->timestamps();

            $table->index(['creator_id', 'status']);
            $table->index(['opponent_id', 'status']);
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('code_duels');
    }
};
