<?php

namespace App\Http\Controllers\academico;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use App\Services\BitacoraService;
use App\Services\ValidarHorarioService;


class AsignarDocenteController extends Controller
{
    // -------------------------------------------------
    // Crear asociación Docente - Grupo - Materia - Gestión
    // -------------------------------------------------
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id_gestion' => 'required|integer|exists:gestion,id',
            'sigla_materia' => 'required|string|max:10|exists:materia,sigla',
            'sigla_grupo' => 'required|string|max:2|exists:grupo,sigla',
            'ci_docente' => 'nullable|string|max:15|exists:docente,ci'
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Error de validación', 'errors' => $validator->errors()], 422);
        }

        $id_gestion = $request->id_gestion;
        $sigla_materia = $request->sigla_materia;
        $sigla_grupo = $request->sigla_grupo;
        $ci_docente = $request->ci_docente;

        try {
            // Verificar si ya existe la asociación
            $existe = DB::table('grupo_materia_gestion')
                ->where('id_gestion', $id_gestion)
                ->where('sigla_materia', $sigla_materia)
                ->where('sigla_grupo', $sigla_grupo)
                ->exists();

            if ($existe) {
                return response()->json(['message' => 'La asociación ya existe'], 409);
            }

            // Si se proporcionó docente, validar choques de horarios
            if (!empty($ci_docente)) {
                $conflicto = ValidarHorarioService::verificarConflicto(
                    $id_gestion,
                    $sigla_materia,
                    $sigla_grupo,
                    $ci_docente
                );
                if ($conflicto !== null) {
                    // $conflicto contiene detalles del primer conflicto detectado
                    return response()->json([
                        'message' => 'Conflicto de horarios para el docente en la gestión indicada',
                        'conflicto' => $conflicto
                    ], 409);
                }
            }

            DB::table('grupo_materia_gestion')->insert([
                'id_gestion' => $id_gestion,
                'sigla_materia' => $sigla_materia,
                'sigla_grupo' => $sigla_grupo,
                'ci_docente' => $ci_docente
            ]);

            // Bitácora
            $bitacoraId = $request->user['bitacoraId'] ?? null;
            if ($bitacoraId) {
                BitacoraService::logEvent(
                    $bitacoraId,
                    'POST',
                    '/asignar-docente',
                    "Se creó la asociación gestión {$id_gestion} - {$sigla_materia}-{$sigla_grupo} con docente {$ci_docente}"
                );
            }

            return response()->json(['message' => 'Asociación creada correctamente'], 201);
        } catch (\Exception $e) {
            \Log::error("Error al crear asociación docente-grupo-materia: " . $e->getMessage());
            return response()->json(['message' => 'Error interno al crear asociación', 'details' => $e->getMessage()], 500);
        }
    }

    // -------------------------------------------------
    // Obtener todas las asociaciones
    // -------------------------------------------------
    public function index()
    {
        try {
            $asociaciones = DB::table('grupo_materia_gestion')
                ->join('gestion', 'grupo_materia_gestion.id_gestion', '=', 'gestion.id')
                ->join('grupo_materia', function ($join) {
                    $join->on('grupo_materia_gestion.sigla_materia', '=', 'grupo_materia.sigla_materia')
                        ->on('grupo_materia_gestion.sigla_grupo', '=', 'grupo_materia.sigla_grupo');
                })
                ->join('materia', 'grupo_materia.sigla_materia', '=', 'materia.sigla')
                ->join('grupo', 'grupo_materia.sigla_grupo', '=', 'grupo.sigla')
                ->leftJoin('docente', 'grupo_materia_gestion.ci_docente', '=', 'docente.ci')
                ->leftJoin('persona', 'docente.ci', '=', 'persona.ci')
                ->select(
                    'grupo_materia_gestion.id_gestion',
                    'gestion.anio',
                    'gestion.semestre',
                    'materia.sigla as sigla_materia',
                    'materia.nombre as nombre_materia',
                    'grupo.sigla as sigla_grupo',
                    'persona.nombre as nombre_docente',
                    'persona.apellido_p as apellido_p_docente',
                    'persona.apellido_m as apellido_m_docente',
                    'docente.codigo as codigo_docente'
                )
                ->orderBy('gestion.anio', 'desc')
                ->orderBy('gestion.semestre', 'desc')
                ->orderBy('materia.sigla')
                ->orderBy('grupo.sigla')
                ->get();

            return response()->json($asociaciones);
        } catch (\Exception $e) {
            \Log::error("Error al obtener asociaciones docente-grupo-materia: " . $e->getMessage());
            return response()->json(['message' => 'Error interno del servidor al obtener asociaciones'], 500);
        }
    }

    // -------------------------------------------------
    // Obtener asociaciones por materia y grupo
    // -------------------------------------------------
    public function showByGrupoMateria($sigla_materia, $sigla_grupo)
    {
        try {
            $asociaciones = DB::table('grupo_materia_gestion')
                ->join('gestion', 'grupo_materia_gestion.id_gestion', '=', 'gestion.id')
                ->leftJoin('docente', 'grupo_materia_gestion.ci_docente', '=', 'docente.ci')
                ->leftJoin('persona', 'docente.ci', '=', 'persona.ci')
                ->where('grupo_materia_gestion.sigla_materia', $sigla_materia)
                ->where('grupo_materia_gestion.sigla_grupo', $sigla_grupo)
                ->select(
                    'grupo_materia_gestion.*',
                    'gestion.anio',
                    'gestion.semestre',
                    'persona.nombre as nombre_docente',
                    'persona.apellido_p',
                    'persona.apellido_m'
                )
                ->orderBy('gestion.anio', 'desc')
                ->get();

            if ($asociaciones->isEmpty()) {
                return response()->json(['message' => 'No se encontraron asociaciones para la materia y grupo especificados'], 404);
            }

            return response()->json($asociaciones);
        } catch (\Exception $e) {
            \Log::error("Error al obtener asociaciones por grupo-materia: " . $e->getMessage());
            return response()->json(['message' => 'Error interno al obtener asociaciones'], 500);
        }
    }

    // -------------------------------------------------
    // Obtener una asociación específica
    // -------------------------------------------------
    public function show($id_gestion, $sigla_materia, $sigla_grupo)
    {
        try {
            $asociacion = DB::table('grupo_materia_gestion')
                ->leftJoin('docente', 'grupo_materia_gestion.ci_docente', '=', 'docente.ci')
                ->leftJoin('persona', 'docente.ci', '=', 'persona.ci')
                ->join('gestion', 'grupo_materia_gestion.id_gestion', '=', 'gestion.id')
                ->where('grupo_materia_gestion.id_gestion', $id_gestion)
                ->where('grupo_materia_gestion.sigla_materia', $sigla_materia)
                ->where('grupo_materia_gestion.sigla_grupo', $sigla_grupo)
                ->select(
                    'grupo_materia_gestion.*',
                    'gestion.anio',
                    'gestion.semestre',
                    'persona.nombre as nombre_docente',
                    'persona.apellido_p',
                    'persona.apellido_m'
                )
                ->first();

            if (!$asociacion) {
                return response()->json(['message' => 'Asociación no encontrada'], 404);
            }

            return response()->json($asociacion);
        } catch (\Exception $e) {
            \Log::error("Error al obtener asociación específica: " . $e->getMessage());
            return response()->json(['message' => 'Error interno al obtener asociación'], 500);
        }
    }

    // -------------------------------------------------
    // Actualizar docente asociado
    // -------------------------------------------------
    public function update(Request $request, $id_gestion, $sigla_materia, $sigla_grupo)
    {
        $validator = Validator::make($request->all(), [
            'ci_docente' => 'nullable|string|max:15|exists:docente,ci'
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Error de validación', 'errors' => $validator->errors()], 422);
        }

        $ci_docente = $request->ci_docente;

        try {
            // Antes de actualizar, validar choques si se asigna un docente
            if (!empty($ci_docente)) {
                $conflicto = ValidarHorarioService::verificarConflicto(
                    $id_gestion,
                    $sigla_materia,
                    $sigla_grupo,
                    $ci_docente
                );
                if ($conflicto !== null) {
                    return response()->json([
                        'message' => 'Conflicto de horarios para el docente en la gestión indicada',
                        'conflicto' => $conflicto
                    ], 409);
                }
            }

            $updated = DB::table('grupo_materia_gestion')
                ->where('id_gestion', $id_gestion)
                ->where('sigla_materia', $sigla_materia)
                ->where('sigla_grupo', $sigla_grupo)
                ->update(['ci_docente' => $ci_docente]);

            if ($updated === 0) {
                return response()->json(['message' => 'Asociación no encontrada'], 404);
            }

            // Bitácora
            $bitacoraId = $request->user['bitacoraId'] ?? null;
            if ($bitacoraId) {
                BitacoraService::logEvent(
                    $bitacoraId,
                    'PUT',
                    "/asignar-docente/{$id_gestion}/{$sigla_materia}/{$sigla_grupo}",
                    "Se actualizó el docente asociado a {$sigla_materia}-{$sigla_grupo} en gestión {$id_gestion}"
                );
            }

            return response()->json(['message' => 'Docente asignado o actualizado correctamente']);
        } catch (\Exception $e) {
            \Log::error("Error al actualizar docente asociado: " . $e->getMessage());
            return response()->json(['message' => 'Error interno al actualizar docente'], 500);
        }
    }

    // -------------------------------------------------
    // Eliminar asociación
    // -------------------------------------------------
    public function destroy($id_gestion, $sigla_materia, $sigla_grupo, Request $request)
    {
        try {
            $deleted = DB::table('grupo_materia_gestion')
                ->where('id_gestion', $id_gestion)
                ->where('sigla_materia', $sigla_materia)
                ->where('sigla_grupo', $sigla_grupo)
                ->delete();

            if ($deleted === 0) {
                return response()->json(['message' => 'Asociación no encontrada'], 404);
            }

            // Bitácora
            $bitacoraId = $request->user['bitacoraId'] ?? null;
            if ($bitacoraId) {
                BitacoraService::logEvent(
                    $bitacoraId,
                    'DELETE',
                    "/asignar-docente/{$id_gestion}/{$sigla_materia}/{$sigla_grupo}",
                    "Se eliminó la asociación gestión {$id_gestion} - {$sigla_materia}-{$sigla_grupo}"
                );
            }

            return response()->json(['message' => 'Asociación eliminada correctamente']);
        } catch (\Exception $e) {
            \Log::error("Error al eliminar asociación: " . $e->getMessage());
            return response()->json(['message' => 'Error interno al eliminar asociación', 'details' => $e->getMessage()], 500);
        }
    }
}
