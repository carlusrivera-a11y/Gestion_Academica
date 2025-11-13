<?php

// Importaciones necesarias
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\academico\AsignarDocenteController;
use App\Http\Middleware\verificarToken;

// Obtener todas las asociaciones
Route::get('/asignar-docente', [AsignarDocenteController::class, 'index'])
    ->middleware(['verificarToken', 'verificarPermiso:VER_ASIGNACION_DOCENTE']);

// Obtener asociaciones por materia y grupo
Route::get('/asignar-docente/{sigla_materia}/{sigla_grupo}', [AsignarDocenteController::class, 'showByGrupoMateria'])
    ->middleware(['verificarToken', 'verificarPermiso:VER_ASIGNACION_DOCENTE']);

// Obtener una asociación específica
Route::get('/asignar-docente/{id_gestion}/{sigla_materia}/{sigla_grupo}', [AsignarDocenteController::class, 'show'])
    ->middleware(['verificarToken', 'verificarPermiso:VER_ASIGNACION_DOCENTE']);

// Crear nueva asociación
Route::post('/asignar-docente', [AsignarDocenteController::class, 'store'])
    ->middleware(['verificarToken', 'verificarPermiso:CREAR_ASIGNACION_DOCENTE']);

// Actualizar docente asociado
Route::put('/asignar-docente/{id_gestion}/{sigla_materia}/{sigla_grupo}', [AsignarDocenteController::class, 'update'])
    ->middleware(['verificarToken', 'verificarPermiso:MODIFICAR_ASIGNACION_DOCENTE']);

// Eliminar asociación
Route::delete('/asignar-docente/{id_gestion}/{sigla_materia}/{sigla_grupo}', [AsignarDocenteController::class, 'destroy'])
    ->middleware(['verificarToken', 'verificarPermiso:ELIMINAR_ASIGNACION_DOCENTE']);
