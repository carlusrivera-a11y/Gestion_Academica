<?php

namespace App\Http\Controllers\usuario;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use App\Services\BitacoraService;

class RolController extends Controller
{
    // -------------------------------------------------
    // Crear un nuevo rol
    // -------------------------------------------------
    public function store(Request $request)
    {
        try {
            // Validación de datos
            $validator = Validator::make($request->all(), [
                'nombre' => [
                    'required',
                    'string',
                    'max:50',
                    'regex:/^[A-Za-z0-9_-]+$/'
                ]
            ], [
                'nombre.required' => 'El nombre del rol es obligatorio.',
                'nombre.max' => 'El nombre no debe exceder los 50 caracteres.',
                'nombre.regex' => 'El nombre solo puede contener letras, números, guiones y guiones bajos.'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Error de validación',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Verificar duplicado
            $existe = DB::select("SELECT 1 FROM rol WHERE LOWER(nombre) = LOWER(?)", [$request->nombre]);
            if ($existe) {
                return response()->json(['message' => 'El nombre del rol ya existe'], 422);
            }

            // Insertar y obtener el ID generado
            $rolId = DB::table('rol')->insertGetId([
                'nombre' => $request->nombre
            ]);

            // Bitácora
            $bitacoraId = $request->user['bitacoraId'];
            BitacoraService::logEvent($bitacoraId, 'POST', '/rol', "Se creó el rol '{$request->nombre}'");

            // Retornar el rol completo (incluye el ID)
            return response()->json([
                'id' => $rolId,
                'nombre' => $request->nombre,
                'message' => 'Rol creado correctamente'
            ], 201);
        } catch (\Illuminate\Database\QueryException $e) {
            \Log::error("Error SQL al crear rol: " . $e->getMessage());
            return response()->json(['message' => 'Error de base de datos al crear el rol'], 500);
        } catch (\Exception $e) {
            \Log::error("Error inesperado al crear rol: " . $e->getMessage());
            return response()->json(['message' => 'Error interno del servidor al crear el rol'], 500);
        }
    }

    // -------------------------------------------------
    // Asignar un permiso a un rol
    // -------------------------------------------------
    public function assignPermission(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'id_rol' => 'required|integer',
                'id_permiso' => 'required|integer'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Error de validación',
                    'errors' => $validator->errors()
                ], 422);
            }

            $rol = DB::select("SELECT id FROM rol WHERE id = ?", [$request->id_rol]);
            if (empty($rol)) {
                return response()->json(['message' => 'Rol no encontrado'], 404);
            }

            $permiso = DB::select("SELECT id FROM permiso WHERE id = ?", [$request->id_permiso]);
            if (empty($permiso)) {
                return response()->json(['message' => 'Permiso no encontrado'], 404);
            }

