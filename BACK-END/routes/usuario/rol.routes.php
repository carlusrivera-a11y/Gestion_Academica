<?php

// Importaciones necesarias
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\usuario\RolController;
use App\Http\Middleware\verificarToken;

// Obtener todos los roles
Route::get('/rol', [RolController::class, 'index'])
    ->middleware(['verificarToken', 'verificarPermiso:VER_ROL']);

// Obtener rol por ID
Route::get('/rol/{id}', [RolController::class, 'showById'])
    ->middleware(['verificarToken', 'verificarPermiso:VER_ROL']);

// Obtener rol por nombre
Route::get('/rol/nombre/{nombre}', [RolController::class, 'showByName'])
    ->middleware(['verificarToken', 'verificarPermiso:VER_ROL']);

// Crear un nuevo rol
Route::post('/rol', [RolController::class, 'store'])
    ->middleware(['verificarToken', 'verificarPermiso:CREAR_ROL']);

// Actualizar un rol existente
Route::put('/rol/{id}', [RolController::class, 'update'])
    ->middleware(['verificarToken', 'verificarPermiso:MODIFICAR_ROL']);

// Eliminar un rol
Route::delete('/rol/{id}', [RolController::class, 'destroy'])
    ->middleware(['verificarToken', 'verificarPermiso:ELIMINAR_ROL']);

// Asignar un permiso a un rol
Route::post('/rol/permiso', [RolController::class, 'assignPermission'])
    ->middleware(['verificarToken', 'verificarPermiso:CREAR_ROL_PERMISO']);

// Obtener todos los permisos asociados a un rol
Route::get('/rol/{id}/permisos', [RolController::class, 'getPermisosByRol'])
    ->middleware(['verificarToken', 'verificarPermiso:VER_ROL_PERMISO']);

// Eliminar un permiso específico de un rol
Route::delete('/rol/{id_rol}/permiso/{id_permiso}', [RolController::class, 'removePermission'])
    ->middleware(['verificarToken', 'verificarPermiso:ELIMINAR_ROL_PERMISO']);
