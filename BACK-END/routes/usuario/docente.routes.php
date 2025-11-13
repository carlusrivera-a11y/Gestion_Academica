<?php

// Importaciones necesarias
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\usuario\DocenteController;
use App\Http\Middleware\verificarToken;

// Docente - Crear docente desde cero
Route::post('/docente/storeFromScratch', [DocenteController::class, 'storeFromScratch'])
    ->middleware(['verificarToken', 'verificarPermiso:CREAR_DOCENTE']);

// Docente - Asignar docente a usuario existente
Route::post('/docente/assignToExistingUser', [DocenteController::class, 'assignToExistingUser'])
    ->middleware(['verificarToken', 'verificarPermiso:CREAR_DOCENTE']);

// Docente - Obtener todos los docentes
Route::get('/docente', [DocenteController::class, 'index'])
    ->middleware(['verificarToken', 'verificarPermiso:VER_DOCENTE']);

// Docente - Obtener docente por ID de usuario
Route::get('/docente/usuario/{id_usuario}', [DocenteController::class, 'showByUserId'])
    ->middleware(['verificarToken', 'verificarPermiso:VER_DOCENTE']);

// Docente - Obtener docente por código
Route::get('/docente/codigo/{codigo}', [DocenteController::class, 'showByCodigo'])
    ->middleware(['verificarToken', 'verificarPermiso:VER_DOCENTE']);

// Docente - Actualizar docente por ID de usuario
Route::put('/docente/{id_usuario}', [DocenteController::class, 'update'])
    ->middleware(['verificarToken', 'verificarPermiso:MODIFICAR_DOCENTE']);

// Docente - Eliminar docente por ID de usuario
Route::delete('/docente/{id_usuario}', [DocenteController::class, 'destroy'])
    ->middleware(['verificarToken', 'verificarPermiso:ELIMINAR_DOCENTE']);
