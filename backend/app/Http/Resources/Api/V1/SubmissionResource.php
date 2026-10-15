<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SubmissionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     * Strictly hides internal tokens and hidden test case expected inputs/outputs.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'challenge_id' => $this->challenge_id,
            'challenge' => [
                'id' => $this->challenge->id,
                'slug' => $this->challenge->slug,
                'title' => $this->challenge->title,
                'difficulty' => $this->challenge->difficulty,
            ],
            'user' => [
                'id' => $this->user->id,
                'username' => $this->user->username,
                'name' => $this->user->name,
            ],
            'language' => $this->language,
            'source_code' => $this->source_code,
            'status' => $this->status,
            'score' => $this->score,
            'execution_time_ms' => $this->execution_time_ms,
            'memory_kb' => $this->memory_kb,
            'error_message' => $this->error_message,
            'submitted_at' => $this->submitted_at?->toIso8601String(),
            'finished_at' => $this->finished_at?->toIso8601String(),
            'test_results' => $this->testResults->map(function ($result, $index) {
                $isSample = $result->testCase?->is_sample ?? false;

                $data = [
                    'id' => $result->id,
                    'position' => $result->testCase?->position ?? ($index + 1),
                    'status' => $result->status,
                    'execution_time_ms' => $result->execution_time_ms,
                    'memory_kb' => $result->memory_kb,
                    'points_awarded' => $result->points_awarded,
                    'is_sample' => $isSample,
                ];

                // Only disclose input/output if it was a public sample case
                if ($isSample) {
                    $data['input_data'] = $result->testCase->input_data;
                    $data['expected_output'] = $result->testCase->expected_output;
                }

                return $data;
            }),
        ];
    }
}
