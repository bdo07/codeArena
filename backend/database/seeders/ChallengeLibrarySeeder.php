<?php

namespace Database\Seeders;

use App\Services\ChallengeImportExportService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;

class ChallengeLibrarySeeder extends Seeder
{
    public function run(): void
    {
        $jsonPath = __DIR__ . '/data/challenges.json';
        if (!File::exists($jsonPath)) {
            $this->command->error("Challenges JSON file not found at: {$jsonPath}");
            return;
        }

        $jsonContent = File::get($jsonPath);
        $importService = app(ChallengeImportExportService::class);
        $result = $importService->importJson($jsonContent, true);

        $this->command->info("Seeded challenges: Imported: {$result['imported']}, Updated: {$result['updated']}, Skipped: {$result['skipped']}");
        if (!empty($result['errors'])) {
            foreach (array_slice($result['errors'], 0, 5) as $err) {
                $this->command->warn($err);
            }
        }
    }
}
