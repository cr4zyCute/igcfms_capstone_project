<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

//to successfully connected to the frontend use this code 
Route::prefix('api')->group(function () {
    Route::get('/test', function () {
        return response()->json(['message' => 'Working! Pero Kamo wala sad :(']);
    });

    Route::get('/health', function () {
        return response()->json(['status' => 'healthy']);
    });
});
