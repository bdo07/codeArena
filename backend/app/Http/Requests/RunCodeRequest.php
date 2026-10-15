<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RunCodeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'language' => ['required', 'string', 'in:python,javascript,cpp'],
            'source_code' => ['required', 'string', 'max:65536'],
        ];
    }
}
