<?php

// Importaciones necesarias
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\usuario\UsuarioController;
use App\Http\Middleware\verificarToken;

// Obtener todos los usuarios
Route::get('/usuario', [UsuarioController::class, 'index'])
    ->middleware(['verificarToken', 'verificarPermiso:VER_USUARIO']);

// Obtener usuario por ID
Route::get('/usuario/{id}', [UsuarioController::class, 'showById'])
    ->middleware(['verificarToken', 'verificarPermiso:VER_USUARIO']);

// Obtener usuario por USERNAME
Route::get('/usuario/username/{username}', [UsuarioController::class, 'showByUsername'])
    ->middleware(['verificarToken', 'verificarPermiso:VER_USUARIO']);

// Crear un nuevo usuario (persona + usuario)
Route::post('/usuario', [UsuarioController::class, 'store'])
    ->middleware(['verificarToken', 'verificarPermiso:CREAR_USUARIO']);

// Actualizar un usuario existente
Route::put('/usuario/{id}', [UsuarioController::class, 'update'])
    ->middleware(['verificarToken', 'verificarPermiso:MODIFICAR_USUARIO']);

// Eliminar un usuario (junto con su persona asociada)
Route::delete('/usuario/{id}', [UsuarioController::class, 'destroy'])
    ->middleware(['verificarToken', 'verificarPermiso:ELIMINAR_USUARIO']);

// Asignar un rol a un usuario
Route::post('/usuario/rol/{id}', [UsuarioController::class, 'assignRole'])
    ->middleware(['verificarToken', 'verificarPermiso:MODIFICAR_USUARIO']);

// Eliminar el rol asignado a un usuario
Route::delete('/usuario/rol/{id}', [UsuarioController::class, 'removeRole'])
    ->middleware(['verificarToken', 'verificarPermiso:MODIFICAR_USUARIO']);
