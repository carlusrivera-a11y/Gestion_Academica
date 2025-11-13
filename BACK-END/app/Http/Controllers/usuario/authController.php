<?php

namespace App\Http\Controllers\usuario;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use App\Services\bitacoraService;

class authController extends Controller
{
    // -------------------------------------------------
    // Login
    // -------------------------------------------------
    public function login(Request $request)
    {
        try {
            // Validar entrada
            $request->validate([
                'username' => 'required|string',
                'contrasena' => 'required|string',
            ]);

            // Buscar usuario en la base de datos
            $users = DB::select("
                SELECT id, username, email, contrasena, id_rol, ci_persona 
                FROM usuario 
                WHERE username = ?
                ", [$request->username]
            );

            // Verificar si se encontró el usuario
            if (empty($users)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no encontrado'
                ], 400);
            }

            $user = $users[0];

            // Iniciar la bitácora ANTES de verificar contraseña 
            $bitacoraId = BitacoraService::iniciarBitacora($user->id, $request->ip());

            // Verificar contraseña
            if (!Hash::check($request->contrasena, $user->contrasena)) {
                BitacoraService::logEvent($bitacoraId, 'POST', '/login', 'Contraseña incorrecta');
                
                return response()->json([
                    'success' => false,
                    'message' => 'Contraseña incorrecta'
                ], 401);
            }

            // Generar token JWT
            $payload = [
                'id_user' => $user->id,
                'id_rol' => $user->id_rol,
                'bitacoraId' => $bitacoraId,
                'exp' => time() + 3600 // 1 hora
            ];

            $jwtSecret = env('JWT_SECRET', 'secreto123');
            $token = JWT::encode($payload, $jwtSecret, 'HS256');

            // Registrar login exitoso
            BitacoraService::logEvent($bitacoraId, 'POST', '/login', 'Login exitoso');

            // Retornar token y datos del usuario
            return response()->json([
                'success' => true,
                'message' => 'Login exitoso',
                'token' => $token,
                'user' => $user
            ]);
        } catch (\Exception $e) {
            \Log::error("Error al iniciar sesión: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al iniciar sesión'
            ], 500);
        }
    }

    // -------------------------------------------------
    // Logout
    // -------------------------------------------------
    public function logout(Request $request)
    {
        try {
            // Obtener el ID de la bitácora desde el token
            $bitacoraId = $request->user['bitacoraId'] ?? null;

            // Verificar que se obtuvo el ID de la bitácora
            if (!$bitacoraId) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontró bitácora activa en el token'
                ], 400);
            }

            // Cerrar la bitácora
            BitacoraService::cerrarBitacora($bitacoraId, 'Logout exitoso');

            // Retornar respuesta de logout exitoso
            return response()->json([
                'success' => true,
                'message' => 'Logout exitoso'
            ]);
        } catch (\Exception $e) {
            \Log::error("Error en logout: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al cerrar sesión'
            ], 500);
        }
    }

    // -------------------------------------------------
    // Me
    // -------------------------------------------------
    public function me(Request $request)
    {
        try {
            // Obtenemos el usuario actual
            $userId = $request->user['id_user'] ?? null;
            
            // Verificamos
            if (!$userId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Token no válido'
                ], 401);
            }

            // Obtenemos los datos del usuario desde la base de datos
            $users = DB::select("
                SELECT u.*, p.nombre, p.apellido_p, p.apellido_m, r.nombre as rol_nombre
                FROM usuario u, persona p, rol r
                WHERE u.ci_persona = p.ci 
                AND u.id_rol = r.id 
                AND u.id = ?;
                ", [$userId]
            );

            // Verificamos
            if (empty($users)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no encontrado'
                ], 404);
            }

            // Retornamos la informacion del usuario
            return response()->json([
                'success' => true,
                'user' => $users[0]
            ]);

        } catch (\Exception $e) {
            \Log::error("Error al obtener usuario: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener información del usuario'
            ], 500);
        }
    }
}