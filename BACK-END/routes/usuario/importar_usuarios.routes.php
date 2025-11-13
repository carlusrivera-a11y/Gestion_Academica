<?php

// Importaciones necesarias
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\usuario\ImportarUsuariosController;
use App\Http\Middleware\verificarToken;

// Importar usuarios por lotes (Excel/CSV)
Route::post('/usuarios/importar', [ImportarUsuariosController::class, 'importar'])
    ->middleware(['verificarToken', 'verificarPermiso:IMPORTAR_USUARIOS']);
