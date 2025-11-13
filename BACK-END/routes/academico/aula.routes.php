<?php

// Importaciones necesarias
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\academico\AulaController;
use App\Http\Middleware\verificarToken;

// Obtener todas las aulas
Route::get('/aula', [AulaController::class, 'index'])
    ->middleware(['verificarToken', 'verificarPermiso:VER_AULA']);

// Obtener aula por NRO
Route::get('/aula/{nro}', [AulaController::class, 'showByNro'])
    ->middleware(['verificarToken', 'verificarPermiso:VER_AULA']);

// Crear nueva aula
Route::post('/aula', [AulaController::class, 'store'])
    ->middleware(['verificarToken', 'verificarPermiso:CREAR_AULA']);

// Actualizar aula por NRO
Route::put('/aula/{nro}', [AulaController::class, 'update'])
    ->middleware(['verificarToken', 'verificarPermiso:MODIFICAR_AULA']);

// Eliminar aula por NRO
Route::delete('/aula/{nro}', [AulaController::class, 'destroy'])
    ->middleware(['verificarToken', 'verificarPermiso:ELIMINAR_AULA']);
