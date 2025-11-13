<?php

// Importaciones necesarias
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\usuario\PermisoController;
use App\Http\Middleware\verificarToken;

// Ruta para obtener todos los permisos
Route::get('/permiso', [PermisoController::class, 'index'])
    ->middleware(['verificarToken', 'verificarPermiso:VER_PERMISO']); 

// Ruta para obtener un permiso por ID
Route::get('/permiso/{id}', [PermisoController::class, 'showById'])
    ->middleware(['verificarToken', 'verificarPermiso:VER_PERMISO']);

// Ruta para obtener un permiso por su nombre
Route::get('/permiso/nombre/{nombre}', [PermisoController::class, 'showByName'])
    ->middleware(['verificarToken', 'verificarPermiso:VER_PERMISO']);

// Ruta para crear un nuevo permiso
Route::post('/permiso', [PermisoController::class, 'store'])
    ->middleware(['verificarToken', 'verificarPermiso:CREAR_PERMISO']);

// Ruta para actualizar un permiso existente    
Route::put('/permiso/{id}', [PermisoController::Class, 'update'])
    ->middleware(['verificarToken', 'verificarPermiso:MODIFICAR_PERMISO']);

// Ruta para eliminar un permiso    
Route::delete('/permiso/{id}', [PermisoController::Class, 'destroy'])
    ->middleware(['verificarToken', 'verificarPermiso:ELIMINAR_PERMISO']);
