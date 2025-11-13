<?php

namespace App\Http\Middleware;

use Closure;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Exception;

class verificarToken
{
    public function handle($request, Closure $next)
    {
        // Obtener el token de la cabecera Authorization
        $token = $request->header('Authorization');

        // Verificar que el token esté presente
        if (!$token) {
            return response()->json([
                'success' => false,
                'message' => 'No hay token, autorización denegada'
            ], 401);
        }

        // Remover el prefijo "Bearer " si está presente
        if (str_starts_with($token, 'Bearer ')) {
            $token = substr($token, 7);
        }

        try {
            // Decodificar el token JWT
            $jwtSecret = env('JWT_SECRET', 'secreto123');
            $decoded = JWT::decode($token, new Key($jwtSecret, 'HS256'));
            
            // Adjuntar la información del usuario al request
            $request->user = (array) $decoded;
            
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Token no válido'
            ], 403);
        }

        // Continuar con la solicitud
        return $next($request);
    }
}