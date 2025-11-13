<?php

// Importaciones necesarias
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\academico\AsignarAulaController;
use App\Http\Middleware\verificarToken;

// Obtener todas las asociaciones
Route::get('/asignar-aula', [AsignarAulaController::class, 'index'])
    ->middleware(['verificarToken', 'verificarPermiso:VER_ASIGNACION_AULA']);

// Obtener asociaciones por grupo-materia
Route::get('/asignar-aula/{sigla_materia}/{sigla_grupo}', [AsignarAulaController::class, 'showByGrupoMateria'])
    ->middleware(['verificarToken', 'verificarPermiso:VER_ASIGNACION_AULA']);

// Obtener asociaciones por gestión
Route::get('/asignar-aula/gestion/{id_gestion}', [AsignarAulaController::class, 'showByGestion'])
    ->middleware(['verificarToken', 'verificarPermiso:VER_ASIGNACION_AULA']);

// Obtener asociaciones por aula y gestión
Route::get('/asignar-aula/{nro_aula}/gestion/{id_gestion}', [AsignarAulaController::class, 'showByAulaGestion'])
    ->middleware(['verificarToken', 'verificarPermiso:VER_ASIGNACION_AULA']);

// Crear asignación aula-horario
Route::post('/asignar-aula', [AsignarAulaController::class, 'store'])
    ->middleware(['verificarToken', 'verificarPermiso:CREAR_ASIGNACION_AULA']);

// Eliminar asignación (por día y hora)
Route::delete('/asignar-aula/{id_gestion}/{nro_aula}', [AsignarAulaController::class, 'destroy'])
    ->middleware(['verificarToken', 'verificarPermiso:ELIMINAR_ASIGNACION_AULA']);
