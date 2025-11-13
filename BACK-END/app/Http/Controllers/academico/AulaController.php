<?php

namespace App\Http\Controllers\academico;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use App\Services\BitacoraService;

class AulaController extends Controller
{
    // -------------------------------------------------
    // Crear nueva aula
    // -------------------------------------------------
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nro' => 'required|integer|unique:aula,nro',
            'piso' => 'required|integer|min:0',
            'capacidad' => 'nullable|integer|min:0',
            'descripcion' => 'nullable|string',
            'estado' => 'required|string|in:DISPONIBLE,NO DISPONIBLE',
            'id_tipo' => 'nullable|integer|exists:tipo,id'
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Error de validación', 'errors' => $validator->errors()], 422);
        }

        try {
            DB::table('aula')->insert([
                'nro' => $request->nro,
                'piso' => $request->piso,
                'capacidad' => $request->capacidad,
                'descripcion' => $request->descripcion,
                'estado' => $request->estado,
                'id_tipo' => $request->id_tipo
            ]);

            $bitacoraId = $request->user['bitacoraId'] ?? null;
            if ($bitacoraId) {
                BitacoraService::logEvent($bitacoraId, 'POST', '/aula', "Se creó el aula nro {$request->nro}");
            }

            return response()->json(['message' => 'Aula creada correctamente'], 201);
        } catch (\Exception $e) {
            \Log::error("Error al crear aula: " . $e->getMessage());
            return response()->json(['message' => 'Error interno del servidor al crear aula', 'details' => $e->getMessage()], 500);
        }
    }

    // -------------------------------------------------
    // Obtener todas las aulas
    // -------------------------------------------------
    public function index()
    {
        try {
            $aulas = DB::table('aula')
                ->leftJoin('tipo', 'aula.id_tipo', '=', 'tipo.id')
                ->select('aula.*', 'tipo.nombre as tipo_nombre')
                ->orderBy('nro')
                ->get();

            return response()->json($aulas);
        } catch (\Exception $e) {
            \Log::error("Error al obtener aulas: " . $e->getMessage());
            return response()->json(['message' => 'Error interno del servidor al obtener aulas'], 500);
        }
    }

    // -------------------------------------------------
    // Obtener aula por NRO
    // -------------------------------------------------
    public function showByNro($nro)
    {
        try {
            $aula = DB::table('aula')
                ->leftJoin('tipo', 'aula.id_tipo', '=', 'tipo.id')
                ->select('aula.*', 'tipo.nombre as tipo_nombre')
                ->where('aula.nro', $nro)
                ->first();

            if (!$aula) {
                return response()->json(['message' => 'Aula no encontrada'], 404);
            }

            return response()->json($aula);
        } catch (\Exception $e) {
            \Log::error("Error al obtener aula nro {$nro}: " . $e->getMessage());
            return response()->json(['message' => 'Error interno del servidor al obtener aula'], 500);
        }
    }

    // -------------------------------------------------
    // Actualizar aula por NRO (incluye cambiar número)
    // -------------------------------------------------
    public function update(Request $request, $nro)
    {
        $validator = Validator::make($request->all(), [
            'nro' => "required|integer|unique:aula,nro,{$nro},nro",
            'piso' => 'required|integer|min:0',
            'capacidad' => 'nullable|integer|min:0',
            'descripcion' => 'nullable|string',
            'estado' => 'required|string|in:DISPONIBLE,NO DISPONIBLE',
            'id_tipo' => 'nullable|integer|exists:tipo,id'
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Error de validación', 'errors' => $validator->errors()], 422);
        }

        try {
            $affected = DB::table('aula')->where('nro', $nro)->update([
                'nro' => $request->nro,
                'piso' => $request->piso,
                'capacidad' => $request->capacidad,
                'descripcion' => $request->descripcion,
                'estado' => $request->estado,
                'id_tipo' => $request->id_tipo
            ]);

            if ($affected === 0) {
                return response()->json(['message' => 'Aula no encontrada'], 404);
            }

            $bitacoraId = $request->user['bitacoraId'] ?? null;
            if ($bitacoraId) {
                BitacoraService::logEvent($bitacoraId, 'PUT', "/aula/{$nro}", "Se actualizó aula nro {$nro} a nro {$request->nro}");
            }

            return response()->json(['message' => 'Aula actualizada correctamente']);
        } catch (\Exception $e) {
            \Log::error("Error al actualizar aula nro {$nro}: " . $e->getMessage());
            return response()->json(['message' => 'Error interno del servidor al actualizar aula', 'details' => $e->getMessage()], 500);
        }
    }

    // -------------------------------------------------
    // Eliminar aula por NRO
    // -------------------------------------------------
    public function destroy($nro, Request $request)
    {
        try {
            $deleted = DB::table('aula')->where('nro', $nro)->delete();

            if ($deleted === 0) {
                return response()->json(['message' => 'Aula no encontrada'], 404);
            }

            $bitacoraId = $request->user['bitacoraId'] ?? null;
            if ($bitacoraId) {
                BitacoraService::logEvent($bitacoraId, 'DELETE', "/aula/{$nro}", "Se eliminó aula nro {$nro}");
            }

            return response()->json(['message' => 'Aula eliminada correctamente']);
        } catch (\Exception $e) {
            \Log::error("Error al eliminar aula nro {$nro}: " . $e->getMessage());
            return response()->json(['message' => 'Error interno del servidor al eliminar aula', 'details' => $e->getMessage()], 500);
        }
    }
}
