<?php

namespace App\Http\Controllers\usuario;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use App\Services\bitacoraService;

class PermisoController extends Controller
{
    // -------------------------------------------------
    // Obtener todos los permisos
    // -------------------------------------------------
    public function index(Request $request)
    {
        try {
            $data = DB::select("
                SELECT id, nombre
                FROM permiso
                ORDER BY id ASC
            ");

            $bitacoraId = $request->user['bitacoraId'];
            BitacoraService::logEvent($bitacoraId, 'GET', '/permiso', 'Se consultaron todos los permisos');

            return response()->json($data);
        } catch (\Exception $e) {
            \Log::error("Error al obtener permisos: " . $e->getMessage());
            return response()->json(['message' => 'Error interno del servidor al obtener permisos'], 500);
        }
    }

    // -------------------------------------------------
    // Obtener permiso por ID
    // -------------------------------------------------
    public function showById(Request $request, $id)
    {
        try {
            if (!is_numeric($id)) {
                return response()->json(['message' => 'ID inválido'], 400);
            }

            $data = DB::select("
                SELECT id, nombre 
                FROM permiso 
                WHERE id = ?
            ", [$id]);

            if (empty($data)) {
                return response()->json(['message' => 'Permiso no encontrado'], 404);
            }

            $bitacoraId = $request->user['bitacoraId'];
            BitacoraService::logEvent($bitacoraId, 'GET', "/permiso/{$id}", "Se consultó el permiso con ID {$id}");

            return response()->json($data[0]);
        } catch (\Exception $e) {
            \Log::error("Error al obtener permiso por ID {$id}: " . $e->getMessage());
            return response()->json(['message' => 'Error interno del servidor al obtener permiso'], 500);
        }
    }


    // -------------------------------------------------
    // Obtener permiso por nombre
    // -------------------------------------------------
    public function showByName(Request $request, $nombre)
    {
        try {
            if (empty($nombre)) {
                return response()->json(['message' => 'Nombre inválido'], 400);
            }

            $data = DB::select("
                SELECT id, nombre
                FROM permiso
                WHERE LOWER(nombre) = LOWER(?)
            ", [$nombre]);

            if (empty($data)) {
                return response()->json(['message' => 'Permiso no encontrado'], 404);
            }

            $bitacoraId = $request->user['bitacoraId'];
            BitacoraService::logEvent($bitacoraId, 'GET', "/permiso/nombre/{$nombre}", "Se consultó el permiso '{$nombre}'");

            return response()->json($data[0]);
        } catch (\Exception $e) {
            \Log::error("Error al obtener permiso por nombre {$nombre}: " . $e->getMessage());
            return response()->json(['message' => 'Error interno del servidor al obtener permiso'], 500);
        }
    }

    // -------------------------------------------------
    // Crear un nuevo permiso
    // -------------------------------------------------
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'nombre' => [
                    'required',
                    'string',
                    'max:50',
                    'regex:/^[A-Za-z0-9_-]+$/'
                ]
            ], [
                'nombre.required' => 'El nombre del permiso es obligatorio.',
                'nombre.max' => 'El nombre no debe exceder 50 caracteres.',
                'nombre.regex' => 'El nombre solo puede contener letras, números, guiones y guiones bajos.'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Error de validación',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Verificar duplicado
            $existe = DB::select("SELECT 1 FROM permiso WHERE LOWER(nombre) = LOWER(?)", [$request->nombre]);
            if ($existe) {
                return response()->json(['message' => 'El nombre del permiso ya existe'], 422);
            }

            DB::insert("INSERT INTO permiso (nombre) VALUES (?)", [$request->nombre]);

            $bitacoraId = $request->user['bitacoraId'];
            BitacoraService::logEvent($bitacoraId, 'POST', '/permiso', "Se creó un nuevo permiso: {$request->nombre}");

            return response()->json(['message' => 'Permiso creado correctamente'], 201);
        } catch (\Illuminate\Database\QueryException $e) {
            \Log::error("Error de base de datos al crear permiso: " . $e->getMessage());
            return response()->json(['message' => 'Error de base de datos al crear el permiso'], 500);
        } catch (\Exception $e) {
            \Log::error("Error inesperado al crear permiso: " . $e->getMessage());
            return response()->json(['message' => 'Error interno del servidor al crear el permiso'], 500);
        }
    }

    // -------------------------------------------------
    // Actualizar permiso por ID
    // -------------------------------------------------
    public function update(Request $request, $id)
    {
        try {
            if (!is_numeric($id)) {
                return response()->json(['message' => 'ID inválido'], 400);
            }

            $validator = Validator::make($request->all(), [
                'nombre' => [
                    'required',
                    'string',
                    'max:50',
                    'regex:/^[A-Za-z0-9_-]+$/'
                ]
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Error de validación',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Verificar duplicado (excluyendo el actual)
            $existe = DB::select("
                SELECT 1 FROM permiso 
                WHERE LOWER(nombre) = LOWER(?) AND id != ?
            ", [$request->nombre, $id]);

            if ($existe) {
                return response()->json(['message' => 'El nombre del permiso ya existe'], 422);
            }

            $affected = DB::update("
                UPDATE permiso 
                SET nombre = ? 
                WHERE id = ?
            ", [$request->nombre, $id]);

            if ($affected === 0) {
                return response()->json(['message' => 'Permiso no encontrado'], 404);
            }

            $bitacoraId = $request->user['bitacoraId'];
            BitacoraService::logEvent($bitacoraId, 'PUT', "/permiso/{$id}", "Se actualizó el permiso con ID {$id}");

            return response()->json(['message' => 'Permiso actualizado correctamente']);
        } catch (\Illuminate\Database\QueryException $e) {
            \Log::error("Error SQL al actualizar permiso {$id}: " . $e->getMessage());
            return response()->json(['message' => 'Error de base de datos al actualizar el permiso'], 500);
        } catch (\Exception $e) {
            \Log::error("Error inesperado al actualizar permiso {$id}: " . $e->getMessage());
            return response()->json(['message' => 'Error interno del servidor al actualizar el permiso'], 500);
        }
    }

    // -------------------------------------------------
    // Eliminar permiso por ID
    // -------------------------------------------------
    public function destroy(Request $request, $id)
    {
        try {
            if (!is_numeric($id)) {
                return response()->json(['message' => 'ID inválido'], 400);
            }

            $affected = DB::delete("DELETE FROM permiso WHERE id = ?", [$id]);

            if ($affected === 0) {
                return response()->json(['message' => 'Permiso no encontrado'], 404);
            }

            $bitacoraId = $request->user['bitacoraId'];
            BitacoraService::logEvent($bitacoraId, 'DELETE', "/permiso/{$id}", "Se eliminó el permiso con ID {$id}");

            return response()->json(['message' => 'Permiso eliminado correctamente']);
        } catch (\Illuminate\Database\QueryException $e) {
            \Log::error("Error SQL al eliminar permiso {$id}: " . $e->getMessage());

            if (str_contains($e->getMessage(), 'foreign key')) {
                return response()->json([
                    'message' => 'No se puede eliminar el permiso porque está siendo utilizado por roles del sistema'
                ], 422);
            }

            return response()->json(['message' => 'Error de base de datos al eliminar el permiso'], 500);
        } catch (\Exception $e) {
            \Log::error("Error inesperado al eliminar permiso {$id}: " . $e->getMessage());
            return response()->json(['message' => 'Error interno del servidor al eliminar el permiso'], 500);
        }
    }
}