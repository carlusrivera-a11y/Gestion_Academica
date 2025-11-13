<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Support\Facades\DB;

class verificarPermiso
{
    public function handle($request, Closure $next, $permisoRequerido)
    {
        try {
            $id_rol = $request->user['id_rol'] ?? null;

            // Verificar que se obtuvo el id_rol del usuario
            if (!$id_rol) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se pudo verificar el rol del usuario'
                ], 403);
            }

            // Consultar si el rol tiene asignado el permiso requerido
            $result = DB::select("
                SELECT 1
                FROM rol_permiso rp, permiso p
                WHERE rp.id_permiso = p.id AND
                rp.id_rol = ? AND p.nombre = ?
            ", [$id_rol, $permisoRequerido]);

            // Si no se encuentra el permiso, denegar el acceso
            if (empty($result)) {
                return response()->json([
                    'success' => false,
                    'message' => "Acceso denegado. No tienes el permiso: {$permisoRequerido}"
                ], 403);
            }

            // Permiso verificado, continuar con la solicitud
            return $next($request);

        } catch (\Exception $e) {
            \Log::error('Error al verificar permiso: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error interno al verificar permisos'
            ], 500);
        }
    }
}