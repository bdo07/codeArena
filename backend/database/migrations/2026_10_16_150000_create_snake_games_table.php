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
        Schema::create('snake_games', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('session_id')->unique()->index();
            $table->unsignedInteger('score')->default(0);
            $table->unsignedInteger('apples_eaten')->default(0);
            $table->unsignedInteger('moves_count')->default(0);
            $table->unsignedInteger('duration_seconds')->default(0);
            $table->string('status', 32)->default('in_progress')->index(); // in_progress, completed, abandoned
            $table->boolean('is_verified')->default(true)->index();
            $table->boolean('is_imported')->default(false)->index();
            $table->timestamp('started_at')->useCurrent();
            $table->timestamp('ended_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('snake_games');
    }
};
