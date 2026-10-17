<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Challenge;
use App\Models\Language;
use App\Models\Tag;
use App\Models\User;
use App\Models\UserChallengeProgress;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SearchController extends Controller
{
    /**
     * Unified multi-entity search endpoint.
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'q' => 'nullable|string|max:100',
            'type' => 'nullable|string|in:all,challenges,languages,topics,users',
            'difficulty' => 'nullable|string|in:Beginner,Easy,Medium,Hard,Expert',
            'category' => 'nullable|string|max:50',
            'language' => 'nullable|string|max:50',
            'topic' => 'nullable|string|max:50',
            'status' => 'nullable|string|in:all,solved,attempted,unsolved',
            'sort' => 'nullable|string|in:relevance,newest,difficulty_asc,difficulty_desc,xp',
            'page' => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|min:1|max:50',
        ]);

        $queryStr = trim($validated['q'] ?? '');
        $type = $validated['type'] ?? 'all';
        $difficulty = $validated['difficulty'] ?? null;
        $category = $validated['category'] ?? null;
        $languageSlug = $validated['language'] ?? null;
        $topicSlug = $validated['topic'] ?? null;
        $status = $validated['status'] ?? 'all';
        $sort = $validated['sort'] ?? 'relevance';
        $perPage = (int) ($validated['per_page'] ?? 12);
        $user = $request->user('sanctum');

        $response = [
            'query' => $queryStr,
            'type' => $type,
            'counts' => [
                'challenges' => 0,
                'languages' => 0,
                'topics' => 0,
                'users' => 0,
                'total' => 0,
            ],
            'results' => [],
        ];

        // 1. Challenges Search Query
        if ($type === 'all' || $type === 'challenges') {
            $chQuery = Challenge::where('is_published', true)->with(['tags:id,name,slug']);

            if (!empty($queryStr)) {
                $term = strtolower($queryStr);
                $chQuery->where(function ($q) use ($term) {
                    $q->where(DB::raw('LOWER(title)'), 'like', "%{$term}%")
                      ->orWhere(DB::raw('LOWER(description)'), 'like', "%{$term}%")
                      ->orWhere(DB::raw('LOWER(category)'), 'like', "%{$term}%")
                      ->orWhereHas('tags', function ($tq) use ($term) {
                          $tq->where(DB::raw('LOWER(name)'), 'like', "%{$term}%")
                             ->orWhere(DB::raw('LOWER(slug)'), 'like', "%{$term}%");
                      });
                });
            }

            if ($difficulty) {
                $chQuery->where('difficulty', $difficulty);
            }

            if ($category) {
                $chQuery->where(DB::raw('LOWER(category)'), strtolower($category));
            }

            if ($topicSlug) {
                $chQuery->whereHas('tags', function ($tq) use ($topicSlug) {
                    $tq->where('slug', $topicSlug);
                });
            }

            if ($user && $status !== 'all') {
                if ($status === 'solved') {
                    $chQuery->whereHas('progress', function ($pq) use ($user) {
                        $pq->where('user_id', $user->id)->whereNotNull('solved_at');
                    });
                } elseif ($status === 'attempted') {
                    $chQuery->whereHas('progress', function ($pq) use ($user) {
                        $pq->where('user_id', $user->id)->whereNull('solved_at');
                    });
                } elseif ($status === 'unsolved') {
                    $chQuery->whereDoesntHave('progress', function ($pq) use ($user) {
                        $pq->where('user_id', $user->id)->whereNotNull('solved_at');
                    });
                }
            }

            // Sorting
            switch ($sort) {
                case 'difficulty_asc':
                    $chQuery->orderByRaw("CASE difficulty WHEN 'Beginner' THEN 1 WHEN 'Easy' THEN 2 WHEN 'Medium' THEN 3 WHEN 'Hard' THEN 4 WHEN 'Expert' THEN 5 END ASC");
                    break;
                case 'difficulty_desc':
                    $chQuery->orderByRaw("CASE difficulty WHEN 'Expert' THEN 1 WHEN 'Hard' THEN 2 WHEN 'Medium' THEN 3 WHEN 'Easy' THEN 4 WHEN 'Beginner' THEN 5 END ASC");
                    break;
                case 'xp':
                    $chQuery->orderBy('xp_reward', 'desc');
                    break;
                case 'newest':
                    $chQuery->orderBy('created_at', 'desc');
                    break;
                case 'relevance':
                default:
                    if (!empty($queryStr)) {
                        $term = strtolower($queryStr);
                        $chQuery->orderByRaw("CASE WHEN LOWER(title) LIKE ? THEN 1 WHEN LOWER(title) LIKE ? THEN 2 ELSE 3 END", ["{$term}%", "%{$term}%"]);
                    } else {
                        $chQuery->orderBy('created_at', 'desc');
                    }
                    break;
            }

            $totalChallenges = $chQuery->count();
            $response['counts']['challenges'] = $totalChallenges;

            if ($type === 'challenges') {
                $paginated = $chQuery->paginate($perPage);

                // Attach user progress map
                $progressMap = [];
                if ($user) {
                    $ids = $paginated->pluck('id');
                    $progressMap = UserChallengeProgress::where('user_id', $user->id)
                        ->whereIn('challenge_id', $ids)
                        ->get()
                        ->keyBy('challenge_id');
                }

                $paginated->getCollection()->transform(function ($c) use ($progressMap) {
                    $p = $progressMap[$c->id] ?? null;
                    return [
                        'id' => $c->id,
                        'title' => $c->title,
                        'slug' => $c->slug,
                        'description' => substr(strip_tags($c->description), 0, 160) . '...',
                        'difficulty' => $c->difficulty,
                        'category' => $c->category,
                        'challenge_type' => $c->challenge_type,
                        'xp_reward' => $c->xp_reward,
                        'tags' => $c->tags->map(fn ($t) => ['id' => $t->id, 'name' => $t->name, 'slug' => $t->slug]),
                        'user_status' => $p ? ($p->solved_at ? 'solved' : 'attempted') : 'unsolved',
                    ];
                });

                $response['results']['challenges'] = $paginated;
            } else {
                // In 'all' mode, take top 6
                $challenges = $chQuery->limit(6)->get()->map(fn ($c) => [
                    'id' => $c->id,
                    'title' => $c->title,
                    'slug' => $c->slug,
                    'description' => substr(strip_tags($c->description), 0, 120) . '...',
                    'difficulty' => $c->difficulty,
                    'category' => $c->category,
                    'challenge_type' => $c->challenge_type,
                    'xp_reward' => $c->xp_reward,
                    'tags' => $c->tags->map(fn ($t) => ['id' => $t->id, 'name' => $t->name, 'slug' => $t->slug]),
                ]);
                $response['results']['challenges'] = $challenges;
            }
        }

        // 2. Languages Search
        if ($type === 'all' || $type === 'languages') {
            $langQuery = Language::query();

            if (!empty($queryStr)) {
                $term = strtolower($queryStr);
                $langQuery->where(function ($q) use ($term) {
                    $q->where(DB::raw('LOWER(name)'), 'like', "%{$term}%")
                      ->orWhere(DB::raw('LOWER(slug)'), 'like', "%{$term}%")
                      ->orWhere(DB::raw('LOWER(category)'), 'like', "%{$term}%")
                      ->orWhere(DB::raw('LOWER(description)'), 'like', "%{$term}%");
                });
            }

            $totalLanguages = $langQuery->count();
            $response['counts']['languages'] = $totalLanguages;

            if ($type === 'languages') {
                $response['results']['languages'] = $langQuery->orderBy('position')->paginate($perPage);
            } else {
                $response['results']['languages'] = $langQuery->orderBy('position')->limit(6)->get();
            }
        }

        // 3. Topics & Skills (Tags)
        if ($type === 'all' || $type === 'topics') {
            $tagQuery = Tag::withCount(['challenges' => function ($q) {
                $q->where('is_published', true);
            }]);

            if (!empty($queryStr)) {
                $term = strtolower($queryStr);
                $tagQuery->where(function ($q) use ($term) {
                    $q->where(DB::raw('LOWER(name)'), 'like', "%{$term}%")
                      ->orWhere(DB::raw('LOWER(slug)'), 'like', "%{$term}%");
                });
            }

            $totalTopics = $tagQuery->count();
            $response['counts']['topics'] = $totalTopics;

            if ($type === 'topics') {
                $response['results']['topics'] = $tagQuery->orderBy('challenges_count', 'desc')->paginate($perPage);
            } else {
                $response['results']['topics'] = $tagQuery->orderBy('challenges_count', 'desc')->limit(8)->get();
            }
        }

        // 4. Public User Profiles Search
        if ($type === 'all' || $type === 'users') {
            $userQuery = User::whereNull('deleted_at')
                ->where('status', 'active')
                ->where('is_activity_public', true);

            if (!empty($queryStr)) {
                $term = strtolower($queryStr);
                $userQuery->where(function ($q) use ($term) {
                    $q->where(DB::raw('LOWER(username)'), 'like', "%{$term}%")
                      ->orWhere(DB::raw('LOWER(name)'), 'like', "%{$term}%")
                      ->orWhere(DB::raw('LOWER(tagline)'), 'like', "%{$term}%");
                });
            }

            $totalUsers = $userQuery->count();
            $response['counts']['users'] = $totalUsers;

            $transformUser = fn (User $u) => [
                'id' => $u->id,
                'name' => $u->name,
                'username' => $u->username,
                'avatar_url' => $u->avatar_url,
                'tagline' => $u->tagline,
                'xp' => $u->xp,
                'level' => $u->calculateLevel(),
                'joined_at' => $u->created_at?->toIso8601String(),
            ];

            if ($type === 'users') {
                $paginated = $userQuery->orderBy('xp', 'desc')->paginate($perPage);
                $paginated->getCollection()->transform($transformUser);
                $response['results']['users'] = $paginated;
            } else {
                $response['results']['users'] = $userQuery->orderBy('xp', 'desc')->limit(4)->get()->map($transformUser);
            }
        }

        $response['counts']['total'] = $response['counts']['challenges']
            + $response['counts']['languages']
            + $response['counts']['topics']
            + $response['counts']['users'];

        return response()->json($response);
    }

    /**
     * Fast real-time suggestions endpoint for keyboard-driven command palette (Cmd+K).
     */
    public function suggestions(Request $request): JsonResponse
    {
        $queryStr = trim(strtolower((string) $request->input('q', '')));

        if (strlen($queryStr) < 1) {
            // Default suggested / trending items
            $featuredChallenges = Challenge::where('is_published', true)
                ->orderBy('xp_reward', 'desc')
                ->limit(4)
                ->get(['id', 'title', 'slug', 'difficulty', 'category', 'xp_reward']);

            $topLanguages = Language::where('is_executable', true)
                ->orderBy('position')
                ->limit(4)
                ->get(['id', 'name', 'slug', 'category', 'icon']);

            $popularTopics = Tag::withCount('challenges')
                ->orderBy('challenges_count', 'desc')
                ->limit(5)
                ->get(['id', 'name', 'slug', 'challenges_count']);

            return response()->json([
                'query' => '',
                'challenges' => $featuredChallenges,
                'languages' => $topLanguages,
                'topics' => $popularTopics,
                'users' => [],
            ]);
        }

        // Suggestions matching query
        $challenges = Challenge::where('is_published', true)
            ->where(function ($q) use ($queryStr) {
                $q->where(DB::raw('LOWER(title)'), 'like', "%{$queryStr}%")
                  ->orWhere(DB::raw('LOWER(category)'), 'like', "%{$queryStr}%");
            })
            ->limit(5)
            ->get(['id', 'title', 'slug', 'difficulty', 'category', 'xp_reward']);

        $languages = Language::where(function ($q) use ($queryStr) {
            $q->where(DB::raw('LOWER(name)'), 'like', "%{$queryStr}%")
              ->orWhere(DB::raw('LOWER(slug)'), 'like', "%{$queryStr}%");
        })
        ->limit(4)
        ->get(['id', 'name', 'slug', 'category', 'icon']);

        $topics = Tag::where(function ($q) use ($queryStr) {
            $q->where(DB::raw('LOWER(name)'), 'like', "%{$queryStr}%")
              ->orWhere(DB::raw('LOWER(slug)'), 'like', "%{$queryStr}%");
        })
        ->withCount('challenges')
        ->limit(4)
        ->get(['id', 'name', 'slug', 'challenges_count']);

        $users = User::whereNull('deleted_at')
            ->where('status', 'active')
            ->where('is_activity_public', true)
            ->where(function ($q) use ($queryStr) {
                $q->where(DB::raw('LOWER(username)'), 'like', "%{$queryStr}%")
                  ->orWhere(DB::raw('LOWER(name)'), 'like', "%{$queryStr}%");
            })
            ->limit(3)
            ->get(['id', 'name', 'username', 'avatar', 'xp'])
            ->map(fn ($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'username' => $u->username,
                'avatar_url' => $u->avatar_url,
                'xp' => $u->xp,
                'level' => $u->calculateLevel(),
            ]);

        return response()->json([
            'query' => $queryStr,
            'challenges' => $challenges,
            'languages' => $languages,
            'topics' => $topics,
            'users' => $users,
        ]);
    }
}
