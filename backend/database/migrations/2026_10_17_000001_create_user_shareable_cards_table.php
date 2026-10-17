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
        Schema::create('user_shareable_cards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('share_token', 64)->unique();
            $table->boolean('is_public')->default(false); // Private by default
            $table->string('template', 32)->default('modern');
            $table->string('card_theme', 32)->default('dark');
            $table->string('layout', 32)->default('horizontal');
            $table->json('selected_fields')->nullable();
            $table->string('custom_tagline', 100)->nullable();
            $table->timestamps();

            $table->index(['user_id', 'is_public']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_shareable_cards');
    }
};
