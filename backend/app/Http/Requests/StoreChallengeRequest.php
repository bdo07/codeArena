<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreChallengeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->isAdmin();
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'regex:/^[a-z0-9-]+$/', 'unique:challenges,slug'],
            'description' => ['required', 'string'],
            'input_description' => ['nullable', 'string'],
            'output_description' => ['nullable', 'string'],
            'constraints' => ['nullable', 'string'],
            'difficulty' => ['required', 'in:Easy,Medium,Hard'],
            'starter_code' => ['nullable', 'array'],
            'time_limit_ms' => ['required', 'integer', 'min:100', 'max:10000'],
            'memory_limit_mb' => ['required', 'integer', 'min:16', 'max:1024'],
            'is_published' => ['boolean'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string'],
            'test_cases' => ['required', 'array', 'min:1'],
            'test_cases.*.input_data' => ['required', 'string'],
            'test_cases.*.expected_output' => ['required', 'string'],
            'test_cases.*.is_sample' => ['boolean'],
            'test_cases.*.points' => ['integer', 'min:1'],
        ];
    }
}
