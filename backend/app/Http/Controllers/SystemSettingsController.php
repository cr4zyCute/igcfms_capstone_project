<?php

namespace App\Http\Controllers;

use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class SystemSettingsController extends Controller
{
    // Get system settings
    public function index()
    {
        // Try to get from cache first
        $settings = Cache::remember('system_settings', 3600, function () {
            $settingsArray = SystemSetting::pluck('value', 'key')->toArray();
            
            // Return default settings if none exist
            if (empty($settingsArray)) {
                return [
                    'systemName' => 'IGCFMS',
                    'timezone' => 'Asia/Manila',
                    'dateFormat' => 'DD/MM/YYYY',
                    'currency' => 'PHP',
                    'language' => 'en',
                    'sessionTimeout' => 30,
                    'passwordMinLength' => 8,
                    'maxLoginAttempts' => 5,
                    'twoFactorAuth' => false,
                    'emailNotifications' => true,
                    'auditLogRetention' => 365
                ];
            }
            
            // Convert string values to appropriate types
            $settingsArray['sessionTimeout'] = (int) ($settingsArray['sessionTimeout'] ?? 30);
            $settingsArray['passwordMinLength'] = (int) ($settingsArray['passwordMinLength'] ?? 8);
            $settingsArray['maxLoginAttempts'] = (int) ($settingsArray['maxLoginAttempts'] ?? 5);
            $settingsArray['auditLogRetention'] = (int) ($settingsArray['auditLogRetention'] ?? 365);
            $settingsArray['twoFactorAuth'] = filter_var($settingsArray['twoFactorAuth'] ?? false, FILTER_VALIDATE_BOOLEAN);
            $settingsArray['emailNotifications'] = filter_var($settingsArray['emailNotifications'] ?? true, FILTER_VALIDATE_BOOLEAN);
            
            return $settingsArray;
        });

        return response()->json($settings);
    }

    // Update system settings
    public function update(Request $request)
    {
        $request->validate([
            'systemName' => 'required|string|max:100',
            'timezone' => 'required|string|max:50',
            'dateFormat' => 'required|string|max:20',
            'currency' => 'required|string|max:10',
            'language' => 'required|string|max:10',
            'sessionTimeout' => 'required|integer|min:5|max:480',
            'passwordMinLength' => 'required|integer|min:6|max:20',
            'maxLoginAttempts' => 'required|integer|min:3|max:10',
            'auditLogRetention' => 'required|integer|min:30|max:3650',
            'twoFactorAuth' => 'boolean',
            'emailNotifications' => 'boolean'
        ]);

        $settings = $request->all();

        // Update or create each setting
        foreach ($settings as $key => $value) {
            SystemSetting::updateOrCreate(
                ['key' => $key],
                ['value' => is_bool($value) ? ($value ? '1' : '0') : $value]
            );
        }

        // Clear cache
        Cache::forget('system_settings');

        return response()->json([
            'message' => 'System settings updated successfully',
            'settings' => $settings
        ]);
    }

    // Get a specific setting
    public function getSetting($key)
    {
        $setting = SystemSetting::where('key', $key)->first();
        
        if (!$setting) {
            return response()->json(['message' => 'Setting not found'], 404);
        }

        return response()->json([
            'key' => $setting->key,
            'value' => $setting->value
        ]);
    }

    // Update a specific setting
    public function updateSetting(Request $request, $key)
    {
        $request->validate([
            'value' => 'required'
        ]);

        $setting = SystemSetting::updateOrCreate(
            ['key' => $key],
            ['value' => $request->value]
        );

        // Clear cache
        Cache::forget('system_settings');

        return response()->json([
            'message' => 'Setting updated successfully',
            'setting' => $setting
        ]);
    }
}
