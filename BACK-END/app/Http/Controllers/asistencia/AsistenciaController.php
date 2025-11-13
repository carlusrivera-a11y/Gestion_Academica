<?php

namespace App\Http\Controllers\asistencia;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use App\Services\BitacoraService;
use Carbon\Carbon;

class AsistenciaController extends Controller
{
    // -------------------------------------------------
    // Obtener todas las clases (aula, materia, grupo, horario)
    // del docente en sesión para la GESTIÓN ACTIVA más reciente
    // -------------------------------------------------
    public function misClases(Request $request)
    {
        try {
            $userId = $request->user['id_user'] ?? null;
            if (!$userId) {
                return response()->json(['message' => 'Token no válido'], 401);
            }

            // Obtener CI de la persona asociada al usuario
            $usuario = DB::table('usuario')->where('id', $userId)->first();
            if (!$usuario) {
                return response()->json(['message' => 'Usuario no encontrado'], 404);
            }

            $ci_persona = $usuario->ci_persona ?? null;
            if (!$ci_persona) {
                return response()->json(['message' => 'No hay persona asociada al usuario'], 404);
            }

            // Verificar si es docente
            $docente = DB::table('docente')->where('ci', $ci_persona)->first();
            if (!$docente) {
                return response()->json([]);
            }

            // Obtener la gestión activa más reciente
            $gestionActiva = DB::table('gestion')
                ->where('estado', 'ACTIVO')
                ->orderByDesc('anio')
                ->orderByDesc('semestre')
                ->orderByDesc('fecha_inicio')
                ->first();

            if (!$gestionActiva) {
                return response()->json(['message' => 'No hay gestión activa actualmente'], 404);
            }

            $id_gestion = $gestionActiva->id;

            // Obtener todas las asignaciones (aula_horario_gestion) donde el docente está asignado
            // Relacionamos: grupo_materia_gestion (docente) -> aula_horario_gestion (horarios)
            $clases = DB::table('grupo_materia_gestion as gm')
                ->join('aula_horario_gestion as ahg', function ($join) {
                    $join->on('gm.id_gestion', '=', 'ahg.id_gestion')
                         ->on('gm.sigla_materia', '=', 'ahg.sigla_materia')
                         ->on('gm.sigla_grupo', '=', 'ahg.sigla_grupo');
                })
                ->join('horario as h', 'ahg.id_horario', '=', 'h.id')
                ->join('materia as m', 'ahg.sigla_materia', '=', 'm.sigla')
                ->join('grupo as g', 'ahg.sigla_grupo', '=', 'g.sigla')
                ->leftJoin('aula as a', 'ahg.nro_aula', '=', 'a.nro')
                ->where('gm.ci_docente', $docente->ci)
                ->where('gm.id_gestion', $id_gestion)
                ->select(
                    'ahg.id_gestion',
                    'ahg.nro_aula',
                    'ahg.id_horario',
                    'ahg.sigla_materia',
                    'ahg.sigla_grupo',
                    'm.nombre as nombre_materia',
                    'g.sigla as grupo',
                    'a.piso as aula_piso',
                    'a.capacidad as aula_capacidad',
                    'h.dia',
                    'h.hora_inicio',
                    'h.hora_fin'
                )
                ->orderBy('h.dia')
                ->orderBy('h.hora_inicio')
                ->get();

            return response()->json([
                'gestion' => [
                    'id' => $gestionActiva->id,
                    'anio' => $gestionActiva->anio,
                    'semestre' => $gestionActiva->semestre
                ],
                'clases' => $clases
            ]);
        } catch (\Exception $e) {
            \Log::error("Error en misClases: " . $e->getMessage());
            return response()->json(['message' => 'Error interno del servidor al obtener clases'], 500);
        }
    }

    // -------------------------------------------------
    // Registrar asistencia para la clase (docente en sesión)
    // Se espera recibir: nro_aula, id_horario. id_gestion es opcional (si no viene, se usa la gestión activa)
    // -------------------------------------------------
    public function registrar(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nro_aula' => 'required|integer|exists:aula,nro',
            'id_horario' => 'required|integer|exists:horario,id',
            'id_gestion' => 'nullable|integer|exists:gestion,id',
            'estado' => 'nullable|string|in:PRESENTE,AUSENTE,TARDANZA,JUSTIFICADO'
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Error de validación', 'errors' => $validator->errors()], 422);
        }

