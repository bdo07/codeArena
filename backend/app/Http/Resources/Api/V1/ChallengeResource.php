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
            'category' => $this->category,
            'challenge_type' => $this->challenge_type ?? 'code',
            'estimated_time_min' => $this->estimated_time_min ?? 20,
            'starter_code' => $this->starter_code,
            'hints' => $this->hints ?? [],
            'explanation' => $this->explanation,
            'sql_schema' => $this->sql_schema,
            'sql_seed' => $this->sql_seed,
            'web_template' => $this->web_template,
            'quiz_data' => (function () {
                $rawQuiz = $this->quiz_data;
                if (! $rawQuiz) {
                    return null;
                }
                $questions = [];
                if (is_array($rawQuiz)) {
                    $questions = isset($rawQuiz['questions']) && is_array($rawQuiz['questions'])
                        ? $rawQuiz['questions']
                        : $rawQuiz;
                } elseif (is_string($rawQuiz)) {
                    $decoded = json_decode($rawQuiz, true);
                    if (is_array($decoded)) {
                        $questions = isset($decoded['questions']) && is_array($decoded['questions'])
                            ? $decoded['questions']
                            : $decoded;
                    }
                }

                if (empty($questions) || ! is_array($questions)) {
                    return null;
                }

                return [
                    'questions' => array_values(array_map(function ($q, $index) {
                        return [
                            'id' => $q['id'] ?? (string) $index,
                            'question' => $q['question'] ?? '',
                            'options' => $q['options'] ?? [],
                        ];
                    }, $questions, array_keys($questions))),
                ];
            })(),
            'is_daily' => (bool) $this->is_daily,
            'daily_date' => $this->daily_date?->toDateString(),
            'supported_languages' => $this->supported_languages,
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
