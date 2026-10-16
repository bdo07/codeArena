<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\LanguageCatalogService;
use Illuminate\Http\JsonResponse;

class LanguageController extends Controller
{
    public function __construct(
        protected LanguageCatalogService $catalogService
    ) {}

    /**
     * Get the programming language and technology catalog
     */
    public function index(): JsonResponse
    {
        $catalog = $this->catalogService->getCatalog();
        $judgeStatus = $this->catalogService->checkJudge0Status();

        return response()->json([
            'data' => $catalog,
            'evaluator_status' => [
                'judge0' => $judgeStatus,
                'sqlite_sandbox' => [
                    'online' => true,
                    'version' => 'SQLite 3 (Isolated In-Memory PDO)',
                ],
                'client_sandbox' => [
                    'online' => true,
                    'version' => 'HTML5 / Modern Browser Iframe Sandbox',
                ],
            ],
        ]);
    }
}
