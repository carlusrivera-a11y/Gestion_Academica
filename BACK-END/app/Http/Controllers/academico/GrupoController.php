<?php

namespace App\Http\Controllers\academico;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use App\Services\BitacoraService;

class GrupoController extends Controller
{
    // -------------------------------------------------
    // Crear grupo (y asociarlo a materia)
    // -------------------------------------------------
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'sigla_grupo' => 'required|string|max:2',
            'sigla_materia' => 'required|string|max:10|exists:materia,sigla'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            // Verificar si el grupo existe
            $grupo = DB::table('grupo')->where('sigla', $request->sigla_grupo)->first();

            // Si no existe, crearlo
            if (!$grupo) {
                DB::table('grupo')->insert(['sigla' => $request->sigla_grupo]);
            }

            // Verificar si la asociación ya existe
            $existeAsociacion = DB::table('grupo_materia')
                ->where('sigla_materia', $request->sigla_materia)
                ->where('sigla_grupo', $request->sigla_grupo)
                ->exists();

            if ($existeAsociacion) {
                DB::rollBack();
                return response()->json(['message' => 'La asociación materia-grupo ya existe'], 409);
            }

            // Crear asociación
            DB::table('grupo_materia')->insert([
                'sigla_materia' => $request->sigla_materia,
                'sigla_grupo' => $request->sigla_grupo
            ]);

            DB::commit();

            // Registrar bitácora
            $bitacoraId = $request->user['bitacoraId'] ?? null;
            if ($bitacoraId) {
                BitacoraService::logEvent(
                    $bitacoraId,
                    'POST',
                    '/grupo',
                    "Se creó o asoció el grupo {$request->sigla_grupo} con la materia {$request->sigla_materia}"
                );
            }

            return response()->json(['message' => 'Grupo creado o asociado correctamente'], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error("Error al crear o asociar grupo: " . $e->getMessage());
            return response()->json([
                'message' => 'Error interno del servidor al crear grupo',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    // -------------------------------------------------
    // Obtener todos los grupos con sus materias asociadas
    // -------------------------------------------------
    public function index()
    {
        try {
            $grupos = DB::table('grupo_materia')
                ->join('grupo', 'grupo_materia.sigla_grupo', '=', 'grupo.sigla')
                ->join('materia', 'grupo_materia.sigla_materia', '=', 'materia.sigla')
                ->select(
                    'grupo.sigla as sigla_grupo',
                    'materia.sigla as sigla_materia',
                    'materia.nombre as nombre_materia',
                    'materia.creditos'
                )
                ->orderBy('materia.sigla')
                ->orderBy('grupo.sigla')
                ->get();

            return response()->json($grupos);
        } catch (\Exception $e) {
            \Log::error("Error al obtener grupos: " . $e->getMessage());
            return response()->json(['message' => 'Error interno del servidor al obtener grupos'], 500);
        }
    }

    // -------------------------------------------------
    // Obtener grupo-materia por siglas
    // -------------------------------------------------
    public function show($sigla_materia, $sigla_grupo)
    {
        try {
            $grupoMateria = DB::table('grupo_materia')
                ->join('materia', 'grupo_materia.sigla_materia', '=', 'materia.sigla')
                ->join('grupo', 'grupo_materia.sigla_grupo', '=', 'grupo.sigla')
                ->where('grupo_materia.sigla_materia', $sigla_materia)
                ->where('grupo_materia.sigla_grupo', $sigla_grupo)
                ->select(
                    'grupo.sigla as sigla_grupo',
                    'materia.sigla as sigla_materia',
                    'materia.nombre as nombre_materia',
                    'materia.descripcion',
                    'materia.creditos'
                )
                ->first();

            if (!$grupoMateria) {
                return response()->json(['message' => 'Asociación materia-grupo no encontrada'], 404);
            }

            return response()->json($grupoMateria);
        } catch (\Exception $e) {
            \Log::error("Error al obtener grupo-materia: " . $e->getMessage());
            return response()->json(['message' => 'Error interno del servidor al obtener grupo-materia'], 500);
        }
    }

    // -------------------------------------------------
    // Eliminar asociación (y grupo si queda sin relaciones)
    // -------------------------------------------------
    public function destroy($sigla_materia, $sigla_grupo, Request $request)
    {
        try {
            DB::beginTransaction();

            // Eliminar la asociación materia-grupo
            $deleted = DB::table('grupo_materia')
                ->where('sigla_materia', $sigla_materia)
                ->where('sigla_grupo', $sigla_grupo)
                ->delete();

            if ($deleted === 0) {
                DB::rollBack();
                return response()->json(['message' => 'Asociación materia-grupo no encontrada'], 404);
            }

            // Verificar si el grupo quedó sin asociaciones
            $quedanAsociaciones = DB::table('grupo_materia')
                ->where('sigla_grupo', $sigla_grupo)
                ->exists();

            if (!$quedanAsociaciones) {
                DB::table('grupo')->where('sigla', $sigla_grupo)->delete();
            }

            DB::commit();

            // Bitácora
            $bitacoraId = $request->user['bitacoraId'] ?? null;
            if ($bitacoraId) {
                BitacoraService::logEvent(
                    $bitacoraId,
                    'DELETE',
                    "/grupo/{$sigla_materia}/{$sigla_grupo}",
                    "Se eliminó la asociación materia-grupo {$sigla_materia}-{$sigla_grupo}"
                );
            }

            return response()->json(['message' => 'Asociación eliminada correctamente']);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error("Error al eliminar grupo-materia: " . $e->getMessage());
            return response()->json(['message' => 'Error interno del servidor al eliminar grupo-materia', 'details' => $e->getMessage()], 500);
        }
    }
}
