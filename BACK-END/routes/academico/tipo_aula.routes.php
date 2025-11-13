<?php

// Importaciones necesarias
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\academico\TipoAulaController;
use App\Http\Middleware\verificarToken;

// Obtener todos los tipos de aula
Route::get('/tipo', [TipoAulaController::class, 'index'])
    ->middleware(['verificarToken', 'verificarPermiso:VER_AULA']);

// Obtener tipo de aula por ID
Route::get('/tipo/{id}', [TipoAulaController::class, 'showById'])
    ->middleware(['verificarToken', 'verificarPermiso:VER_AULA']);

// Obtener tipo de aula por nombre
Route::get('/tipo/nombre/{nombre}', [TipoAulaController::class, 'showByNombre'])
    ->middleware(['verificarToken', 'verificarPermiso:VER_AULA']);

// Crear nuevo tipo de aula
Route::post('/tipo', [TipoAulaController::class, 'store'])
    ->middleware(['verificarToken', 'verificarPermiso:CREAR_AULA']);

// Actualizar tipo de aula
Route::put('/tipo/{id}', [TipoAulaController::class, 'update'])
    ->middleware(['verificarToken', 'verificarPermiso:MODIFICAR_AULA']);

// Eliminar tipo de aula
Route::delete('/tipo/{id}', [TipoAulaController::class, 'destroy'])
    ->middleware(['verificarToken', 'verificarPermiso:ELIMINAR_AULA']);
