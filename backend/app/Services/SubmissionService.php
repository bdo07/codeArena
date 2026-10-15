<?php

namespace App\Services;

use App\Models\Challenge;
use App\Models\Submission;
use App\Models\SubmissionTestResult;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class SubmissionService
{
    public function __construct(
        protected CodeExecutionService $executor,
        protected GamificationService $gamification
    ) {}

    /**
     * Run code against public sample test cases ONLY.
     * Never evaluates hidden test cases or persists full submission XP.
     */
    public function runSampleTestCases(Challenge $challenge, string $language, string $sourceCode): array
    {
        $sampleCases = $challenge->sampleTestCases;
        $results = [];
        $allPassed = true;
        $totalTime = 0;
        $maxMemory = 0;
        $isDemoMode = false;

        foreach ($sampleCases as $tc) {
            $execResult = $this->executor->execute(
                $language,
                $sourceCode,
                $tc->input_data,
                $tc->expected_output,
                $challenge->time_limit_ms,
                $challenge->memory_limit_mb
            );

            if (!$execResult['passed']) {
                $allPassed = false;
            }

            $totalTime += $execResult['execution_time_ms'];
            $maxMemory = max($maxMemory, $execResult['memory_kb']);
            if ($execResult['is_demo_mode']) {
                $isDemoMode = true;
            }

            $results[] = [
                'test_case_id' => $tc->id,
                'position' => $tc->position,
                'input_data' => $tc->input_data,
                'expected_output' => $tc->expected_output,
                'actual_output' => $execResult['stdout'],
                'stderr' => $execResult['stderr'],
                'status' => $execResult['status'],
                'execution_time_ms' => $execResult['execution_time_ms'],
                'passed' => $execResult['passed'],
            ];
        }

        return [
            'status' => $allPassed ? 'Accepted' : 'Failed',
            'passed' => $allPassed,
            'test_results' => $results,
            'total_execution_time_ms' => $totalTime,
            'max_memory_kb' => $maxMemory,
            'is_demo_mode' => $isDemoMode,
        ];
    }

    /**
     * Submit code for full server-side evaluation against ALL test cases (sample + hidden).
     * Strictly protects hidden test case contents from public leakage.
     */
    public function submitSolution(User $user, Challenge $challenge, string $language, string $sourceCode): array
    {
        return DB::transaction(function () use ($user, $challenge, $language, $sourceCode) {
            $submission = Submission::create([
                'user_id' => $user->id,
                'challenge_id' => $challenge->id,
                'language' => $language,
                'source_code' => $sourceCode,
                'status' => Submission::STATUS_RUNNING,
                'score' => 0,
                'submitted_at' => Carbon::now(),
            ]);

            $testCases = $challenge->testCases;
            $totalPoints = $testCases->sum('points') ?: 100;
            $earnedPoints = 0;
            $firstFailingStatus = null;
            $firstErrorMessage = null;
            $maxTimeMs = 0;
            $maxMemoryKb = 0;
            $isDemoMode = false;

            foreach ($testCases as $tc) {
                $execResult = $this->executor->execute(
                    $language,
                    $sourceCode,
                    $tc->input_data,
                    $tc->expected_output,
                    $challenge->time_limit_ms,
                    $challenge->memory_limit_mb
                );

                $pointsAwarded = $execResult['passed'] ? $tc->points : 0;
                $earnedPoints += $pointsAwarded;
                $maxTimeMs = max($maxTimeMs, $execResult['execution_time_ms']);
                $maxMemoryKb = max($maxMemoryKb, $execResult['memory_kb']);
                if ($execResult['is_demo_mode']) {
                    $isDemoMode = true;
                }

                if (!$execResult['passed'] && $firstFailingStatus === null) {
                    $firstFailingStatus = $execResult['status'];
                    $firstErrorMessage = $execResult['stderr'];
                }

                SubmissionTestResult::create([
                    'submission_id' => $submission->id,
                    'test_case_id' => $tc->id,
                    'status' => $execResult['status'],
                    'execution_time_ms' => $execResult['execution_time_ms'],
                    'memory_kb' => $execResult['memory_kb'],
                    'points_awarded' => $pointsAwarded,
                ]);
            }

            $scorePercentage = (int) round(($earnedPoints / $totalPoints) * 100);
            $finalStatus = ($firstFailingStatus === null) ? Submission::STATUS_ACCEPTED : $firstFailingStatus;

            $submission->update([
                'status' => $finalStatus,
                'score' => $scorePercentage,
                'execution_time_ms' => $maxTimeMs,
                'memory_kb' => $maxMemoryKb,
                'error_message' => $firstErrorMessage,
                'finished_at' => Carbon::now(),
            ]);

            $gamificationResult = $this->gamification->awardProgressAndXp($user, $challenge, $submission);

            return [
                'submission' => $submission->fresh(['challenge', 'testResults']),
                'gamification' => $gamificationResult,
                'is_demo_mode' => $isDemoMode,
            ];
        });
    }
}
