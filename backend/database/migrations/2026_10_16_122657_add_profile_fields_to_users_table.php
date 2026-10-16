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
            $table->string('avatar')->nullable()->after('remember_token');
            $table->string('tagline', 100)->nullable()->after('avatar');
            $table->string('bio', 300)->nullable()->after('tagline');
            $table->string('location', 100)->nullable()->after('bio');
            $table->string('website_url', 255)->nullable()->after('location');
            $table->string('github_url', 255)->nullable()->after('website_url');
            $table->string('linkedin_url', 255)->nullable()->after('github_url');
            $table->json('favorite_languages')->nullable()->after('linkedin_url');
            $table->boolean('is_activity_public')->default(true)->after('favorite_languages');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'avatar',
                'tagline',
                'bio',
                'location',
                'website_url',
                'github_url',
                'linkedin_url',
                'favorite_languages',
                'is_activity_public',
            ]);
        });
    }
};
