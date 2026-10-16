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

        foreach ($catalog as $lang) {
            Language::updateOrCreate(
                ['slug' => $lang['slug']],
                [
                    'name' => $lang['name'],
                    'category' => $lang['category'],
                    'monaco_mode' => $lang['monaco_mode'],
                    'judge0_id' => $lang['judge0_id'],
                    'evaluator_type' => $lang['evaluator_type'],
                    'version' => $lang['version'],
                    'is_active' => true,
                ]
            );
        }
    }
}
