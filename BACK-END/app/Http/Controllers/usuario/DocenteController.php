<?php

namespace App\Http\Controllers\usuario;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use App\Services\BitacoraService;

class DocenteController extends Controller
{
    // -------------------------------------------------
    // Crear un docente desde cero (persona + usuario + docente)
    // -------------------------------------------------
    public function storeFromScratch(Request $request)
    {
        $validator = Validator::make($request->all(), [
            // Persona
            'ci' => 'required|string|max:15',
            'nombre' => 'required|string|max:50',
            'apellido_p' => 'required|string|max:50',
            'apellido_m' => 'nullable|string|max:50',
            'sexo' => 'required|string|in:M,F',
            'estado' => 'required|string|in:SOLTERO,CASADO,DIVORCIADO,VIUDO,OTRO',
            'telefono' => 'nullable|string|max:15',
            // Usuario
            'username' => 'required|string|max:50|regex:/^[A-Za-z0-9_\-]+$/|unique:usuario,username',
            'email' => 'required|string|email|max:320|unique:usuario,email',
            'contrasena' => 'required|string|min:8|max:250',
            'id_rol' => 'nullable|integer|exists:rol,id',
            // Docente
            'codigo' => 'required|string|max:20|unique:docente,codigo'
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Error de validación', 'errors' => $validator->errors()], 422);
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

            // Crear docente
            DB::table('docente')->insert([
                'ci' => $request->ci,
                'codigo' => $request->codigo
            ]);

            DB::commit();

            // Bitácora
            $bitacoraId = $request->user['bitacoraId'];
            BitacoraService::logEvent($bitacoraId, 'POST', '/docente/storeFromScratch', "Se creó un docente desde cero con CI {$request->ci} y código {$request->codigo}");

            return response()->json(['message' => 'Docente creado exitosamente'], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error("Error al crear docente desde cero: " . $e->getMessage());
            return response()->json(['message' => 'Error interno del servidor al crear docente', 'details' => $e->getMessage()], 500);
        }
    }

    // -------------------------------------------------
    // Hacer docente a un usuario existente
    // -------------------------------------------------
    public function assignToExistingUser(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id_usuario' => 'required|integer|exists:usuario,id',
            'codigo' => 'required|string|max:20|unique:docente,codigo'
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Error de validación', 'errors' => $validator->errors()], 422);
        }

        try {
            $usuario = DB::table('usuario')->where('id', $request->id_usuario)->first();
            if (!$usuario) {
                return response()->json(['message' => 'Usuario no encontrado'], 404);
            }

            DB::table('docente')->insert([
                'ci' => $usuario->ci_persona,
                'codigo' => $request->codigo
            ]);

            $bitacoraId = $request->user['bitacoraId'];
            BitacoraService::logEvent($bitacoraId, 'POST', '/docente/assignToExistingUser', "Se asignó docente al usuario ID {$request->id_usuario} con código {$request->codigo}");

            return response()->json(['message' => 'Docente asignado a usuario existente correctamente'], 201);
        } catch (\Exception $e) {
            \Log::error("Error al asignar docente a usuario existente: " . $e->getMessage());
            return response()->json(['message' => 'Error interno del servidor al asignar docente', 'details' => $e->getMessage()], 500);
        }
    }

    // -------------------------------------------------
    // Obtener todos los docentes con info de usuario y persona
    // -------------------------------------------------
    public function index()
    {
        $docentes = DB::table('docente')
            ->join('persona', 'docente.ci', '=', 'persona.ci')
            ->leftJoin('usuario', 'persona.ci', '=', 'usuario.ci_persona')
            ->leftJoin('rol', 'usuario.id_rol', '=', 'rol.id')
            ->select(
                'docente.codigo',
                'persona.ci',
                'persona.nombre',
                'persona.apellido_p',
                'persona.apellido_m',
                'persona.sexo',
                'persona.estado',
                'persona.telefono',
                'usuario.id as id_usuario',
                'usuario.username',
                'usuario.email',
                'rol.nombre as rol'
            )
            ->get();

        return response()->json($docentes);
    }

    // -------------------------------------------------
    // Obtener docente por id de usuario
    // -------------------------------------------------
    public function showByUserId($id_usuario)
    {
        $docente = DB::table('docente')
            ->join('persona', 'docente.ci', '=', 'persona.ci')
            ->join('usuario', 'persona.ci', '=', 'usuario.ci_persona')
            ->leftJoin('rol', 'usuario.id_rol', '=', 'rol.id')
            ->where('usuario.id', $id_usuario)
            ->select(
                'docente.codigo',
                'persona.ci',
                'persona.nombre',
                'persona.apellido_p',
                'persona.apellido_m',
                'persona.sexo',
                'persona.estado',
                'persona.telefono',
                'usuario.id as id_usuario',
                'usuario.username',
                'usuario.email',
                'rol.nombre as rol'
            )
            ->first();

        if (!$docente) {
            return response()->json(['message' => 'Docente no encontrado para el usuario especificado'], 404);
        }

        return response()->json($docente);
    }

    // -------------------------------------------------
    // Obtener docente por código
    // -------------------------------------------------
    public function showByCodigo($codigo)
    {
        $docente = DB::table('docente')
            ->join('persona', 'docente.ci', '=', 'persona.ci')
            ->leftJoin('usuario', 'persona.ci', '=', 'usuario.ci_persona')
            ->leftJoin('rol', 'usuario.id_rol', '=', 'rol.id')
            ->where('docente.codigo', $codigo)
            ->select(
                'docente.codigo',
                'persona.ci',
                'persona.nombre',
                'persona.apellido_p',
                'persona.apellido_m',
                'persona.sexo',
                'persona.estado',
                'persona.telefono',
                'usuario.id as id_usuario',
                'usuario.username',
                'usuario.email',
                'rol.nombre as rol'
            )
            ->first();

        if (!$docente) {
            return response()->json(['message' => 'Docente no encontrado'], 404);
        }

        return response()->json($docente);
    }

    // -------------------------------------------------
    // Actualizar docente por id de usuario
    // -------------------------------------------------
    public function update(Request $request, $id_usuario)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:50',
            'apellido_p' => 'required|string|max:50',
            'apellido_m' => 'nullable|string|max:50',
            'sexo' => 'required|string|in:M,F',
            'estado' => 'required|string|in:SOLTERO,CASADO,DIVORCIADO,VIUDO,OTRO',
            'telefono' => 'nullable|string|max:15',
            'codigo' => 'required|string|max:20'
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Error de validación', 'errors' => $validator->errors()], 422);
        }

