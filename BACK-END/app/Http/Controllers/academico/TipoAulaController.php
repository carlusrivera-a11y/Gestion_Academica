<?php

namespace App\Http\Controllers\academico;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use App\Services\BitacoraService;

class TipoAulaController extends Controller
{
    // -------------------------------------------------
    // Crear un nuevo tipo de aula
    // -------------------------------------------------
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:50|unique:tipo,nombre'
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Error de validación', 'errors' => $validator->errors()], 422);
        }

        try {
            $id = DB::table('tipo')->insertGetId([
                'nombre' => $request->nombre
            ]);

            $bitacoraId = $request->user['bitacoraId'] ?? null;
            if ($bitacoraId) {
                BitacoraService::logEvent($bitacoraId, 'POST', '/tipo', "Se creó tipo de aula ID {$id} con nombre '{$request->nombre}'");
            }

            return response()->json(['message' => 'Tipo de aula creado correctamente', 'id' => $id], 201);
        } catch (\Exception $e) {
            \Log::error("Error al crear tipo de aula: " . $e->getMessage());
            return response()->json(['message' => 'Error interno del servidor al crear tipo de aula', 'details' => $e->getMessage()], 500);
        }
    }

    // -------------------------------------------------
    // Obtener todos los tipos de aula
    // -------------------------------------------------
    public function index()
    {
        try {
            $tipos = DB::table('tipo')->orderBy('id')->get();
            return response()->json($tipos);
        } catch (\Exception $e) {
            \Log::error("Error al obtener tipos de aula: " . $e->getMessage());
            return response()->json(['message' => 'Error interno del servidor al obtener tipos de aula'], 500);
        }
    }

    // -------------------------------------------------
    // Obtener tipo de aula por ID
    // -------------------------------------------------
    public function showById($id)
    {
        try {
            $tipo = DB::table('tipo')->where('id', $id)->first();
            if (!$tipo) {
                return response()->json(['message' => 'Tipo de aula no encontrado'], 404);
            }
            return response()->json($tipo);
        } catch (\Exception $e) {
            \Log::error("Error al obtener tipo de aula ID {$id}: " . $e->getMessage());
            return response()->json(['message' => 'Error interno del servidor al obtener tipo de aula'], 500);
        }
    }

    // -------------------------------------------------
    // Obtener tipo de aula por nombre
    // -------------------------------------------------
    public function showByNombre($nombre)
    {
        try {
            $tipo = DB::table('tipo')->where('nombre', $nombre)->first();
            if (!$tipo) {
                return response()->json(['message' => 'Tipo de aula no encontrado'], 404);
            }
            return response()->json($tipo);
        } catch (\Exception $e) {
            \Log::error("Error al obtener tipo de aula nombre {$nombre}: " . $e->getMessage());
            return response()->json(['message' => 'Error interno del servidor al obtener tipo de aula'], 500);
        }
    }

    // -------------------------------------------------
    // Actualizar tipo de aula por ID
    // -------------------------------------------------
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => "required|string|max:50|unique:tipo,nombre,{$id},id"
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Error de validación', 'errors' => $validator->errors()], 422);
        }

        try {
            $affected = DB::table('tipo')->where('id', $id)->update([
                'nombre' => $request->nombre
            ]);

            if ($affected === 0) {
                return response()->json(['message' => 'Tipo de aula no encontrado'], 404);
            }

            $bitacoraId = $request->user['bitacoraId'] ?? null;
            if ($bitacoraId) {
                BitacoraService::logEvent($bitacoraId, 'PUT', "/tipo/{$id}", "Se actualizó tipo de aula ID {$id} a nombre '{$request->nombre}'");
            }

            return response()->json(['message' => 'Tipo de aula actualizado correctamente']);
        } catch (\Exception $e) {
            \Log::error("Error al actualizar tipo de aula ID {$id}: " . $e->getMessage());
            return response()->json(['message' => 'Error interno del servidor al actualizar tipo de aula', 'details' => $e->getMessage()], 500);
        }
    }

    // -------------------------------------------------
    // Eliminar tipo de aula por ID
    // -------------------------------------------------
    public function destroy($id, Request $request)
    {
        try {
            $deleted = DB::table('tipo')->where('id', $id)->delete();

            if ($deleted === 0) {
                return response()->json(['message' => 'Tipo de aula no encontrado'], 404);
            }

            $bitacoraId = $request->user['bitacoraId'] ?? null;
            if ($bitacoraId) {
                BitacoraService::logEvent($bitacoraId, 'DELETE', "/tipo/{$id}", "Se eliminó tipo de aula ID {$id}");
            }

            return response()->json(['message' => 'Tipo de aula eliminado correctamente']);
        } catch (\Exception $e) {
            \Log::error("Error al eliminar tipo de aula ID {$id}: " . $e->getMessage());
            return response()->json(['message' => 'Error interno del servidor al eliminar tipo de aula', 'details' => $e->getMessage()], 500);
        }
    }
}
