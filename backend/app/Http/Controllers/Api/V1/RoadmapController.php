<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Roadmap;
use App\Models\UserChallengeProgress;
use App\Models\UserRoadmapProgress;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoadmapController extends Controller
{
    /**
     * List all published roadmaps with progress stats
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user('sanctum');

        $roadmaps = Roadmap::where('is_published', true)
            ->with(['modules.challenges'])
            ->orderBy('position')
            ->get();

        $data = $roadmaps->map(function ($r) use ($user) {
            $totalChallenges = 0;
            $allChallengeIds = [];
            foreach ($r->modules as $m) {
                foreach ($m->challenges as $c) {
                    $allChallengeIds[] = $c->id;
                }
            }
            $allChallengeIds = array_unique($allChallengeIds);
            $totalChallenges = count($allChallengeIds);

            $solvedCount = 0;
            if ($user && $totalChallenges > 0) {
                $solvedCount = UserChallengeProgress::where('user_id', $user->id)
                    ->whereIn('challenge_id', $allChallengeIds)
                    ->whereNotNull('solved_at')
                    ->count();
            }

            $percentage = $totalChallenges > 0 ? round(($solvedCount / $totalChallenges) * 100) : 0;

            return [
                'id' => $r->id,
                'slug' => $r->slug,
                'title' => $r->title,
                'description' => $r->description,
                'category' => $r->category,
                'icon' => $r->icon,
                'difficulty' => $r->difficulty,
                'estimated_hours' => $r->estimated_hours,
                'modules_count' => $r->modules->count(),
                'total_challenges' => $totalChallenges,
                'solved_challenges' => $solvedCount,
                'progress_percentage' => $percentage,
            ];
        });

        return response()->json(['data' => $data]);
    }

    /**
     * Get roadmap details with modules, challenges, and progress
     */
    public function show(string $slug, Request $request): JsonResponse
    {
        $roadmap = Roadmap::where('slug', $slug)
            ->where('is_published', true)
            ->with(['modules' => function ($q) {
                $q->orderBy('position')->with(['challenges' => function ($cq) {
                    $cq->orderBy('roadmap_module_challenges.position');
                }]);
            }])
            ->firstOrFail();

        $user = $request->user('sanctum');
        $solvedChallengeIds = [];

        if ($user) {
            $allIds = [];
            foreach ($roadmap->modules as $m) {
                foreach ($m->challenges as $c) {
                    $allIds[] = $c->id;
                }
            }
            $solvedChallengeIds = UserChallengeProgress::where('user_id', $user->id)
                ->whereIn('challenge_id', $allIds)
                ->whereNotNull('solved_at')
                ->pluck('challenge_id')
                ->toArray();
        }

        $modulesData = $roadmap->modules->map(function ($m) use ($solvedChallengeIds) {
            return [
                'id' => $m->id,
                'title' => $m->title,
                'description' => $m->description,
                'position' => $m->position,
                'challenges' => $m->challenges->map(function ($c) use ($solvedChallengeIds) {
                    return [
                        'id' => $c->id,
                        'slug' => $c->slug,
                        'title' => $c->title,
                        'difficulty' => $c->difficulty,
                        'challenge_type' => $c->challenge_type ?? 'code',
                        'estimated_time_min' => $c->estimated_time_min,
                        'is_solved' => in_array($c->id, $solvedChallengeIds),
                    ];
                }),
            ];
        });

        return response()->json([
            'roadmap' => [
                'id' => $roadmap->id,
                'slug' => $roadmap->slug,
                'title' => $roadmap->title,
                'description' => $roadmap->description,
                'category' => $roadmap->category,
                'icon' => $roadmap->icon,
                'difficulty' => $roadmap->difficulty,
                'estimated_hours' => $roadmap->estimated_hours,
                'modules' => $modulesData,
            ],
            'solved_ids' => $solvedChallengeIds,
        ]);
    }
}
