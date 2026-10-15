<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateChallengeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->isAdmin();
    }

    public function rules(): array
    {
        $challengeId = $this->route('challenge') ? $this->route('challenge')->id : null;

        return [
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'slug' => ['sometimes', 'required', 'string', 'max:255', 'regex:/^[a-z0-9-]+$/', Rule::unique('challenges', 'slug')->ignore($challengeId)],
            'description' => ['sometimes', 'required', 'string'],
            'input_description' => ['nullable', 'string'],
            'output_description' => ['nullable', 'string'],
            'constraints' => ['nullable', 'string'],
            'difficulty' => ['sometimes', 'required', 'in:Easy,Medium,Hard'],
            'starter_code' => ['nullable', 'array'],
            'time_limit_ms' => ['sometimes', 'required', 'integer', 'min:100', 'max:10000'],
            'memory_limit_mb' => ['sometimes', 'required', 'integer', 'min:16', 'max:1024'],
            'is_published' => ['sometimes', 'boolean'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string'],
            'test_cases' => ['nullable', 'array'],
            'test_cases.*.id' => ['nullable', 'integer'],
            'test_cases.*.input_data' => ['required', 'string'],
            'test_cases.*.expected_output' => ['required', 'string'],
            'test_cases.*.is_sample' => ['boolean'],
            'test_cases.*.points' => ['integer', 'min:1'],
        ];
    }
}
