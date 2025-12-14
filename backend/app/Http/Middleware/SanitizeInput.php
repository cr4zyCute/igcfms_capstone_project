<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SanitizeInput
{
    /**
     * SQL injection patterns to detect and block
     */
    protected $sqlPatterns = [
        '/(\%27)|(\')|(\-\-)|(\%23)|(#)/i',                    // Basic SQL injection
        '/((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i', // SQL injection with equals
        '/\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i', // SQL injection with OR
        '/((\%27)|(\'))union/i',                                 // UNION attacks
        '/exec(\s|\+)+(s|x)p\w+/i',                             // Stored procedure attacks
        '/UNION(\s+)SELECT/i',                                   // UNION SELECT
        '/INSERT(\s+)INTO/i',                                    // INSERT attacks
        '/DELETE(\s+)FROM/i',                                    // DELETE attacks
        '/DROP(\s+)TABLE/i',                                     // DROP TABLE attacks
        '/UPDATE(\s+)\w+(\s+)SET/i',                            // UPDATE attacks
        '/SELECT(\s+).*(\s+)FROM/i',                            // SELECT FROM attacks
        '/\bOR\b\s+\d+\s*=\s*\d+/i',                            // OR 1=1 attacks
        '/\bAND\b\s+\d+\s*=\s*\d+/i',                           // AND 1=1 attacks
        '/;\s*(DROP|DELETE|UPDATE|INSERT|ALTER|CREATE)/i',      // Chained SQL commands
    ];

    /**
     * Fields that should be excluded from sanitization (like passwords, rich text)
     */
    protected $excludedFields = [
        'password',
        'password_confirmation',
        'current_password',
        'description', // May contain legitimate special characters
        'details',
        'data',
        'changes',
    ];

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check for SQL injection patterns in all input
        $input = $request->all();
        
        if ($this->containsSqlInjection($input)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid input detected. Request blocked for security reasons.',
            ], 400);
        }

        // Sanitize input values
        $sanitized = $this->sanitizeArray($input);
        $request->merge($sanitized);

        return $next($request);
    }

    /**
     * Check if input contains SQL injection patterns
     */
    protected function containsSqlInjection(array $input, string $prefix = ''): bool
    {
        foreach ($input as $key => $value) {
            $fieldName = $prefix ? "{$prefix}.{$key}" : $key;
            
            // Skip excluded fields
            if ($this->isExcludedField($key)) {
                continue;
            }

            if (is_array($value)) {
                if ($this->containsSqlInjection($value, $fieldName)) {
                    return true;
                }
            } elseif (is_string($value)) {
                foreach ($this->sqlPatterns as $pattern) {
                    if (preg_match($pattern, $value)) {
                        \Log::warning('SQL injection attempt detected', [
                            'field' => $fieldName,
                            'value' => substr($value, 0, 100),
                            'ip' => request()->ip(),
                            'user_agent' => request()->userAgent(),
                        ]);
                        return true;
                    }
                }
            }
        }

        return false;
    }

    /**
     * Sanitize array values recursively
     */
    protected function sanitizeArray(array $input): array
    {
        $sanitized = [];

        foreach ($input as $key => $value) {
            // Skip excluded fields
            if ($this->isExcludedField($key)) {
                $sanitized[$key] = $value;
                continue;
            }

            if (is_array($value)) {
                $sanitized[$key] = $this->sanitizeArray($value);
            } elseif (is_string($value)) {
                $sanitized[$key] = $this->sanitizeString($value);
            } else {
                $sanitized[$key] = $value;
            }
        }

        return $sanitized;
    }

    /**
     * Sanitize a string value
     */
    protected function sanitizeString(string $value): string
    {
        // Trim whitespace
        $value = trim($value);
        
        // Remove null bytes
        $value = str_replace(chr(0), '', $value);
        
        // Convert special HTML characters
        $value = htmlspecialchars($value, ENT_QUOTES | ENT_HTML5, 'UTF-8', false);
        
        return $value;
    }

    /**
     * Check if field should be excluded from sanitization
     */
    protected function isExcludedField(string $key): bool
    {
        return in_array(strtolower($key), array_map('strtolower', $this->excludedFields));
    }
}
