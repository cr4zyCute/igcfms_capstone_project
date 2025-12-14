<?php

namespace App\Helpers;

class SecurityHelper
{
    /**
     * Sanitize a string for safe use in LIKE queries
     * Escapes special LIKE characters: %, _, \
     */
    public static function escapeLike(string $value, int $maxLength = 100): string
    {
        $value = substr($value, 0, $maxLength);
        return addcslashes($value, '%_\\');
    }

    /**
     * Sanitize search input - removes dangerous characters
     */
    public static function sanitizeSearch(string $value): string
    {
        // Remove null bytes
        $value = str_replace(chr(0), '', $value);
        
        // Remove control characters
        $value = preg_replace('/[\x00-\x1F\x7F]/', '', $value);
        
        // Trim and limit length
        $value = trim($value);
        $value = substr($value, 0, 255);
        
        return $value;
    }

    /**
     * Validate and sanitize an ID parameter
     */
    public static function sanitizeId($id): ?int
    {
        if (is_numeric($id) && $id > 0) {
            return (int) $id;
        }
        return null;
    }

    /**
     * Sanitize email input
     */
    public static function sanitizeEmail(string $email): string
    {
        $email = filter_var($email, FILTER_SANITIZE_EMAIL);
        return strtolower(trim($email));
    }

    /**
     * Check if string contains potential SQL injection
     */
    public static function containsSqlInjection(string $value): bool
    {
        $patterns = [
            '/(\%27)|(\')|(\-\-)|(\%23)|(#)/i',
            '/((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i',
            '/\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i',
            '/((\%27)|(\'))union/i',
            '/exec(\s|\+)+(s|x)p\w+/i',
            '/UNION(\s+)SELECT/i',
            '/;\s*(DROP|DELETE|UPDATE|INSERT|ALTER|CREATE)/i',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $value)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Sanitize filename to prevent path traversal
     */
    public static function sanitizeFilename(string $filename): string
    {
        // Remove path traversal characters
        $filename = str_replace(['../', '..\\', '/', '\\'], '', $filename);
        
        // Remove null bytes
        $filename = str_replace(chr(0), '', $filename);
        
        // Only allow alphanumeric, dash, underscore, and dot
        $filename = preg_replace('/[^a-zA-Z0-9\-_\.]/', '', $filename);
        
        return $filename;
    }
}