        try {
            $userId = $request->user['id_user'] ?? null;
            if (!$userId) {
                return response()->json(['message' => 'Token no válido'], 401);
            }

            // Obtener CI del usuario
            $usuario = DB::table('usuario')->where('id', $userId)->first();
            if (!$usuario) return response()->json(['message' => 'Usuario no encontrado'], 404);
            $ci_persona = $usuario->ci_persona;

            // Verificar que sea docente
            $docente = DB::table('docente')->where('ci', $ci_persona)->first();
            if (!$docente) {
                return response()->json(['message' => 'El usuario no es docente'], 403);
            }

            // Determinar id_gestion: si viene en request usarlo, sino usar gestión activa más reciente
            $id_gestion = $request->id_gestion;
            if (empty($id_gestion)) {
                $gestionActiva = DB::table('gestion')
                    ->where('estado', 'ACTIVO')
                    ->orderByDesc('anio')
                    ->orderByDesc('semestre')
                    ->orderByDesc('fecha_inicio')
                    ->first();

                if (!$gestionActiva) {
                    return response()->json(['message' => 'No hay gestión activa para registrar asistencia'], 404);
                }
                $id_gestion = $gestionActiva->id;
            } else {
                $gestionActiva = DB::table('gestion')->where('id', $id_gestion)->first();
                if (!$gestionActiva) return response()->json(['message' => 'Gestión no encontrada'], 404);
            }

            $nro_aula = $request->nro_aula;
            $id_horario = $request->id_horario;

            // Verificar que exista la asociación aula-horario-gestion y recuperar la materia/grupo
            $ahg = DB::table('aula_horario_gestion')
                ->where('id_gestion', $id_gestion)
                ->where('nro_aula', $nro_aula)
                ->where('id_horario', $id_horario)
                ->first();

            if (!$ahg) {
                return response()->json(['message' => 'No existe una clase asignada para la combinación gestion/aula/horario indicada'], 404);
            }

            // Verificar que el docente en sesión sea el docente asignado a esa asociación (grupo-materia) en grupo_materia_gestion
            $gm = DB::table('grupo_materia_gestion')
                ->where('id_gestion', $id_gestion)
                ->where('sigla_materia', $ahg->sigla_materia)
                ->where('sigla_grupo', $ahg->sigla_grupo)
                ->first();

            if (!$gm) {
                return response()->json(['message' => 'No existe asociación docente para la materia/grupo en la gestión indicada'], 404);
            }

            if ($gm->ci_docente !== $docente->ci) {
                return response()->json(['message' => 'El docente en sesión no está asignado a esta clase'], 403);
            }

            // Verificar que la fecha actual esté dentro del rango de la gestión
            $hoy = Carbon::now()->toDateString();
            if (isset($gestionActiva)) {
                if ($hoy < $gestionActiva->fecha_inicio || $hoy > $gestionActiva->fecha_fin) {
                    return response()->json(['message' => 'La fecha actual está fuera del rango de la gestión'], 409);
                }
            }

            // Obtener horario (hora_inicio/hora_fin)
            $horario = DB::table('horario')->where('id', $id_horario)->first();
            if (!$horario) {
                return response()->json(['message' => 'Horario no encontrado'], 404);
            }

            // Hora del servidor
            $now = Carbon::now(); // timezone según configuración de Laravel/App

            $hora_now = $now->format('H:i:s');
            // Comparaciones con strings TIME funcionan con Carbon
            $horaInicio = Carbon::createFromFormat('H:i:s', $horario->hora_inicio);
            $horaFin = Carbon::createFromFormat('H:i:s', $horario->hora_fin);

            // Verificar que la hora actual esté dentro del intervalo [hora_inicio, hora_fin]
            if (!($now->betweenIncluded($horaInicio, $horaFin))) {
                return response()->json([
                    'message' => 'Fuera del intervalo de la clase. No es posible registrar asistencia fuera del horario de la clase',
                    'hora_actual' => $hora_now,
                    'hora_inicio' => $horario->hora_inicio,
                    'hora_fin' => $horario->hora_fin
                ], 409);
            }

            // Evitar duplicados: verificar si ya registró asistencia el docente hoy para esta asociación
            $ya = DB::table('asistencia')
                ->whereDate('fecha', $now->toDateString())
                ->where('id_gestion', $id_gestion)
                ->where('nro_aula', $nro_aula)
                ->where('id_horario', $id_horario)
                ->first();

            if ($ya) {
                return response()->json(['message' => 'Ya existe un registro de asistencia para esta clase en la fecha de hoy'], 409);
            }

            $estado = $request->estado ?? null;
            if (empty($estado)) {
                $tolerancia = 10;

                // Si el frontend envía una tolerancia puntual (opcional), la usamos
                if ($request->filled('tolerancia_minutos')) {
                    $tolerancia = intval($request->tolerancia_minutos);
                    if ($tolerancia < 0) $tolerancia = 0;
                }

                // Comparamos con la hora de inicio + tolerancia
                $horaInicioConTolerancia = $horaInicio->copy()->addMinutes($tolerancia);

                if ($now->greaterThan($horaInicioConTolerancia)) {
                    $estado = 'TARDANZA';
                } else {
                    $estado = 'PRESENTE';
                }
            }

            // Insertar asistencia
            DB::table('asistencia')->insert([
                'fecha' => $now->toDateString(),
                'hora' => $now->format('H:i:s'),
                'estado' => $estado,
                'id_gestion' => $id_gestion,
                'nro_aula' => $nro_aula,
                'id_horario' => $id_horario
            ]);

            // Bitácora
            $bitacoraId = $request->user['bitacoraId'] ?? null;
            if ($bitacoraId) {
                BitacoraService::logEvent(
                    $bitacoraId,
                    'POST',
                    '/asistencia',
                    "Se registró asistencia del docente {$docente->ci} para gestion {$id_gestion}, aula {$nro_aula}, horario {$id_horario} (estado: {$estado})"
                );
            }

            return response()->json(['message' => 'Asistencia registrada correctamente', 'estado' => $estado], 201);
        } catch (\Exception $e) {
            \Log::error("Error al registrar asistencia: " . $e->getMessage());
            return response()->json(['message' => 'Error interno al registrar asistencia', 'details' => $e->getMessage()], 500);
        }
    }

    // -------------------------------------------------
    // Obtener todas las asistencias del docente actual
    // -------------------------------------------------
    public function misAsistencias(Request $request)
    {
        try {
            // Obtener el usuario autenticado
            $userId = $request->user['id_user'] ?? null;
            if (!$userId) {
                return response()->json(['message' => 'Usuario no autenticado'], 401);
            }

            // Verificar si el usuario está asociado a un docente
            $docente = DB::table('usuario')
                ->join('persona', 'usuario.ci_persona', '=', 'persona.ci')
                ->join('docente', 'persona.ci', '=', 'docente.ci')
                ->where('usuario.id', $userId)
                ->select('docente.ci')
                ->first();

            if (!$docente) {
                return response()->json(['message' => 'El usuario no es un docente'], 403);
            }

            $ciDocente = $docente->ci;

            // Consultar todas las asistencias del docente actual
            $asistencias = DB::table('asistencia')
                ->join('aula_horario_gestion', function ($join) {
                    $join->on('asistencia.id_gestion', '=', 'aula_horario_gestion.id_gestion')
                        ->on('asistencia.nro_aula', '=', 'aula_horario_gestion.nro_aula')
                        ->on('asistencia.id_horario', '=', 'aula_horario_gestion.id_horario');
                })
                ->join('grupo_materia', function ($join) {
                    $join->on('aula_horario_gestion.sigla_materia', '=', 'grupo_materia.sigla_materia')
                        ->on('aula_horario_gestion.sigla_grupo', '=', 'grupo_materia.sigla_grupo');
                })
                ->join('materia', 'grupo_materia.sigla_materia', '=', 'materia.sigla')
                ->join('grupo', 'grupo_materia.sigla_grupo', '=', 'grupo.sigla')
                ->join('gestion', 'asistencia.id_gestion', '=', 'gestion.id')
                ->join('aula', 'asistencia.nro_aula', '=', 'aula.nro')
                ->join('grupo_materia_gestion', function ($join) {
                    $join->on('grupo_materia_gestion.id_gestion', '=', 'asistencia.id_gestion')
                        ->on('grupo_materia_gestion.sigla_materia', '=', 'aula_horario_gestion.sigla_materia')
                        ->on('grupo_materia_gestion.sigla_grupo', '=', 'aula_horario_gestion.sigla_grupo');
                })
                ->where('grupo_materia_gestion.ci_docente', $ciDocente)
                ->select(
                    'gestion.anio',
                    'gestion.semestre',
                    'materia.nombre as materia',
                    'materia.sigla as sigla_materia',
                    'grupo.sigla as grupo',
                    'aula.nro as aula',
                    'asistencia.fecha',
                    'asistencia.hora',
                    'asistencia.estado'
                )
                ->orderByDesc('gestion.anio')
                ->orderByDesc('gestion.semestre')
                ->orderByDesc('asistencia.fecha')
                ->get();

            if ($asistencias->isEmpty()) {
                return response()->json(['message' => 'No se encontraron asistencias registradas'], 404);
            }

            return response()->json(['asistencias' => $asistencias], 200);

        } catch (\Exception $e) {
            \Log::error("Error al obtener asistencias del docente: " . $e->getMessage());
            return response()->json(['message' => 'Error interno al obtener asistencias'], 500);
        }
    }

    public function registrarQR(Request $request)
    {
        // El JSON del QR se envía en el body: {id_gestion, nro_aula, id_horario}
        $data = $request->only(['id_gestion', 'nro_aula', 'id_horario']);

        // Llamas internamente al método registrar usando $request->merge($data)
        $request->merge($data);

        return $this->registrar($request);
    }

}
