<?php

namespace App\Http\Controllers\academico;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use App\Services\BitacoraService;

class MateriaController extends Controller
{
    // -------------------------------------------------
    // Crear nueva materia
    // -------------------------------------------------
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'sigla' => 'required|string|max:10|unique:materia,sigla',
            'nombre' => 'required|string|max:255|unique:materia,nombre',
            'descripcion' => 'nullable|string',
            'creditos' => 'required|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Error de validación', 'errors' => $validator->errors()], 422);
        }

        try {
            DB::table('materia')->insert([
                'sigla' => $request->sigla,
                'nombre' => $request->nombre,
                'descripcion' => $request->descripcion,
                'creditos' => $request->creditos
            ]);

            // Bitácora
            $bitacoraId = $request->user['bitacoraId'] ?? null;
            if ($bitacoraId) {
                BitacoraService::logEvent($bitacoraId, 'POST', '/materia', "Se creó la materia '{$request->nombre}' con sigla '{$request->sigla}'");
            }

            return response()->json(['message' => 'Materia creada correctamente'], 201);
        } catch (\Exception $e) {
            \Log::error("Error al crear materia: " . $e->getMessage());
            return response()->json(['message' => 'Error interno del servidor al crear materia', 'details' => $e->getMessage()], 500);
        }
    }

    // -------------------------------------------------
    // Obtener todas las materias
    // -------------------------------------------------
    public function index()
    {
        try {
            $materias = DB::table('materia')->orderBy('sigla')->get();
            return response()->json($materias);
        } catch (\Exception $e) {
            \Log::error("Error al obtener materias: " . $e->getMessage());
            return response()->json(['message' => 'Error interno del servidor al obtener materias'], 500);
        }
    }

    // -------------------------------------------------
    // Obtener materia por sigla
    // -------------------------------------------------
    public function showBySigla($sigla)
    {
        try {
            $materia = DB::table('materia')->where('sigla', $sigla)->first();

            if (!$materia) {
                return response()->json(['message' => 'Materia no encontrada'], 404);
            }

            return response()->json($materia);
        } catch (\Exception $e) {
            \Log::error("Error al obtener materia por sigla {$sigla}: " . $e->getMessage());
            return response()->json(['message' => 'Error interno del servidor al obtener materia'], 500);
        }
    }

    // -------------------------------------------------
    // Obtener materia por nombre
    // -------------------------------------------------
    public function showByNombre($nombre)
    {
        try {
            $materia = DB::table('materia')->where('nombre', $nombre)->first();

            if (!$materia) {
                return response()->json(['message' => 'Materia no encontrada'], 404);
            }

            return response()->json($materia);
        } catch (\Exception $e) {
            \Log::error("Error al obtener materia por nombre {$nombre}: " . $e->getMessage());
            return response()->json(['message' => 'Error interno del servidor al obtener materia'], 500);
        }
    }

    // -------------------------------------------------
    // Actualizar materia por sigla
    // -------------------------------------------------
    public function update(Request $request, $sigla)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => "required|string|max:255|unique:materia,nombre,{$sigla},sigla",
            'descripcion' => 'nullable|string',
            'creditos' => 'required|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Error de validación', 'errors' => $validator->errors()], 422);
        }

        try {
            $affected = DB::table('materia')->where('sigla', $sigla)->update([
                'nombre' => $request->nombre,
                'descripcion' => $request->descripcion,
                'creditos' => $request->creditos
            ]);

            if ($affected === 0) {
                return response()->json(['message' => 'Materia no encontrada'], 404);
            }

            $bitacoraId = $request->user['bitacoraId'] ?? null;
            if ($bitacoraId) {
                BitacoraService::logEvent($bitacoraId, 'PUT', "/materia/{$sigla}", "Se actualizó la materia '{$request->nombre}' con sigla '{$sigla}'");
            }

            return response()->json(['message' => 'Materia actualizada correctamente']);
        } catch (\Exception $e) {
            \Log::error("Error al actualizar materia {$sigla}: " . $e->getMessage());
            return response()->json(['message' => 'Error interno del servidor al actualizar materia', 'details' => $e->getMessage()], 500);
        }
    }

    // -------------------------------------------------
    // Eliminar materia por sigla
    // -------------------------------------------------
    public function destroy($sigla, Request $request)
    {
        try {
            $deleted = DB::table('materia')->where('sigla', $sigla)->delete();

            if ($deleted === 0) {
                return response()->json(['message' => 'Materia no encontrada'], 404);
            }

            $bitacoraId = $request->user['bitacoraId'] ?? null;
            if ($bitacoraId) {
                BitacoraService::logEvent($bitacoraId, 'DELETE', "/materia/{$sigla}", "Se eliminó la materia con sigla '{$sigla}'");
            }

            return response()->json(['message' => 'Materia eliminada correctamente']);
        } catch (\Exception $e) {
            \Log::error("Error al eliminar materia {$sigla}: " . $e->getMessage());
            return response()->json(['message' => 'Error interno del servidor al eliminar materia', 'details' => $e->getMessage()], 500);
        }
    }
}
