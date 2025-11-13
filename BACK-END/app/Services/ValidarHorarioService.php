<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class ValidarHorarioService
{
    // -----------------------------------------------------------------------------
    // Verifica si un docente tiene conflictos de horario en una gestión determinada.
    // -----------------------------------------------------------------------------
    public static function verificarConflicto($id_gestion, $sigla_materia_obj, $sigla_grupo_obj, $ci_docente)
    {
        // Obtener horarios (día, inicio, fin) del grupo-materia objetivo
        $horarios_obj = DB::table('aula_horario_gestion as ahg')
            ->join('horario as h', 'ahg.id_horario', '=', 'h.id')
            ->where('ahg.id_gestion', $id_gestion)
            ->where('ahg.sigla_materia', $sigla_materia_obj)
            ->where('ahg.sigla_grupo', $sigla_grupo_obj)
            ->select('h.dia', 'h.hora_inicio', 'h.hora_fin')
            ->get();

        // Si el grupo-materia no tiene horarios, no hay conflicto
        if ($horarios_obj->isEmpty()) {
            return null;
        }

        foreach ($horarios_obj as $hobj) {
            $dia = $hobj->dia;
            $inicio = $hobj->hora_inicio;
            $fin = $hobj->hora_fin;

            // Buscar solapamiento con otro grupo-materia del mismo docente
            $conflicto = DB::table('grupo_materia_gestion as gm')
                ->join('aula_horario_gestion as ah', function ($join) {
                    $join->on('gm.id_gestion', '=', 'ah.id_gestion')
                         ->on('gm.sigla_materia', '=', 'ah.sigla_materia')
                         ->on('gm.sigla_grupo', '=', 'ah.sigla_grupo');
                })
                ->join('horario as h2', 'ah.id_horario', '=', 'h2.id')
                ->where('gm.ci_docente', $ci_docente)
                ->where('gm.id_gestion', $id_gestion)
                ->where(function($q) use ($sigla_materia_obj, $sigla_grupo_obj) {
                    $q->where('gm.sigla_materia', '!=', $sigla_materia_obj)
                      ->orWhere('gm.sigla_grupo', '!=', $sigla_grupo_obj);
                })
                ->where('h2.dia', $dia)
                ->whereRaw("NOT (h2.hora_fin <= ? OR h2.hora_inicio >= ?)", [$inicio, $fin])
                ->select(
                    'gm.id_gestion',
                    'gm.sigla_materia',
                    'gm.sigla_grupo',
                    'ah.nro_aula',
                    'h2.id as id_horario',
                    'h2.dia',
                    'h2.hora_inicio',
                    'h2.hora_fin'
                )
                ->first();

            if ($conflicto) {
                return [
                    'docente' => $ci_docente,
                    'conflicto_con' => [
                        'id_gestion' => $conflicto->id_gestion,
                        'sigla_materia' => $conflicto->sigla_materia,
                        'sigla_grupo' => $conflicto->sigla_grupo,
                        'nro_aula' => $conflicto->nro_aula,
                        'horario' => [
                            'id' => $conflicto->id_horario,
                            'dia' => $conflicto->dia,
                            'hora_inicio' => $conflicto->hora_inicio,
                            'hora_fin' => $conflicto->hora_fin
                        ]
                    ],
                    'conflicto_con_horario_del_objetivo' => [
                        'dia' => $dia,
                        'hora_inicio' => $inicio,
                        'hora_fin' => $fin
                    ]
                ];
            }
        }

        return null;
    }
}
