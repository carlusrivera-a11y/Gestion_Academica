<?php

// Importaciones necesarias
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\academico\MateriaController;
use App\Http\Middleware\verificarToken;

// Obtener todas las materias
Route::get('/materia', [MateriaController::class, 'index'])
    ->middleware(['verificarToken', 'verificarPermiso:VER_MATERIA']);

// Obtener materia por sigla
Route::get('/materia/sigla/{sigla}', [MateriaController::class, 'showBySigla'])
    ->middleware(['verificarToken', 'verificarPermiso:VER_MATERIA']);

// Obtener materia por nombre
Route::get('/materia/nombre/{nombre}', [MateriaController::class, 'showByNombre'])
    ->middleware(['verificarToken', 'verificarPermiso:VER_MATERIA']);

// Crear nueva materia
Route::post('/materia', [MateriaController::class, 'store'])
    ->middleware(['verificarToken', 'verificarPermiso:CREAR_MATERIA']);

// Actualizar materia por sigla
Route::put('/materia/{sigla}', [MateriaController::class, 'update'])
    ->middleware(['verificarToken', 'verificarPermiso:MODIFICAR_MATERIA']);

// Eliminar materia por sigla
Route::delete('/materia/{sigla}', [MateriaController::class, 'destroy'])
    ->middleware(['verificarToken', 'verificarPermiso:ELIMINAR_MATERIA']);
