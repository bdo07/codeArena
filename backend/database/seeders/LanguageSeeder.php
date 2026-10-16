<?php

namespace Database\Seeders;

use App\Models\Language;
use App\Services\LanguageCatalogService;
use Illuminate\Database\Seeder;

class LanguageSeeder extends Seeder
{
    public function run(): void
    {
        $service = app(LanguageCatalogService::class);
        $catalog = $service->getDefaultCatalog(false);

        foreach ($catalog as $idx => $lang) {
            Language::updateOrCreate(
                ['slug' => $lang['slug']],
                [
                    'name' => $lang['name'],
                    'category' => $lang['category'],
                    'monaco_language' => $lang['monaco_mode'] ?? 'plaintext',
                    'judge0_id' => $lang['judge0_id'],
                    'is_executable' => $lang['is_executable'] ?? false,
                    'evaluator_type' => $lang['evaluator_type'],
                    'version' => $lang['version'],
                    'position' => $idx + 1,
                ]
            );
        }
    }
}
