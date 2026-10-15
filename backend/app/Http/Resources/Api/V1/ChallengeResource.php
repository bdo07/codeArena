<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChallengeResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     * Never returns hidden test cases or evaluator secrets.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'title' => $this->title,
            'description' => $this->description,
            'input_description' => $this->input_description,
            'output_description' => $this->output_description,
            'constraints' => $this->constraints,
            'difficulty' => $this->difficulty,
            'starter_code' => $this->starter_code,
            'time_limit_ms' => $this->time_limit_ms,
            'memory_limit_mb' => $this->memory_limit_mb,
            'is_published' => $this->is_published,
            'tags' => $this->tags->map(fn ($tag) => [
                'id' => $tag->id,
                'name' => $tag->name,
                'slug' => $tag->slug,
            ]),
            'sample_test_cases' => $this->sampleTestCases->map(fn ($tc) => [
                'id' => $tc->id,
                'position' => $tc->position,
                'input_data' => $tc->input_data,
                'expected_output' => $tc->expected_output,
                'points' => $tc->points,
            ]),
            'total_test_cases_count' => $this->testCases()->count(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
