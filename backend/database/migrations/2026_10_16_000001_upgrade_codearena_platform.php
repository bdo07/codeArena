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
        // 1. Upgrade challenges table with specialized types, categories, and editorial fields
        Schema::table('challenges', function (Blueprint $table) {
            $table->string('category')->default('algorithms')->index()->after('difficulty');
            $table->string('challenge_type')->default('code')->index()->after('category'); // code, sql, web, quiz
            $table->unsignedInteger('estimated_time_min')->default(20)->after('challenge_type');
            $table->json('hints')->nullable()->after('constraints');
            $table->longText('explanation')->nullable()->after('hints');
            $table->longText('reference_solution')->nullable()->after('explanation');
            $table->longText('sql_schema')->nullable()->after('reference_solution');
            $table->longText('sql_seed')->nullable()->after('sql_schema');
            $table->longText('sql_solution')->nullable()->after('sql_seed');
            $table->json('web_template')->nullable()->after('sql_solution');
            $table->json('quiz_data')->nullable()->after('web_template');
            $table->boolean('is_daily')->default(false)->index()->after('is_published');
            $table->date('daily_date')->nullable()->index()->after('is_daily');
        });

        // 2. Languages & Technologies Catalog table
        Schema::create('languages', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique()->index();
            $table->string('category')->default('language'); // language, database, framework, devops, tool
            $table->string('monaco_language')->default('plaintext');
            $table->unsignedInteger('judge0_id')->nullable();
            $table->boolean('is_executable')->default(false);
            $table->string('evaluator_type')->default('none'); // judge0, sqlite_sandbox, client_sandbox, quiz_engine, none
            $table->string('version')->nullable();
            $table->string('icon')->nullable();
            $table->text('description')->nullable();
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();
        });

        // 3. Learning Roadmaps
        Schema::create('roadmaps', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique()->index();
            $table->string('title');
            $table->text('description');
            $table->string('category')->default('general');
            $table->string('icon')->default('Compass');
            $table->string('difficulty')->default('Beginner');
            $table->unsignedInteger('estimated_hours')->default(20);
            $table->unsignedInteger('position')->default(0);
            $table->boolean('is_published')->default(true);
            $table->timestamps();
        });

        Schema::create('roadmap_modules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('roadmap_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();
        });

        Schema::create('roadmap_module_challenges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('module_id')->constrained('roadmap_modules')->cascadeOnDelete();
            $table->foreignId('challenge_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();

            $table->unique(['module_id', 'challenge_id']);
        });

        Schema::create('user_roadmap_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('roadmap_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('completed_challenges_count')->default(0);
            $table->boolean('is_completed')->default(false);
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'roadmap_id']);
        });

        // 4. Collections and Bookmarks
        Schema::create('collections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->cascadeOnDelete(); // null for system collections
            $table->string('name');
            $table->string('slug')->index();
            $table->text('description')->nullable();
            $table->boolean('is_public')->default(false);
            $table->string('icon')->default('Bookmark');
            $table->timestamps();
        });

        Schema::create('collection_challenges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('collection_id')->constrained()->cascadeOnDelete();
            $table->foreignId('challenge_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();

            $table->unique(['collection_id', 'challenge_id']);
        });

        // 5. Challenge Notes (private per user)
        Schema::create('challenge_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('challenge_id')->constrained()->cascadeOnDelete();
            $table->longText('content');
            $table->timestamps();

            $table->unique(['user_id', 'challenge_id']);
        });

        // 6. User Streaks & Daily Completions
        Schema::create('user_streaks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->unsignedInteger('current_streak')->default(0);
            $table->unsignedInteger('longest_streak')->default(0);
            $table->date('last_activity_date')->nullable();
            $table->timestamps();
        });

        Schema::create('daily_completions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('challenge_id')->constrained()->cascadeOnDelete();
            $table->date('completed_date')->index();
            $table->unsignedInteger('xp_awarded')->default(0);
            $table->timestamps();

            $table->unique(['user_id', 'completed_date']);
        });

        // 7. Challenge Discussions, Replies, Likes
        Schema::create('discussions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('challenge_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->longText('content');
            $table->string('category')->default('question'); // question, solution, general
            $table->unsignedInteger('upvotes_count')->default(0);
            $table->boolean('is_pinned')->default(false);
            $table->timestamps();

            $table->index(['challenge_id', 'category']);
        });

        Schema::create('discussion_replies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('discussion_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->longText('content');
            $table->unsignedInteger('upvotes_count')->default(0);
            $table->boolean('is_solution')->default(false);
            $table->timestamps();
        });

        Schema::create('discussion_likes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->morphs('likable'); // discussion or reply
            $table->timestamps();

            $table->unique(['user_id', 'likable_type', 'likable_id']);
        });

        // 8. Contests, Participants, Contest Challenges
        Schema::create('contests', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique()->index();
            $table->string('title');
            $table->text('description');
            $table->timestamp('start_time');
            $table->timestamp('end_time');
            $table->string('status')->default('upcoming'); // upcoming, active, finished
            $table->string('banner_color')->default('violet');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('contest_challenges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contest_id')->constrained()->cascadeOnDelete();
            $table->foreignId('challenge_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('points')->default(100);
            $table->unsignedInteger('position')->default(1);
            $table->timestamps();

            $table->unique(['contest_id', 'challenge_id']);
        });

        Schema::create('contest_participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contest_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('score')->default(0);
            $table->unsignedBigInteger('finish_time_ms')->default(0);
            $table->unsignedInteger('rank')->nullable();
            $table->timestamp('registered_at')->useCurrent();
            $table->timestamps();

            $table->unique(['contest_id', 'user_id']);
        });

        // 9. In-App Notifications
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type'); // achievement, streak, contest, reply, system
            $table->string('title');
            $table->text('message');
            $table->json('data')->nullable();
            $table->boolean('is_read')->default(false)->index();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('contest_participants');
        Schema::dropIfExists('contest_challenges');
        Schema::dropIfExists('contests');
        Schema::dropIfExists('discussion_likes');
        Schema::dropIfExists('discussion_replies');
        Schema::dropIfExists('discussions');
        Schema::dropIfExists('daily_completions');
        Schema::dropIfExists('user_streaks');
        Schema::dropIfExists('challenge_notes');
        Schema::dropIfExists('collection_challenges');
        Schema::dropIfExists('collections');
        Schema::dropIfExists('user_roadmap_progress');
        Schema::dropIfExists('roadmap_module_challenges');
        Schema::dropIfExists('roadmap_modules');
        Schema::dropIfExists('roadmaps');
        Schema::dropIfExists('languages');

        Schema::table('challenges', function (Blueprint $table) {
            $table->dropColumn([
                'category',
                'challenge_type',
                'estimated_time_min',
                'hints',
                'explanation',
                'reference_solution',
                'sql_schema',
                'sql_seed',
                'sql_solution',
                'web_template',
                'quiz_data',
                'is_daily',
                'daily_date',
            ]);
        });
    }
};