            $asociado = DB::select("
                SELECT 1 FROM rol_permiso 
                WHERE id_rol = ? AND id_permiso = ?
            ", [$request->id_rol, $request->id_permiso]);

            if ($asociado) {
                return response()->json(['message' => 'El permiso ya está asociado a este rol'], 422);
            }

            DB::insert("INSERT INTO rol_permiso (id_rol, id_permiso) VALUES (?, ?)", [
                $request->id_rol,
                $request->id_permiso
            ]);

            $bitacoraId = $request->user['bitacoraId'];
            BitacoraService::logEvent(
                $bitacoraId,
                'POST',
                '/rol/permiso',
                "Se asignó el permiso {$request->id_permiso} al rol {$request->id_rol}"
            );

            return response()->json(['message' => 'Permiso asignado correctamente al rol']);
        } catch (\Illuminate\Database\QueryException $e) {
            \Log::error("Error SQL al asignar permiso a rol: " . $e->getMessage());
            return response()->json(['message' => 'Error de base de datos al asignar el permiso'], 500);
        } catch (\Exception $e) {
            \Log::error("Error inesperado al asignar permiso a rol: " . $e->getMessage());
            return response()->json(['message' => 'Error interno del servidor al asignar permiso'], 500);
        }
    }

    // -------------------------------------------------
    // Obtener todos los roles
    // -------------------------------------------------
    public function index(Request $request)
    {
        try {
            $data = DB::select("SELECT id, nombre FROM rol ORDER BY id ASC");

            $bitacoraId = $request->user['bitacoraId'];
            BitacoraService::logEvent($bitacoraId, 'GET', '/rol', 'Se consultaron todos los roles');

            return response()->json($data);
        } catch (\Exception $e) {
            \Log::error("Error al obtener roles: " . $e->getMessage());
            return response()->json(['message' => 'Error interno del servidor al obtener roles'], 500);
        }
    }

    // -------------------------------------------------
    // Obtener rol por ID
    // -------------------------------------------------
    public function showById(Request $request, $id)
    {
        try {
            if (!is_numeric($id)) {
                return response()->json(['message' => 'ID inválido'], 400);
            }

            $data = DB::select("SELECT id, nombre FROM rol WHERE id = ?", [$id]);
            if (empty($data)) {
                return response()->json(['message' => 'Rol no encontrado'], 404);
            }

            $bitacoraId = $request->user['bitacoraId'];
            BitacoraService::logEvent($bitacoraId, 'GET', "/rol/{$id}", "Se consultó el rol con ID {$id}");

            return response()->json($data[0]);
        } catch (\Exception $e) {
            \Log::error("Error al obtener rol {$id}: " . $e->getMessage());
            return response()->json(['message' => 'Error interno del servidor al obtener rol'], 500);
        }
    }

    // -------------------------------------------------
    // Obtener rol por nombre
    // -------------------------------------------------
    public function showByName(Request $request, $nombre)
    {
        try {
            $data = DB::select("
                SELECT id, nombre FROM rol WHERE LOWER(nombre) = LOWER(?)
            ", [$nombre]);

            if (empty($data)) {
                return response()->json(['message' => 'Rol no encontrado'], 404);
            }

            $bitacoraId = $request->user['bitacoraId'];
            BitacoraService::logEvent($bitacoraId, 'GET', "/rol/nombre/{$nombre}", "Se consultó el rol '{$nombre}'");

            return response()->json($data[0]);
        } catch (\Exception $e) {
            \Log::error("Error al obtener rol por nombre {$nombre}: " . $e->getMessage());
            return response()->json(['message' => 'Error interno del servidor al obtener rol'], 500);
        }
    }

    // -------------------------------------------------
    // Obtener todos los permisos de un rol
    // -------------------------------------------------
    public function getPermisosByRol(Request $request, $idRol)
    {
        try {
            if (!is_numeric($idRol)) {
                return response()->json(['message' => 'ID de rol inválido'], 400);
            }

            $rol = DB::select("SELECT id FROM rol WHERE id = ?", [$idRol]);
            if (empty($rol)) {
                return response()->json(['message' => 'Rol no encontrado'], 404);
            }

            $permisos = DB::select("
                SELECT p.id, p.nombre 
                FROM rol_permiso rp
                JOIN permiso p ON rp.id_permiso = p.id
                WHERE rp.id_rol = ?
                ORDER BY p.id ASC
            ", [$idRol]);

            $bitacoraId = $request->user['bitacoraId'];
            BitacoraService::logEvent($bitacoraId, 'GET', "/rol/{$idRol}/permisos", "Se consultaron los permisos del rol {$idRol}");

            return response()->json($permisos);
        } catch (\Exception $e) {
            \Log::error("Error al obtener permisos del rol {$idRol}: " . $e->getMessage());
            return response()->json(['message' => 'Error interno del servidor al obtener permisos del rol'], 500);
        }
    }

    // -------------------------------------------------
    // Actualizar un rol
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

            $existe = DB::select("
                SELECT 1 FROM rol 
                WHERE LOWER(nombre) = LOWER(?) AND id != ?
            ", [$request->nombre, $id]);

            if ($existe) {
                return response()->json(['message' => 'El nombre del rol ya existe'], 422);
            }

            $affected = DB::update("UPDATE rol SET nombre = ? WHERE id = ?", [$request->nombre, $id]);

            if ($affected === 0) {
                return response()->json(['message' => 'Rol no encontrado'], 404);
            }

            $bitacoraId = $request->user['bitacoraId'];
            BitacoraService::logEvent($bitacoraId, 'PUT', "/rol/{$id}", "Se actualizó el rol con ID {$id}");

            return response()->json(['message' => 'Rol actualizado correctamente']);
        } catch (\Illuminate\Database\QueryException $e) {
            \Log::error("Error SQL al actualizar rol {$id}: " . $e->getMessage());
            return response()->json(['message' => 'Error de base de datos al actualizar el rol'], 500);
        } catch (\Exception $e) {
            \Log::error("Error inesperado al actualizar rol {$id}: " . $e->getMessage());
            return response()->json(['message' => 'Error interno del servidor al actualizar el rol'], 500);
        }
    }

    // -------------------------------------------------
    // Eliminar un rol
    // -------------------------------------------------
    public function destroy(Request $request, $id)
    {
        try {
            if (!is_numeric($id)) {
                return response()->json(['message' => 'ID inválido'], 400);
            }

            $affected = DB::delete("DELETE FROM rol WHERE id = ?", [$id]);

            if ($affected === 0) {
                return response()->json(['message' => 'Rol no encontrado'], 404);
            }

            $bitacoraId = $request->user['bitacoraId'];
            BitacoraService::logEvent($bitacoraId, 'DELETE', "/rol/{$id}", "Se eliminó el rol con ID {$id}");

            return response()->json(['message' => 'Rol eliminado correctamente']);
        } catch (\Illuminate\Database\QueryException $e) {
            \Log::error("Error SQL al eliminar rol {$id}: " . $e->getMessage());
            return response()->json(['message' => 'Error de base de datos al eliminar el rol'], 500);
        } catch (\Exception $e) {
            \Log::error("Error inesperado al eliminar rol {$id}: " . $e->getMessage());
            return response()->json(['message' => 'Error interno del servidor al eliminar el rol'], 500);
        }
    }

    // -------------------------------------------------
    // Eliminar un permiso específico de un rol
    // -------------------------------------------------
    public function removePermission(Request $request, $id_rol, $id_permiso)
    {
        try {
            // Validar que ambos IDs sean numéricos
            if (!is_numeric($id_rol) || !is_numeric($id_permiso)) {
                return response()->json(['message' => 'ID inválido'], 400);
            }

            // Intentar eliminar la relación rol-permiso
            $deleted = DB::delete("
                DELETE FROM rol_permiso 
                WHERE id_rol = ? AND id_permiso = ?
            ", [$id_rol, $id_permiso]);

            if ($deleted === 0) {
                return response()->json(['message' => 'La relación rol-permiso no existe'], 404);
            }

            // Registrar en bitácora
            $bitacoraId = $request->user['bitacoraId'];
            BitacoraService::logEvent(
                $bitacoraId,
                'DELETE',
                "/rol/{$id_rol}/permiso/{$id_permiso}",
                "Se eliminó el permiso {$id_permiso} del rol {$id_rol}"
            );

            return response()->json(['message' => 'Permiso eliminado del rol correctamente']);
        } catch (\Exception $e) {
            \Log::error("Error al eliminar permiso de rol: " . $e->getMessage());
            return response()->json(['message' => 'Error interno del servidor al eliminar permiso del rol'], 500);
        }
    }

}
