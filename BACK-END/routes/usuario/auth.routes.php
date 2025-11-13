<?php

// Importaciones necesarias
use App\Http\Controllers\usuario\authController;
use App\Http\Middleware\verificarToken;
use App\Http\Middleware\getClientIp;

Route::prefix('auth')->group(function () {
    // Ruta para Login
    Route::post('/login', [authController::class, 'login'])->middleware(getClientIp::class);
    
    // Ruta para Logout
    Route::post('/logout', [authController::class, 'logout'])->middleware(verificarToken::class);

    // Ruta para obtener datos del usuario autenticado
    Route::get('/me', [authController::class, 'me'])->middleware(verificarToken::class);
});