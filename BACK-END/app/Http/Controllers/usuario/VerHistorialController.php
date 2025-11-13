<?php

namespace App\Http\Controllers\usuario;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VerHistorialController extends Controller
{
    // -------------------------------------------------
    // Obtener todas las bitácoras (solo cabecera, sin detalle)
    // -------------------------------------------------
    public function index()
    {
        try {
            $bitacoras = DB::table('bitacora')
                ->join('usuario', 'bitacora.id_usuario', '=', 'usuario.id')
                ->select(
                    'bitacora.id',
                    'bitacora.id_usuario',
                    'usuario.username',
                    'bitacora.ip',
                    'bitacora.fecha_inicio',
                    'bitacora.fecha_fin',
                    'bitacora.hora_inicio',
                    'bitacora.hora_fin'
                )
                ->orderBy('bitacora.id', 'desc')
                ->get();

            return response()->json($bitacoras);
        } catch (\Exception $e) {
            \Log::error("Error al obtener bitácoras: " . $e->getMessage());
            return response()->json(['message' => 'Error interno del servidor al obtener bitácoras'], 500);
        }
    }

    // -------------------------------------------------
    // Obtener bitácora por ID (solo cabecera)
    // -------------------------------------------------
    public function showById($id)
    {
        try {
            if (!is_numeric($id)) {
                return response()->json(['message' => 'ID inválido'], 400);
            }

            $bitacora = DB::table('bitacora')
                ->join('usuario', 'bitacora.id_usuario', '=', 'usuario.id')
                ->select(
                    'bitacora.id',
                    'bitacora.id_usuario',
                    'usuario.username',
                    'bitacora.ip',
                    'bitacora.fecha_inicio',
                    'bitacora.fecha_fin',
                    'bitacora.hora_inicio',
                    'bitacora.hora_fin'
                )
                ->where('bitacora.id', $id)
                ->first();

            if (!$bitacora) {
                return response()->json(['message' => 'Bitácora no encontrada'], 404);
            }

            return response()->json($bitacora);
        } catch (\Exception $e) {
            \Log::error("Error al obtener bitácora {$id}: " . $e->getMessage());
            return response()->json(['message' => 'Error interno del servidor al obtener la bitácora'], 500);
        }
    }

    // -------------------------------------------------
    // Obtener bitácoras por ID de usuario
    // -------------------------------------------------
    public function showByUserId($id_usuario)
    {
        try {
            if (!is_numeric($id_usuario)) {
                return response()->json(['message' => 'ID de usuario inválido'], 400);
            }

            $bitacoras = DB::table('bitacora')
                ->join('usuario', 'bitacora.id_usuario', '=', 'usuario.id')
                ->select(
                    'bitacora.id',
                    'bitacora.id_usuario',
                    'usuario.username',
                    'bitacora.ip',
                    'bitacora.fecha_inicio',
                    'bitacora.fecha_fin',
                    'bitacora.hora_inicio',
                    'bitacora.hora_fin'
                )
                ->where('bitacora.id_usuario', $id_usuario)
                ->orderBy('bitacora.id', 'desc')
                ->get();

            return response()->json($bitacoras);
        } catch (\Exception $e) {
            \Log::error("Error al obtener bitácoras del usuario {$id_usuario}: " . $e->getMessage());
            return response()->json(['message' => 'Error interno del servidor al obtener bitácoras del usuario'], 500);
        }
    }

    // -------------------------------------------------
    // Obtener todos los detalles de una bitácora por ID de bitácora
    // -------------------------------------------------
    public function getDetallesByBitacoraId($id_bitacora)
    {
        try {
            if (!is_numeric($id_bitacora)) {
                return response()->json(['message' => 'ID de bitácora inválido'], 400);
            }

            $detalles = DB::table('detalle_bitacora')
                ->where('id_bitacora', $id_bitacora)
                ->orderBy('id', 'asc')
                ->get();

            if ($detalles->isEmpty()) {
                return response()->json(['message' => 'No se encontraron detalles para esta bitácora'], 404);
            }

            return response()->json($detalles);
        } catch (\Exception $e) {
            \Log::error("Error al obtener detalles de bitácora {$id_bitacora}: " . $e->getMessage());
            return response()->json(['message' => 'Error interno del servidor al obtener detalles de bitácora'], 500);
        }
    }

    // -------------------------------------------------
    // Obtener detalle de bitácora por ID de detalle y ID de bitácora
    // -------------------------------------------------
    public function getDetalleById($id_bitacora, $id_detalle)
    {
        try {
            if (!is_numeric($id_bitacora) || !is_numeric($id_detalle)) {
                return response()->json(['message' => 'ID inválido'], 400);
            }

            $detalle = DB::table('detalle_bitacora')
                ->where('id_bitacora', $id_bitacora)
                ->where('id', $id_detalle)
                ->first();

            if (!$detalle) {
                return response()->json(['message' => 'Detalle de bitácora no encontrado'], 404);
            }

            return response()->json($detalle);
        } catch (\Exception $e) {
            \Log::error("Error al obtener detalle {$id_detalle} de bitácora {$id_bitacora}: " . $e->getMessage());
            return response()->json(['message' => 'Error interno del servidor al obtener detalle de bitácora'], 500);
        }
    }
}
