<?php

// Importaciones necesarias
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\asistencia\AsistenciaController;
use App\Http\Middleware\verificarToken;

// Obtener mis clases (docente) en gestión activa
Route::get('/asistencia/mis-clases', [AsistenciaController::class, 'misClases'])
    ->middleware(['verificarToken', 'verificarPermiso:VER_ASISTENCIA']);

// Registrar asistencia (docente en sesión)
Route::post('/asistencia', [AsistenciaController::class, 'registrar'])
    ->middleware(['verificarToken', 'verificarPermiso:REGISTRAR_ASISTENCIA']);

// Obtener asistencia del docente autenticado
Route::get('/asistencias/mias', [AsistenciaController::class, 'misAsistencias'])
    ->middleware(['verificarToken', 'verificarPermiso:VER_ASISTENCIA']);

Route::post('/asistencia/qr', [AsistenciaController::class, 'registrarQR']);