        try {
            $usuario = DB::table('usuario')->where('id', $id_usuario)->first();
            if (!$usuario) {
                return response()->json(['message' => 'Usuario no encontrado'], 404);
            }

            // Verificar duplicado de código docente
            $exists = DB::table('docente')
                ->where('codigo', $request->codigo)
                ->where('ci', '!=', $usuario->ci_persona)
                ->first();
            if ($exists) {
                return response()->json(['message' => 'El código de docente ya está en uso'], 422);
            }

            DB::table('docente')->where('ci', $usuario->ci_persona)->update([
                'codigo' => $request->codigo
            ]);

            DB::table('persona')->where('ci', $usuario->ci_persona)->update([
                'nombre' => $request->nombre,
                'apellido_p' => $request->apellido_p,
                'apellido_m' => $request->apellido_m,
                'sexo' => $request->sexo,
                'estado' => $request->estado,
                'telefono' => $request->telefono
            ]);

            $bitacoraId = $request->user['bitacoraId'];
            BitacoraService::logEvent($bitacoraId, 'PUT', "/docente/{$id_usuario}", "Se actualizó docente del usuario ID {$id_usuario}");

            return response()->json(['message' => 'Docente actualizado correctamente']);
        } catch (\Exception $e) {
            \Log::error("Error al actualizar docente: " . $e->getMessage());
            return response()->json(['message' => 'Error interno del servidor al actualizar docente', 'details' => $e->getMessage()], 500);
        }
    }

    // -------------------------------------------------
    // Eliminar docente por id de usuario
    // -------------------------------------------------
    public function destroy($id_usuario, Request $request)
    {
        try {
            $usuario = DB::table('usuario')->where('id', $id_usuario)->first();
            if (!$usuario) {
                return response()->json(['message' => 'Usuario no encontrado'], 404);
            }

            $deleted = DB::table('docente')->where('ci', $usuario->ci_persona)->delete();
            if ($deleted === 0) {
                return response()->json(['message' => 'Docente no encontrado'], 404);
            }

            $bitacoraId = $request->user['bitacoraId'];
            BitacoraService::logEvent($bitacoraId, 'DELETE', "/docente/{$id_usuario}", "Se eliminó docente del usuario ID {$id_usuario}");

            return response()->json(['message' => 'Docente eliminado correctamente']);
        } catch (\Exception $e) {
            \Log::error("Error al eliminar docente: " . $e->getMessage());
            return response()->json(['message' => 'Error interno del servidor al eliminar docente', 'details' => $e->getMessage()], 500);
        }
    }
}
