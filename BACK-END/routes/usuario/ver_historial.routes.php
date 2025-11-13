<?php

// Importaciones necesarias
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\usuario\VerHistorialController;
use App\Http\Middleware\verificarToken;

// Bitácoras - Obtener todas las bitácoras (cabecera)
Route::get('/bitacora', [VerHistorialController::class, 'index'])
    ->middleware(['verificarToken', 'verificarPermiso:VER_HISTORIAL']);

// Bitácora - Obtener bitácora por ID
Route::get('/bitacora/{id}', [VerHistorialController::class, 'showById'])
    ->middleware(['verificarToken', 'verificarPermiso:VER_HISTORIAL']);

// Bitácoras - Obtener bitácoras por ID de usuario
Route::get('/bitacora/usuario/{id_usuario}', [VerHistorialController::class, 'showByUserId'])
    ->middleware(['verificarToken', 'verificarPermiso:VER_HISTORIAL']);

// Detalle de bitácora - Obtener todos los detalles de una bitácora por ID de bitácora
Route::get('/bitacora/{id_bitacora}/detalles', [VerHistorialController::class, 'getDetallesByBitacoraId'])
    ->middleware(['verificarToken', 'verificarPermiso:VER_HISTORIAL']);

// Detalle de bitácora - Obtener un detalle específico por ID de detalle y bitácora
Route::get('/bitacora/{id_bitacora}/detalle/{id_detalle}', [VerHistorialController::class, 'getDetalleById'])
    ->middleware(['verificarToken', 'verificarPermiso:VER_HISTORIAL']);
