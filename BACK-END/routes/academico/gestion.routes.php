<?php

// Importaciones necesarias
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\academico\GestionController;
use App\Http\Middleware\verificarToken;

// Obtener todas las gestiones
Route::get('/gestion', [GestionController::class, 'index'])
    ->middleware(['verificarToken', 'verificarPermiso:VER_GESTION']);

// Obtener gestión por ID
Route::get('/gestion/{id}', [GestionController::class, 'showById'])
    ->middleware(['verificarToken', 'verificarPermiso:VER_GESTION']);

// Obtener gestiones por año y semestre
Route::get('/gestion/filtrar', [GestionController::class, 'showByAnioSemestre'])
    ->middleware(['verificarToken', 'verificarPermiso:VER_GESTION']);

// Crear nueva gestión
Route::post('/gestion', [GestionController::class, 'store'])
    ->middleware(['verificarToken', 'verificarPermiso:CREAR_GESTION']);

// Actualizar gestión por ID
Route::put('/gestion/{id}', [GestionController::class, 'update'])
    ->middleware(['verificarToken', 'verificarPermiso:MODIFICAR_GESTION']);

// Eliminar gestión por ID
Route::delete('/gestion/{id}', [GestionController::class, 'destroy'])
    ->middleware(['verificarToken', 'verificarPermiso:ELIMINAR_GESTION']);
