<?php

namespace App\Http\Controllers\academico;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use App\Services\BitacoraService;

class AsignarAulaController extends Controller
{
    // -------------------------------------------------
    // Asignar aula y horario a grupo-materia en una gestión
    // -------------------------------------------------
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id_gestion' => 'required|integer|exists:gestion,id',
            'nro_aula' => 'required|integer|exists:aula,nro',
            'sigla_materia' => 'required|string|max:10|exists:materia,sigla',
            'sigla_grupo' => 'required|string|max:2|exists:grupo,sigla',
            'dia' => 'required|string|max:10',
            'hora_inicio' => 'required|date_format:H:i',
            'hora_fin' => 'required|date_format:H:i|after:hora_inicio'
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Error de validación', 'errors' => $validator->errors()], 422);
        }

        DB::beginTransaction();

        try {
            // Buscar si ya existe el horario (DIA, HORA_INICIO, HORA_FIN)
            $horario = DB::table('horario')
                ->where('dia', $request->dia)
                ->where('hora_inicio', $request->hora_inicio)
                ->where('hora_fin', $request->hora_fin)
                ->first();

            if (!$horario) {
                $idHorario = DB::table('horario')->insertGetId([
                    'dia' => $request->dia,
                    'hora_inicio' => $request->hora_inicio,
                    'hora_fin' => $request->hora_fin
                ]);
            } else {
                $idHorario = $horario->id;
            }

            // Verificar si esa aula ya tiene asignado ese horario en esa gestión
            $existe = DB::table('aula_horario_gestion')
                ->where('id_gestion', $request->id_gestion)
                ->where('nro_aula', $request->nro_aula)
                ->where('id_horario', $idHorario)
                ->exists();

            if ($existe) {
                DB::rollBack();
                return response()->json(['message' => 'La asociación ya existe para esta aula, gestión y horario'], 409);
            }

            // Verificar choques de horarios en la misma aula y gestión
            $choque = DB::table('aula_horario_gestion as ahg')
                ->join('horario as h', 'ahg.id_horario', '=', 'h.id')
                ->where('ahg.id_gestion', $request->id_gestion)
                ->where('ahg.nro_aula', $request->nro_aula)
                ->where('h.dia', $request->dia)
                ->where(function ($q) use ($request) {
                    $q->whereBetween('h.hora_inicio', [$request->hora_inicio, $request->hora_fin])
                      ->orWhereBetween('h.hora_fin', [$request->hora_inicio, $request->hora_fin])
                      ->orWhere(function ($q2) use ($request) {
                          $q2->where('h.hora_inicio', '<=', $request->hora_inicio)
                             ->where('h.hora_fin', '>=', $request->hora_fin);
                      });
                })
                ->exists();

            if ($choque) {
                DB::rollBack();
                return response()->json(['message' => 'Conflicto de horario: el aula ya está ocupada en ese rango de tiempo'], 409);
            }

            // Insertar asociación
            DB::table('aula_horario_gestion')->insert([
                'id_gestion' => $request->id_gestion,
                'nro_aula' => $request->nro_aula,
                'id_horario' => $idHorario,
                'sigla_materia' => $request->sigla_materia,
                'sigla_grupo' => $request->sigla_grupo
            ]);

            DB::commit();

            // Bitácora
            $bitacoraId = $request->user['bitacoraId'] ?? null;
            if ($bitacoraId) {
                BitacoraService::logEvent(
                    $bitacoraId,
                    'POST',
                    '/asignar-aula',
                    "Se asignó el aula {$request->nro_aula} a {$request->sigla_materia}-{$request->sigla_grupo} en gestión {$request->id_gestion} ({$request->dia} {$request->hora_inicio}-{$request->hora_fin})"
                );
            }

            return response()->json(['message' => 'Aula y horario asignados correctamente'], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error("Error al asignar aula y horario: " . $e->getMessage());
            return response()->json(['message' => 'Error interno al asignar aula y horario', 'details' => $e->getMessage()], 500);
        }
    }

    // -------------------------------------------------
    // Obtener todas las asociaciones
    // -------------------------------------------------
    public function index()
    {
        try {
            $result = DB::table('aula_horario_gestion as ahg')
                ->join('gestion as g', 'ahg.id_gestion', '=', 'g.id')
                ->join('aula as a', 'ahg.nro_aula', '=', 'a.nro')
                ->join('horario as h', 'ahg.id_horario', '=', 'h.id')
                ->join('materia as m', 'ahg.sigla_materia', '=', 'm.sigla')
                ->join('grupo as gr', 'ahg.sigla_grupo', '=', 'gr.sigla')
                ->select(
                    'ahg.*',
                    'g.anio', 'g.semestre',
                    'a.piso', 'a.capacidad', 'a.estado',
                    'h.dia', 'h.hora_inicio', 'h.hora_fin',
                    'm.nombre as nombre_materia',
                    'gr.sigla as grupo'
                )
                ->orderBy('g.anio', 'desc')
                ->orderBy('g.semestre', 'desc')
                ->get();

            return response()->json($result);
        } catch (\Exception $e) {
            \Log::error("Error al obtener asociaciones aula-horario: " . $e->getMessage());
            return response()->json(['message' => 'Error interno del servidor'], 500);
        }
    }

    // -------------------------------------------------
    // Obtener asociaciones de un grupo-materia específico
    // -------------------------------------------------
    public function showByGrupoMateria($sigla_materia, $sigla_grupo)
    {
        try {
            $result = DB::table('aula_horario_gestion as ahg')
                ->join('horario as h', 'ahg.id_horario', '=', 'h.id')
                ->join('aula as a', 'ahg.nro_aula', '=', 'a.nro')
                ->join('gestion as g', 'ahg.id_gestion', '=', 'g.id')
                ->where('ahg.sigla_materia', $sigla_materia)
                ->where('ahg.sigla_grupo', $sigla_grupo)
                ->select('ahg.*', 'h.dia', 'h.hora_inicio', 'h.hora_fin', 'a.piso', 'a.capacidad', 'g.anio', 'g.semestre')
                ->orderBy('g.anio', 'desc')
                ->get();

            if ($result->isEmpty()) {
                return response()->json(['message' => 'No se encontraron asignaciones para este grupo-materia'], 404);
            }

            return response()->json($result);
        } catch (\Exception $e) {
            \Log::error("Error al obtener asociaciones de grupo-materia: " . $e->getMessage());
            return response()->json(['message' => 'Error interno'], 500);
        }
    }

    // -------------------------------------------------
    // Obtener asociaciones por gestión
    // -------------------------------------------------
    public function showByGestion($id_gestion)
    {
        try {
            $result = DB::table('aula_horario_gestion as ahg')
                ->join('aula as a', 'ahg.nro_aula', '=', 'a.nro')
                ->join('horario as h', 'ahg.id_horario', '=', 'h.id')
                ->join('materia as m', 'ahg.sigla_materia', '=', 'm.sigla')
                ->join('grupo as g', 'ahg.sigla_grupo', '=', 'g.sigla')
                ->where('ahg.id_gestion', $id_gestion)
                ->select('ahg.*', 'a.piso', 'h.dia', 'h.hora_inicio', 'h.hora_fin', 'm.nombre as materia', 'g.sigla as grupo')
                ->get();

            return response()->json($result);
        } catch (\Exception $e) {
            \Log::error("Error al obtener asociaciones por gestión: " . $e->getMessage());
            return response()->json(['message' => 'Error interno'], 500);
        }
    }

    // -------------------------------------------------
    // Obtener asociaciones por aula y gestión
    // -------------------------------------------------
    public function showByAulaGestion($nro_aula, $id_gestion)
    {
        try {
            $result = DB::table('aula_horario_gestion as ahg')
                ->join('horario as h', 'ahg.id_horario', '=', 'h.id')
                ->join('materia as m', 'ahg.sigla_materia', '=', 'm.sigla')
                ->join('grupo as g', 'ahg.sigla_grupo', '=', 'g.sigla')
                ->where('ahg.nro_aula', $nro_aula)
                ->where('ahg.id_gestion', $id_gestion)
                ->select('ahg.*', 'h.dia', 'h.hora_inicio', 'h.hora_fin', 'm.nombre as materia', 'g.sigla as grupo')
                ->get();

            return response()->json($result);
        } catch (\Exception $e) {
            \Log::error("Error al obtener asociaciones por aula y gestión: " . $e->getMessage());
            return response()->json(['message' => 'Error interno'], 500);
        }
    }

    // -------------------------------------------------
    // Eliminar asociación (por día, hora y aula)
    // -------------------------------------------------
    public function destroy($id_gestion, $nro_aula, Request $request)
    {
        $validator = Validator::make($request->all(), [
            'dia' => 'required|string|max:10',
            'hora_inicio' => 'required|date_format:H:i',
            'hora_fin' => 'required|date_format:H:i|after:hora_inicio',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Buscar el horario con los parámetros recibidos
            $horario = DB::table('horario')
                ->where('dia', $request->dia)
                ->where('hora_inicio', $request->hora_inicio)
                ->where('hora_fin', $request->hora_fin)
                ->first();

            if (!$horario) {
                return response()->json([
                    'message' => 'No existe un horario con los parámetros indicados'
                ], 404);
            }

            // Intentar eliminar la asociación correspondiente
            $deleted = DB::table('aula_horario_gestion')
                ->where('id_gestion', $id_gestion)
                ->where('nro_aula', $nro_aula)
                ->where('id_horario', $horario->id)
                ->delete();

            if ($deleted === 0) {
                return response()->json([
                    'message' => 'No se encontró una asociación para eliminar con los datos especificados'
                ], 404);
            }

            // Bitácora
            $bitacoraId = $request->user['bitacoraId'] ?? null;
            if ($bitacoraId) {
                BitacoraService::logEvent(
                    $bitacoraId,
                    'DELETE',
                    "/asignar-aula/{$id_gestion}/{$nro_aula}",
                    "Se eliminó la asociación del aula {$nro_aula} en gestión {$id_gestion}, horario {$request->dia} {$request->hora_inicio}-{$request->hora_fin}"
                );
            }

            return response()->json([
                'message' => 'Asociación eliminada correctamente'
            ], 200);

        } catch (\Exception $e) {
            \Log::error("Error al eliminar asociación aula-horario: " . $e->getMessage());
            return response()->json([
                'message' => 'Error interno al eliminar asociación',
                'details' => $e->getMessage()
            ], 500);
        }
    }

}
