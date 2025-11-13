<?php

// Importaciones necesarias
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\academico\GrupoController;
use App\Http\Middleware\verificarToken;

// Obtener todos los grupos con materias asociadas
Route::get('/grupo', [GrupoController::class, 'index'])
    ->middleware(['verificarToken', 'verificarPermiso:VER_GRUPO']);

// Obtener grupo-materia por sus siglas
Route::get('/grupo/{sigla_materia}/{sigla_grupo}', [GrupoController::class, 'show'])
    ->middleware(['verificarToken', 'verificarPermiso:VER_GRUPO']);

// Crear grupo y asociarlo a materia
Route::post('/grupo', [GrupoController::class, 'store'])
    ->middleware(['verificarToken', 'verificarPermiso:CREAR_GRUPO']);

// Eliminar asociación materia-grupo (y grupo si queda vacío)
Route::delete('/grupo/{sigla_materia}/{sigla_grupo}', [GrupoController::class, 'destroy'])
    ->middleware(['verificarToken', 'verificarPermiso:ELIMINAR_GRUPO']);
