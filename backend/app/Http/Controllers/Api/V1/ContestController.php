<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Contest;
use App\Models\ContestParticipant;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContestController extends Controller
{
    /**
     * List all contests grouped by active, upcoming, finished
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user('sanctum');

        $contests = Contest::withCount(['challenges', 'participants'])
            ->orderBy('start_time')
            ->get();

        $registeredContestIds = [];
        if ($user) {
            $registeredContestIds = ContestParticipant::where('user_id', $user->id)
                ->pluck('contest_id')
                ->toArray();
        }

        $now = Carbon::now();
        $active = [];
        $upcoming = [];
        $finished = [];

        foreach ($contests as $c) {
            $cData = [
                'id' => $c->id,
                'slug' => $c->slug,
                'title' => $c->title,
                'description' => $c->description,
                'start_time' => $c->start_time->toIso8601String(),
                'end_time' => $c->end_time->toIso8601String(),
                'status' => $c->start_time > $now ? 'upcoming' : ($c->end_time < $now ? 'finished' : 'active'),
                'banner_color' => $c->banner_color,
                'challenges_count' => $c->challenges_count,
                'participants_count' => $c->participants_count,
                'is_registered' => in_array($c->id, $registeredContestIds),
            ];

            if ($cData['status'] === 'active') {
                $active[] = $cData;
            } elseif ($cData['status'] === 'upcoming') {
                $upcoming[] = $cData;
            } else {
                $finished[] = $cData;
            }
        }

        return response()->json([
            'live' => $active,
            'active' => $active,
            'upcoming' => $upcoming,
            'past' => $finished,
            'finished' => $finished,
        ]);
    }

    /**
     * Show contest details and challenges
     */
    public function show(string $slug, Request $request): JsonResponse
    {
        $contest = Contest::where('slug', $slug)
            ->with(['challenges' => function ($q) {
                $q->withPivot(['points', 'position'])->orderByPivot('position');
            }])
            ->firstOrFail();

        $user = $request->user('sanctum');
        $isRegistered = false;
        $myScore = 0;

        if ($user) {
            $participant = ContestParticipant::where('contest_id', $contest->id)
                ->where('user_id', $user->id)
                ->first();

            if ($participant) {
                $isRegistered = true;
                $myScore = $participant->score;
            }
        }

        $now = Carbon::now();
        $hasStarted = $contest->start_time <= $now;

        $challengesData = [];
        if ($hasStarted) {
            $challengesData = $contest->challenges->map(function ($c) {
                return [
                    'id' => $c->id,
                    'slug' => $c->slug,
                    'title' => $c->title,
                    'difficulty' => $c->difficulty,
                    'category' => $c->category,
                    'points' => $c->pivot->points,
                    'position' => $c->pivot->position,
                ];
            });
        }

        return response()->json([
            'contest' => [
                'id' => $contest->id,
                'slug' => $contest->slug,
                'title' => $contest->title,
                'description' => $contest->description,
                'start_time' => $contest->start_time->toIso8601String(),
                'end_time' => $contest->end_time->toIso8601String(),
                'status' => $contest->isUpcoming() ? 'upcoming' : ($contest->isEnded() ? 'finished' : 'active'),
                'banner_color' => $contest->banner_color,
                'is_registered' => $isRegistered,
                'my_score' => $myScore,
                'challenges' => $challengesData,
            ]
        ]);
    }

    /**
     * Register current user for contest
     */
    public function register(string $slug, Request $request): JsonResponse
    {
        $user = $request->user();
        $contest = Contest::where('slug', $slug)->firstOrFail();

        $participant = ContestParticipant::firstOrCreate(
            [
                'contest_id' => $contest->id,
                'user_id' => $user->id,
            ],
            [
                'score' => 0,
                'finish_time_ms' => 0,
                'registered_at' => Carbon::now(),
            ]
        );

        return response()->json([
            'message' => 'Successfully registered for the contest.',
            'participant' => $participant,
        ]);
    }

    /**
     * Contest leaderboard / standings
     */
    public function leaderboard(string $slug): JsonResponse
    {
        $contest = Contest::where('slug', $slug)->firstOrFail();

        $participants = ContestParticipant::where('contest_id', $contest->id)
            ->with('user:id,name,username,xp')
            ->orderByDesc('score')
            ->orderBy('finish_time_ms')
            ->paginate(50);

        return response()->json([
            'data' => $participants->items(),
            'meta' => [
                'current_page' => $participants->currentPage(),
                'last_page' => $participants->lastPage(),
                'total' => $participants->total(),
            ],
        ]);
    }
}
