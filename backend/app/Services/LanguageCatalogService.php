<?php

namespace App\Services;

use App\Models\Language;
use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class LanguageCatalogService
{
    protected string $judgeUrl;
    protected ?string $apiKey;

    public function __construct()
    {
        $this->judgeUrl = rtrim(config('services.judge0.url', env('JUDGE0_URL', 'http://localhost:2358')), '/');
        $this->apiKey = config('services.judge0.api_key', env('JUDGE0_API_KEY'));
    }

    /**
     * Check Judge0 connection status and retrieve available languages if online
     */
    public function checkJudge0Status(): array
    {
        return Cache::remember('judge0_status', 30, function () {
            if (empty($this->judgeUrl)) {
                return [
                    'online' => false,
                    'version' => null,
                    'supported_languages_count' => 0,
                    'error' => 'Judge0 URL is not configured.',
                ];
            }

            try {
                $headers = ['Accept' => 'application/json'];
                if (!empty($this->apiKey)) {
                    $headers['X-Auth-Token'] = $this->apiKey;
                    $headers['X-RapidAPI-Key'] = $this->apiKey;
                }

                $response = Http::withHeaders($headers)
                    ->timeout(2)
                    ->get("{$this->judgeUrl}/about");

                if ($response->successful()) {
                    $about = $response->json();
                    
                    // Fetch languages count
                    $langResp = Http::withHeaders($headers)->timeout(2)->get("{$this->judgeUrl}/languages");
                    $langCount = $langResp->successful() ? count($langResp->json()) : 0;

                    return [
                        'online' => true,
                        'version' => $about['version'] ?? '1.13.0',
                        'supported_languages_count' => $langCount,
                        'error' => null,
                    ];
                }
            } catch (Exception $e) {
                // Judge0 unreachable
            }

            return [
                'online' => false,
                'version' => null,
                'supported_languages_count' => 0,
                'error' => 'Judge0 CE service is unreachable at ' . $this->judgeUrl,
            ];
        });
    }

    /**
     * Get the full catalog of programming languages, tools, and frameworks
     * With accurate evaluator support flags
     */
    public function getCatalog(): array
    {
        $judgeStatus = $this->checkJudge0Status();
        $isJudgeOnline = $judgeStatus['online'];

        // Retrieve from database if populated, or return default definitions
        $dbLanguages = Language::orderBy('name')->get();

        if ($dbLanguages->isNotEmpty()) {
            return $dbLanguages->map(function ($lang) use ($isJudgeOnline) {
                $isExecutable = match ($lang->evaluator_type) {
                    'judge0' => $isJudgeOnline || (bool) env('JUDGE0_USE_LOCAL_FALLBACK', true),
                    'sqlite_sandbox' => true,
                    'client_sandbox' => true,
                    'quiz_engine' => true,
                    default => false,
                };

                return [
                    'id' => $lang->id,
                    'name' => $lang->name,
                    'slug' => $lang->slug,
                    'category' => $lang->category,
                    'monaco_mode' => $lang->monaco_mode,
                    'judge0_id' => $lang->judge0_id,
                    'evaluator_type' => $lang->evaluator_type,
                    'version' => $lang->version,
                    'is_executable' => $isExecutable,
                    'is_active' => $lang->is_active,
                ];
            })->toArray();
        }

        return $this->getDefaultCatalog($isJudgeOnline);
    }

    /**
     * Default catalog metadata
     */
    public function getDefaultCatalog(bool $isJudgeOnline): array
    {
        $useFallback = (bool) env('JUDGE0_USE_LOCAL_FALLBACK', true);

        $items = [
            // Standard executable languages (Judge0 or fallback)
            ['name' => 'Python', 'slug' => 'python', 'category' => 'language', 'monaco_mode' => 'python', 'judge0_id' => 71, 'evaluator_type' => 'judge0', 'version' => '3.8.1'],
            ['name' => 'JavaScript', 'slug' => 'javascript', 'category' => 'language', 'monaco_mode' => 'javascript', 'judge0_id' => 63, 'evaluator_type' => 'judge0', 'version' => 'Node.js 12.14.0'],
            ['name' => 'TypeScript', 'slug' => 'typescript', 'category' => 'language', 'monaco_mode' => 'typescript', 'judge0_id' => 74, 'evaluator_type' => 'judge0', 'version' => '3.7.4'],
            ['name' => 'C++', 'slug' => 'cpp', 'category' => 'language', 'monaco_mode' => 'cpp', 'judge0_id' => 54, 'evaluator_type' => 'judge0', 'version' => 'GCC 9.2.0'],
            ['name' => 'C', 'slug' => 'c', 'category' => 'language', 'monaco_mode' => 'c', 'judge0_id' => 50, 'evaluator_type' => 'judge0', 'version' => 'GCC 9.2.0'],
            ['name' => 'Java', 'slug' => 'java', 'category' => 'language', 'monaco_mode' => 'java', 'judge0_id' => 62, 'evaluator_type' => 'judge0', 'version' => 'OpenJDK 13.0.1'],
            ['name' => 'C#', 'slug' => 'csharp', 'category' => 'language', 'monaco_mode' => 'csharp', 'judge0_id' => 51, 'evaluator_type' => 'judge0', 'version' => 'Mono 6.6.0'],
            ['name' => 'PHP', 'slug' => 'php', 'category' => 'language', 'monaco_mode' => 'php', 'judge0_id' => 68, 'evaluator_type' => 'judge0', 'version' => '7.4.1'],
            ['name' => 'Go', 'slug' => 'go', 'category' => 'language', 'monaco_mode' => 'go', 'judge0_id' => 60, 'evaluator_type' => 'judge0', 'version' => '1.13.5'],
            ['name' => 'Rust', 'slug' => 'rust', 'category' => 'language', 'monaco_mode' => 'rust', 'judge0_id' => 73, 'evaluator_type' => 'judge0', 'version' => '1.40.0'],
            ['name' => 'Ruby', 'slug' => 'ruby', 'category' => 'language', 'monaco_mode' => 'ruby', 'judge0_id' => 72, 'evaluator_type' => 'judge0', 'version' => '2.7.0'],
            ['name' => 'Bash / Shell', 'slug' => 'bash', 'category' => 'language', 'monaco_mode' => 'shell', 'judge0_id' => 46, 'evaluator_type' => 'judge0', 'version' => '5.0.0'],
            ['name' => 'Kotlin', 'slug' => 'kotlin', 'category' => 'language', 'monaco_mode' => 'kotlin', 'judge0_id' => 78, 'evaluator_type' => 'judge0', 'version' => '1.3.70'],
            ['name' => 'Swift', 'slug' => 'swift', 'category' => 'language', 'monaco_mode' => 'swift', 'judge0_id' => 83, 'evaluator_type' => 'judge0', 'version' => '5.2.3'],
            ['name' => 'Dart', 'slug' => 'dart', 'category' => 'language', 'monaco_mode' => 'dart', 'judge0_id' => 90, 'evaluator_type' => 'judge0', 'version' => '2.19.6'],
            ['name' => 'R', 'slug' => 'r', 'category' => 'language', 'monaco_mode' => 'r', 'judge0_id' => 80, 'evaluator_type' => 'judge0', 'version' => '4.0.0'],
            ['name' => 'Scala', 'slug' => 'scala', 'category' => 'language', 'monaco_mode' => 'scala', 'judge0_id' => 81, 'evaluator_type' => 'judge0', 'version' => '2.13.2'],
            ['name' => 'Perl', 'slug' => 'perl', 'category' => 'language', 'monaco_mode' => 'perl', 'judge0_id' => 85, 'evaluator_type' => 'judge0', 'version' => '5.26.1'],
            ['name' => 'Lua', 'slug' => 'lua', 'category' => 'language', 'monaco_mode' => 'lua', 'judge0_id' => 64, 'evaluator_type' => 'judge0', 'version' => '5.3.5'],
            ['name' => 'Haskell', 'slug' => 'haskell', 'category' => 'language', 'monaco_mode' => 'haskell', 'judge0_id' => 61, 'evaluator_type' => 'judge0', 'version' => 'GHC 8.8.1'],
            ['name' => 'Elixir', 'slug' => 'elixir', 'category' => 'language', 'monaco_mode' => 'elixir', 'judge0_id' => 57, 'evaluator_type' => 'judge0', 'version' => '1.9.4'],
            ['name' => 'Clojure', 'slug' => 'clojure', 'category' => 'language', 'monaco_mode' => 'clojure', 'judge0_id' => 86, 'evaluator_type' => 'judge0', 'version' => '1.10.1'],
            ['name' => 'F#', 'slug' => 'fsharp', 'category' => 'language', 'monaco_mode' => 'fsharp', 'judge0_id' => 87, 'evaluator_type' => 'judge0', 'version' => '.NET Core 3.1'],
            ['name' => 'Visual Basic .NET', 'slug' => 'vbnet', 'category' => 'language', 'monaco_mode' => 'vb', 'judge0_id' => 84, 'evaluator_type' => 'judge0', 'version' => 'vbnc 0.0.0.5943'],
            ['name' => 'Assembly', 'slug' => 'assembly', 'category' => 'language', 'monaco_mode' => 'asm', 'judge0_id' => 45, 'evaluator_type' => 'judge0', 'version' => 'NASM 2.14.02'],
            ['name' => 'Objective-C', 'slug' => 'objc', 'category' => 'language', 'monaco_mode' => 'objective-c', 'judge0_id' => 79, 'evaluator_type' => 'judge0', 'version' => 'Clang 7.0.1'],
            ['name' => 'Fortran', 'slug' => 'fortran', 'category' => 'language', 'monaco_mode' => 'fortran', 'judge0_id' => 56, 'evaluator_type' => 'judge0', 'version' => 'GFortran 9.2.0'],
            ['name' => 'COBOL', 'slug' => 'cobol', 'category' => 'language', 'monaco_mode' => 'cobol', 'judge0_id' => 77, 'evaluator_type' => 'judge0', 'version' => 'GnuCOBOL 2.2'],
            ['name' => 'PowerShell', 'slug' => 'powershell', 'category' => 'language', 'monaco_mode' => 'powershell', 'judge0_id' => 91, 'evaluator_type' => 'judge0', 'version' => 'Core 7.0'],

            // SQL Dedicated Evaluator
            ['name' => 'SQL (SQLite)', 'slug' => 'sql', 'category' => 'database', 'monaco_mode' => 'sql', 'judge0_id' => 82, 'evaluator_type' => 'sqlite_sandbox', 'version' => 'SQLite 3'],
            ['name' => 'PostgreSQL', 'slug' => 'postgresql', 'category' => 'database', 'monaco_mode' => 'sql', 'judge0_id' => null, 'evaluator_type' => 'sqlite_sandbox', 'version' => 'ANSI / SQLite compatible'],
            ['name' => 'MySQL', 'slug' => 'mysql', 'category' => 'database', 'monaco_mode' => 'sql', 'judge0_id' => null, 'evaluator_type' => 'sqlite_sandbox', 'version' => 'ANSI / SQLite compatible'],

            // Frontend Client Sandbox Evaluators
            ['name' => 'HTML5', 'slug' => 'html5', 'category' => 'web', 'monaco_mode' => 'html', 'judge0_id' => null, 'evaluator_type' => 'client_sandbox', 'version' => 'HTML5 Standard'],
            ['name' => 'CSS3', 'slug' => 'css3', 'category' => 'web', 'monaco_mode' => 'css', 'judge0_id' => null, 'evaluator_type' => 'client_sandbox', 'version' => 'CSS3 / Modern Flex & Grid'],

            // Framework & Track Catalogs (Syntax & Challenge availability; execution marked honestly)
            ['name' => 'React', 'slug' => 'react', 'category' => 'framework', 'monaco_mode' => 'javascript', 'judge0_id' => null, 'evaluator_type' => 'client_sandbox', 'version' => '18.x'],
            ['name' => 'Next.js', 'slug' => 'nextjs', 'category' => 'framework', 'monaco_mode' => 'typescript', 'judge0_id' => null, 'evaluator_type' => 'none', 'version' => '14.x'],
            ['name' => 'Node.js', 'slug' => 'nodejs', 'category' => 'framework', 'monaco_mode' => 'javascript', 'judge0_id' => 63, 'evaluator_type' => 'judge0', 'version' => '18.x'],
            ['name' => 'Laravel', 'slug' => 'laravel', 'category' => 'framework', 'monaco_mode' => 'php', 'judge0_id' => 68, 'evaluator_type' => 'none', 'version' => '11.x'],
            ['name' => 'Django', 'slug' => 'django', 'category' => 'framework', 'monaco_mode' => 'python', 'judge0_id' => null, 'evaluator_type' => 'none', 'version' => '5.x'],
            ['name' => 'FastAPI', 'slug' => 'fastapi', 'category' => 'framework', 'monaco_mode' => 'python', 'judge0_id' => null, 'evaluator_type' => 'none', 'version' => '0.110.x'],
            ['name' => 'Spring Boot', 'slug' => 'springboot', 'category' => 'framework', 'monaco_mode' => 'java', 'judge0_id' => null, 'evaluator_type' => 'none', 'version' => '3.x'],
            ['name' => 'Docker', 'slug' => 'docker', 'category' => 'tool', 'monaco_mode' => 'dockerfile', 'judge0_id' => null, 'evaluator_type' => 'quiz_engine', 'version' => '24.x'],
            ['name' => 'Git & GitHub', 'slug' => 'git', 'category' => 'tool', 'monaco_mode' => 'shell', 'judge0_id' => null, 'evaluator_type' => 'quiz_engine', 'version' => '2.40+'],
            ['name' => 'Linux / CLI', 'slug' => 'linux', 'category' => 'tool', 'monaco_mode' => 'shell', 'judge0_id' => 46, 'evaluator_type' => 'judge0', 'version' => 'POSIX / Bash'],
        ];

        return array_map(function ($item) use ($isJudgeOnline, $useFallback) {
            $isExecutable = match ($item['evaluator_type']) {
                'judge0' => $isJudgeOnline || $useFallback,
                'sqlite_sandbox' => true,
                'client_sandbox' => true,
                'quiz_engine' => true,
                default => false,
            };

            return array_merge($item, [
                'is_executable' => $isExecutable,
                'is_active' => true,
            ]);
        }, $items);
    }
}
