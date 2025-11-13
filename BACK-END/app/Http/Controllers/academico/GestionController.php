<?php

namespace App\Http\Controllers\academico;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use App\Services\BitacoraService;

class GestionController extends Controller
{
    // -------------------------------------------------
    // Crear nueva gestión académica
    // -------------------------------------------------
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'anio' => 'required|integer|min:2000|max:2100',
            'semestre' => 'required|string|in:1,2',
            'fecha_inicio' => 'required|date',
            'fecha_fin' => 'required|date|after:fecha_inicio',
            'estado' => 'required|string|in:ACTIVO,FINALIZADO,PLANIFICADO'
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Error de validación', 'errors' => $validator->errors()], 422);
        }

        try {
            $id = DB::table('gestion')->insertGetId([
                'anio' => $request->anio,
                'semestre' => $request->semestre,
                'fecha_inicio' => $request->fecha_inicio,
                'fecha_fin' => $request->fecha_fin,
                'estado' => $request->estado
            ]);

            // Bitácora
            $bitacoraId = $request->user['bitacoraId'] ?? null;
            if ($bitacoraId) {
                BitacoraService::logEvent($bitacoraId, 'POST', '/gestion', "Se creó la gestión académica ID {$id}");
            }

            return response()->json(['message' => 'Gestión académica creada correctamente', 'id' => $id], 201);
        } catch (\Exception $e) {
            \Log::error("Error al crear gestión académica: " . $e->getMessage());
            return response()->json(['message' => 'Error interno del servidor al crear gestión académica', 'details' => $e->getMessage()], 500);
        }
    }

    // -------------------------------------------------
    // Obtener todas las gestiones académicas
    // -------------------------------------------------
    public function index()
    {
        try {
            $gestiones = DB::table('gestion')->orderBy('anio', 'desc')->orderBy('semestre')->get();
            return response()->json($gestiones);
        } catch (\Exception $e) {
            \Log::error("Error al obtener gestiones académicas: " . $e->getMessage());
            return response()->json(['message' => 'Error interno del servidor al obtener gestiones académicas'], 500);
        }
    }

    // -------------------------------------------------
    // Obtener gestión por ID
    // -------------------------------------------------
    public function showById($id)
    {
        try {
            $gestion = DB::table('gestion')->where('id', $id)->first();
            if (!$gestion) {
                return response()->json(['message' => 'Gestión académica no encontrada'], 404);
            }
            return response()->json($gestion);
        } catch (\Exception $e) {
            \Log::error("Error al obtener gestión académica ID {$id}: " . $e->getMessage());
            return response()->json(['message' => 'Error interno del servidor al obtener gestión académica'], 500);
        }
    }

    // -------------------------------------------------
    // Obtener gestiones por año y semestre
    // -------------------------------------------------
    public function showByAnioSemestre(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'anio' => 'required|integer|min:2000|max:2100',
            'semestre' => 'required|string|in:1,2'
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Error de validación', 'errors' => $validator->errors()], 422);
        }

        try {
            $gestiones = DB::table('gestion')
                ->where('anio', $request->anio)
                ->where('semestre', $request->semestre)
                ->get();

            if ($gestiones->isEmpty()) {
                return response()->json(['message' => 'No se encontro gestion para el año y semestre especificados'], 404);
            }

            return response()->json($gestiones);
        } catch (\Exception $e) {
            \Log::error("Error al obtener gestiones por año {$request->anio} y semestre {$request->semestre}: " . $e->getMessage());
            return response()->json(['message' => 'Error interno del servidor al obtener gestiones', 'details' => $e->getMessage()], 500);
        }
    }

    // -------------------------------------------------
    // Actualizar gestión académica por ID
    // -------------------------------------------------
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'anio' => 'required|integer|min:2000|max:2100',
            'semestre' => 'required|string|in:1,2',
            'fecha_inicio' => 'required|date',
            'fecha_fin' => 'required|date|after:fecha_inicio',
            'estado' => 'required|string|in:ACTIVO,FINALIZADO,PLANIFICADO'
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Error de validación', 'errors' => $validator->errors()], 422);
        }

        try {
            $affected = DB::table('gestion')->where('id', $id)->update([
                'anio' => $request->anio,
                'semestre' => $request->semestre,
                'fecha_inicio' => $request->fecha_inicio,
                'fecha_fin' => $request->fecha_fin,
                'estado' => $request->estado
            ]);

            if ($affected === 0) {
                return response()->json(['message' => 'Gestión académica no encontrada'], 404);
            }

            $bitacoraId = $request->user['bitacoraId'] ?? null;
            if ($bitacoraId) {
                BitacoraService::logEvent($bitacoraId, 'PUT', "/gestion/{$id}", "Se actualizó la gestión académica ID {$id}");
            }

            return response()->json(['message' => 'Gestión académica actualizada correctamente']);
        } catch (\Exception $e) {
            \Log::error("Error al actualizar gestión académica ID {$id}: " . $e->getMessage());
            return response()->json(['message' => 'Error interno del servidor al actualizar gestión académica', 'details' => $e->getMessage()], 500);
        }
    }

    // -------------------------------------------------
    // Eliminar gestión académica por ID
    // -------------------------------------------------
    public function destroy($id, Request $request)
    {
        try {
            $deleted = DB::table('gestion')->where('id', $id)->delete();
            if ($deleted === 0) {
                return response()->json(['message' => 'Gestión académica no encontrada'], 404);
            }

            $bitacoraId = $request->user['bitacoraId'] ?? null;
            if ($bitacoraId) {
                BitacoraService::logEvent($bitacoraId, 'DELETE', "/gestion/{$id}", "Se eliminó la gestión académica ID {$id}");
            }

            return response()->json(['message' => 'Gestión académica eliminada correctamente']);
        } catch (\Exception $e) {
            \Log::error("Error al eliminar gestión académica ID {$id}: " . $e->getMessage());
            return response()->json(['message' => 'Error interno del servidor al eliminar gestión académica', 'details' => $e->getMessage()], 500);
        }
    }
}
