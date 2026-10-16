<?php

namespace App\Services;

use App\Models\Challenge;
use App\Models\Tag;
use App\Models\TestCase;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ChallengeImportExportService
{
    protected array $validDifficulties = ['Beginner', 'Easy', 'Medium', 'Hard', 'Expert'];
    protected array $validTypes = ['code', 'sql', 'web', 'quiz'];

    /**
     * Import challenges from decoded JSON array or raw JSON string.
     *
     * @param array|string $data
     * @param bool $overwriteDuplicates
     * @return array [success => bool, imported => int, updated => int, skipped => int, errors => array]
     */
    public function importJson($data, bool $overwriteDuplicates = false): array
    {
        if (is_string($data)) {
            $decoded = json_decode($data, true);
            if (!is_array($decoded)) {
                return [
                    'success' => false,
                    'imported' => 0,
                    'updated' => 0,
                    'skipped' => 0,
                    'errors' => ['Invalid JSON structure provided.'],
                ];
            }
            $data = $decoded;
        }

        // If payload is wrapped in { challenges: [...] }
        if (isset($data['challenges']) && is_array($data['challenges'])) {
            $data = $data['challenges'];
        }

        $imported = 0;
        $updated = 0;
        $skipped = 0;
        $errors = [];

        foreach ($data as $index => $item) {
            $rowNum = $index + 1;
            $validation = $this->validateChallengeItem($item, $rowNum);
            if (!empty($validation['errors'])) {
                $errors = array_merge($errors, $validation['errors']);
                $skipped++;
                continue;
            }

            $slug = Str::slug($item['slug'] ?? $item['title']);
            $existing = Challenge::where('slug', $slug)
                ->orWhereRaw('LOWER(title) = ?', [strtolower(trim($item['title']))])
                ->first();

            if ($existing && !$overwriteDuplicates) {
                $errors[] = "Item #{$rowNum} ('{$item['title']}'): Duplicate challenge slug or title already exists. Skipped.";
                $skipped++;
                continue;
            }

            try {
                DB::transaction(function () use ($item, $slug, $existing, &$imported, &$updated) {
                    $challengeData = [
                        'slug' => $slug,
                        'title' => trim($item['title']),
                        'description' => $item['description'],
                        'category' => $item['category'] ?? 'algorithms',
                        'difficulty' => ucfirst(strtolower($item['difficulty'] ?? 'Easy')),
                        'challenge_type' => $item['challenge_type'] ?? 'code',
                        'estimated_time_min' => (int) ($item['estimated_time_min'] ?? 20),
                        'time_limit_ms' => (int) ($item['time_limit_ms'] ?? 2000),
                        'memory_limit_mb' => (int) ($item['memory_limit_mb'] ?? 128),
                        'starter_code' => $item['starter_code'] ?? [],
                        'hints' => $item['hints'] ?? [],
                        'explanation' => $item['explanation'] ?? null,
                        'reference_solution' => $item['reference_solution'] ?? null,
                        'sql_schema' => $item['sql_schema'] ?? null,
                        'sql_seed' => $item['sql_seed'] ?? null,
                        'sql_solution' => $item['sql_solution'] ?? null,
                        'web_template' => $item['web_template'] ?? null,
                        'quiz_data' => $item['quiz_data'] ?? null,
                        'is_daily' => (bool) ($item['is_daily'] ?? false),
                        'daily_date' => $item['daily_date'] ?? null,
                    ];

                    if ($existing) {
                        $existing->update($challengeData);
                        $challenge = $existing;
                        $updated++;
                    } else {
                        $challenge = Challenge::create($challengeData);
                        $imported++;
                    }

                    // Attach tags
                    if (!empty($item['tags']) && is_array($item['tags'])) {
                        $tagIds = [];
                        foreach ($item['tags'] as $tagName) {
                            $tag = Tag::firstOrCreate([
                                'slug' => Str::slug($tagName),
                            ], [
                                'name' => trim($tagName),
                            ]);
                            $tagIds[] = $tag->id;
                        }
                        $challenge->tags()->sync($tagIds);
                    }

                    // Save test cases if provided
                    if (!empty($item['test_cases']) && is_array($item['test_cases'])) {
                        $challenge->testCases()->delete();
                        foreach ($item['test_cases'] as $pos => $tc) {
                            $isSample = isset($tc['is_sample'])
                                ? (bool) $tc['is_sample']
                                : !((bool) ($tc['is_hidden'] ?? false));

                            $challenge->testCases()->create([
                                'input_data' => (string) ($tc['input'] ?? $tc['input_data'] ?? ''),
                                'expected_output' => (string) ($tc['expected_output'] ?? ''),
                                'is_sample' => $isSample,
                                'points' => (int) ($tc['points'] ?? 25),
                                'position' => (int) ($tc['position'] ?? $pos + 1),
                            ]);
                        }
                    }
                });
            } catch (Exception $e) {
                $errors[] = "Item #{$rowNum} ('{$item['title']}'): Database error: " . $e->getMessage();
                $skipped++;
            }
        }

        return [
            'success' => $imported > 0 || $updated > 0,
            'imported' => $imported,
            'updated' => $updated,
            'skipped' => $skipped,
            'errors' => $errors,
        ];
    }

    /**
     * Import challenges from CSV content.
     */
    public function importCsv(string $csvContent, bool $overwriteDuplicates = false): array
    {
        $lines = str_getcsv($csvContent, "\n");
        if (count($lines) < 2) {
            return [
                'success' => false,
                'imported' => 0,
                'updated' => 0,
                'skipped' => 0,
                'errors' => ['CSV file has no data rows.'],
            ];
        }

        $headers = str_getcsv(array_shift($lines));
        $headers = array_map(function ($h) {
            return strtolower(trim(str_replace('"', '', $h)));
        }, $headers);

        $jsonItems = [];
        foreach ($lines as $line) {
            if (empty(trim($line))) {
                continue;
            }
            $row = str_getcsv($line);
            if (count($row) !== count($headers)) {
                continue;
            }
            $item = array_combine($headers, $row);

            // Expand JSON fields if present
            foreach (['tags', 'starter_code', 'hints', 'test_cases', 'quiz_data', 'web_template', 'supported_languages'] as $jsonField) {
                if (!empty($item[$jsonField]) && is_string($item[$jsonField])) {
                    $decoded = json_decode($item[$jsonField], true);
                    if ($decoded !== null) {
                        $item[$jsonField] = $decoded;
                    } elseif ($jsonField === 'tags') {
                        $item[$jsonField] = array_map('trim', explode(',', $item[$jsonField]));
                    }
                }
            }

            $jsonItems[] = $item;
        }

        return $this->importJson($jsonItems, $overwriteDuplicates);
    }

    /**
     * Export all challenges as JSON.
     */
    public function exportJson(): array
    {
        return Challenge::with(['tags', 'testCases'])->get()->map(function ($c) {
            return [
                'slug' => $c->slug,
                'title' => $c->title,
                'description' => $c->description,
                'category' => $c->category,
                'difficulty' => $c->difficulty,
                'challenge_type' => $c->challenge_type,
                'estimated_time_min' => $c->estimated_time_min,
                'tags' => $c->tags->pluck('name')->toArray(),
                'supported_languages' => $c->supported_languages,
                'starter_code' => $c->starter_code,
                'hints' => $c->hints,
                'explanation' => $c->explanation,
                'reference_solution' => $c->reference_solution,
                'sql_schema' => $c->sql_schema,
                'sql_seed' => $c->sql_seed,
                'sql_solution' => $c->sql_solution,
                'web_template' => $c->web_template,
                'quiz_data' => $c->quiz_data,
                'test_cases' => $c->testCases->map(function ($tc) {
                    return [
                        'input' => $tc->input,
                        'expected_output' => $tc->expected_output,
                        'is_hidden' => (bool) $tc->is_hidden,
                        'explanation' => $tc->explanation,
                        'position' => $tc->position,
                    ];
                })->toArray(),
            ];
        })->toArray();
    }

    /**
     * Export all challenges as CSV.
     */
    public function exportCsv(): string
    {
        $challenges = $this->exportJson();
        $output = fopen('php://temp', 'r+');

        // Headers
        fputcsv($output, [
            'slug',
            'title',
            'category',
            'difficulty',
            'challenge_type',
            'estimated_time_min',
            'description',
            'tags',
            'supported_languages',
            'starter_code',
            'hints',
            'explanation',
            'reference_solution',
            'sql_schema',
            'sql_seed',
            'sql_solution',
        ]);

        foreach ($challenges as $c) {
            fputcsv($output, [
                $c['slug'],
                $c['title'],
                $c['category'],
                $c['difficulty'],
                $c['challenge_type'],
                $c['estimated_time_min'],
                $c['description'],
                implode(',', $c['tags']),
                json_encode($c['supported_languages']),
                json_encode($c['starter_code']),
                json_encode($c['hints']),
                $c['explanation'] ?? '',
                $c['reference_solution'] ?? '',
                $c['sql_schema'] ?? '',
                $c['sql_seed'] ?? '',
                $c['sql_solution'] ?? '',
            ]);
        }

        rewind($output);
        $csv = stream_get_contents($output);
        fclose($output);

        return $csv;
    }

    /**
     * Validate single challenge item structure.
     */
    protected function validateChallengeItem(array $item, int $rowNum): array
    {
        $errors = [];

        if (empty($item['title']) || !is_string($item['title'])) {
            $errors[] = "Item #{$rowNum}: 'title' is required and must be a string.";
        }

        if (empty($item['description']) || !is_string($item['description'])) {
            $errors[] = "Item #{$rowNum}: 'description' is required.";
        }

        if (isset($item['difficulty']) && !in_array(ucfirst(strtolower($item['difficulty'])), $this->validDifficulties)) {
            $errors[] = "Item #{$rowNum}: 'difficulty' must be one of: " . implode(', ', $this->validDifficulties);
        }

        if (isset($item['challenge_type']) && !in_array(strtolower($item['challenge_type']), $this->validTypes)) {
            $errors[] = "Item #{$rowNum}: 'challenge_type' must be one of: " . implode(', ', $this->validTypes);
        }

        return ['errors' => $errors];
    }
}
