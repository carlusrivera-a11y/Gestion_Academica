<?php

namespace App\Http\Controllers\usuario;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use App\Services\BitacoraService;

class UsuarioController extends Controller
{
    // -------------------------------------------------
    // Crear un nuevo usuario (persona + usuario)
    // -------------------------------------------------
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'ci' => 'required|string|max:15',
            'nombre' => 'required|string|max:50',
            'apellido_p' => 'required|string|max:50',
            'apellido_m' => 'nullable|string|max:50',
            'sexo' => 'required|string|in:M,F',
            'estado' => 'required|string|in:SOLTERO,CASADO,DIVORCIADO,VIUDO,OTRO',
            'telefono' => 'nullable|string|max:15',
            'username' => 'required|string|max:50|regex:/^[A-Za-z0-9_\-]+$/',
            'email' => 'required|string|email|max:320|unique:usuario,email',
            'contrasena' => 'required|string|max:250',
            'id_rol' => 'nullable|integer|exists:rol,id'
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()], 400);
        }

        try {
            DB::beginTransaction();

            // Crear persona
            DB::table('persona')->insert([
                'ci' => $request->ci,
                'nombre' => $request->nombre,
                'apellido_p' => $request->apellido_p,
                'apellido_m' => $request->apellido_m,
                'sexo' => $request->sexo,
                'estado' => $request->estado,
                'telefono' => $request->telefono
            ]);

            // Crear usuario
            DB::table('usuario')->insert([
                'username' => $request->username,
                'email' => $request->email,
                'contrasena' => Hash::make($request->contrasena),
                'ci_persona' => $request->ci,
                'id_rol' => $request->id_rol
            ]);

            DB::commit();
            
            // Bitácora
            $bitacoraId = $request->user['bitacoraId'];
            BitacoraService::logEvent($bitacoraId, 'POST', '/usuario', "Se creó un usuario");

            return response()->json(['message' => 'Usuario creado exitosamente'], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Error al crear el usuario', 'details' => $e->getMessage()], 500);
        }
    }

    // -------------------------------------------------
    // Obtener todos los usuarios con sus datos personales
    // -------------------------------------------------
    public function index()
    {
        $usuarios = DB::table('usuario')
            ->join('persona', 'usuario.ci_persona', '=', 'persona.ci')
            ->leftJoin('rol', 'usuario.id_rol', '=', 'rol.id')
            ->select(
                'usuario.id',
                'usuario.username',
                'usuario.email',
                'persona.ci',
                'persona.nombre',
                'persona.apellido_p',
                'persona.apellido_m',
                'persona.sexo',
                'persona.estado',
                'persona.telefono',
                'rol.nombre as rol'
            )
            ->get();

        return response()->json($usuarios);
    }

    // -------------------------------------------------
    // Obtener un usuario por ID
    // -------------------------------------------------
    public function showById($id)
    {
        $usuario = DB::table('usuario')
            ->join('persona', 'usuario.ci_persona', '=', 'persona.ci')
            ->leftJoin('rol', 'usuario.id_rol', '=', 'rol.id')
            ->where('usuario.id', $id)
            ->select(
                'usuario.id',
                'usuario.username',
                'usuario.email',
                'persona.ci',
                'persona.nombre',
                'persona.apellido_p',
                'persona.apellido_m',
                'persona.sexo',
                'persona.estado',
                'persona.telefono',
                'rol.nombre as rol'
            )
            ->first();

        if (!$usuario) {
            return response()->json(['error' => 'Usuario no encontrado'], 404);
        }

        return response()->json($usuario);
    }

    // -------------------------------------------------
    // Obtener un usuario por username
    // -------------------------------------------------
    public function showByUsername($username)
    {
        $usuario = DB::table('usuario')
            ->join('persona', 'usuario.ci_persona', '=', 'persona.ci')
            ->leftJoin('rol', 'usuario.id_rol', '=', 'rol.id')
            ->where('usuario.username', $username)
            ->select(
                'usuario.id',
                'usuario.username',
                'usuario.email',
                'persona.ci',
                'persona.nombre',
                'persona.apellido_p',
                'persona.apellido_m',
                'persona.sexo',
                'persona.estado',
                'persona.telefono',
                'rol.nombre as rol'
            )
            ->first();

        if (!$usuario) {
            return response()->json(['error' => 'Usuario no encontrado'], 404);
        }

        return response()->json($usuario);
    }

    // -------------------------------------------------
    // Actualizar un usuario (y persona asociada)
    // -------------------------------------------------
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'username' => "required|string|max:50|regex:/^[A-Za-z0-9_\-]+$/|unique:usuario,username,{$id},id",
            'email' => "required|string|email|max:320|unique:usuario,email,{$id},id",
            'contrasena' => 'nullable|string|max:250',
            'nombre' => 'required|string|max:50',
            'apellido_p' => 'required|string|max:50',
            'apellido_m' => 'nullable|string|max:50',
            'sexo' => 'required|string|in:M,F',
            'estado' => 'required|string|in:SOLTERO,CASADO,DIVORCIADO,VIUDO,OTRO',
            'telefono' => 'nullable|string|max:15',
            'id_rol' => 'nullable|integer|exists:rol,id'
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()], 400);
        }

        try {
            DB::beginTransaction();

            $usuario = DB::table('usuario')->where('id', $id)->first();
            if (!$usuario) {
                return response()->json(['error' => 'Usuario no encontrado'], 404);
            }

            // Actualizar persona
            DB::table('persona')->where('ci', $usuario->ci_persona)->update([
                'nombre' => $request->nombre,
                'apellido_p' => $request->apellido_p,
                'apellido_m' => $request->apellido_m,
                'sexo' => $request->sexo,
                'estado' => $request->estado,
                'telefono' => $request->telefono
            ]);

            // Actualizar usuario
            DB::table('usuario')->where('id', $id)->update([
                'username' => $request->username,
                'email' => $request->email,
                'id_rol' => $request->id_rol,
                'contrasena' => $request->filled('contrasena')
                    ? Hash::make($request->contrasena)
                    : $usuario->contrasena
            ]);

            DB::commit();

            $bitacoraId = $request->user['bitacoraId'];
            BitacoraService::logEvent($bitacoraId, 'PUT', "/usuario/{$id}", "Se actualizó el usuario con ID {$id}");

            return response()->json(['message' => 'Usuario actualizado correctamente']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Error al actualizar usuario', 'details' => $e->getMessage()], 500);
        }
    }

    // -------------------------------------------------
    // Eliminar un usuario y su persona asociada
    // -------------------------------------------------
    public function destroy($id, Request $request)
    {
        try {
            DB::beginTransaction();

            $usuario = DB::table('usuario')->where('id', $id)->first();
            if (!$usuario) {
                return response()->json(['error' => 'Usuario no encontrado'], 404);
            }

            DB::table('persona')->where('ci', $usuario->ci_persona)->delete();

            DB::commit();

            $bitacoraId = $request->user['bitacoraId'];
            BitacoraService::logEvent($bitacoraId, 'DELETE', "/usuario/{$id}", "Se eliminó el usuario con ID {$id}");

            return response()->json(['message' => 'Usuario eliminado correctamente']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Error al eliminar usuario', 'details' => $e->getMessage()], 500);
        }
    }

    // -------------------------------------------------
    // Asignar un rol a un usuario
    // -------------------------------------------------
    public function assignRole(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'id_rol' => 'required|integer|exists:rol,id'
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()], 400);
        }

        $usuario = DB::table('usuario')->where('id', $id)->first();
        if (!$usuario) {
            return response()->json(['error' => 'Usuario no encontrado'], 404);
        }

        DB::table('usuario')->where('id', $id)->update(['id_rol' => $request->id_rol]);

        $bitacoraId = $request->user['bitacoraId'];
        BitacoraService::logEvent($bitacoraId, 'POST', "/usuario/rol", "Se asigno el rol {$request->id_rol} al usuario con ID {$id}");

        return response()->json(['message' => 'Rol asignado correctamente al usuario']);
    }

    // -------------------------------------------------
    // Eliminar el rol actual del usuario
    // -------------------------------------------------
    public function removeRole(Request $request, $id)
    {
        $usuario = DB::table('usuario')->where('id', $id)->first();
        if (!$usuario) {
            return response()->json(['error' => 'Usuario no encontrado'], 404);
        }

        DB::table('usuario')->where('id', $id)->update(['id_rol' => null]);

        $bitacoraId = $request->user['bitacoraId'];
        BitacoraService::logEvent($bitacoraId, 'DELETE', "/usuario/rol", "Se elimino el rol al usuario con ID {$id}");

        return response()->json(['message' => 'Rol eliminado del usuario correctamente']);
    }
}
