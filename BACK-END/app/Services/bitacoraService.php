<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class bitacoraService
{
    // Iniciar cabecera de bitacora
    public static function iniciarBitacora($id_usuario, $ip)
    {
        try {
            // Insertamos los datos de usuario en la cabecera
            $result = DB::select("
                INSERT INTO bitacora (id_usuario, ip) VALUES (?, ?) RETURNING id
                ",[$id_usuario, $ip]
            );
            
            // Retornamos el id de la bitacora
            return $result[0]->id;
        } catch (\Exception $e) {
            \Log::error('Error al iniciar bitácora: ' . $e->getMessage());
            throw $e;
        }
    }

    // Registrar Evento
    public static function logEvent($id_bitacora, $metodo, $ruta, $mensaje)
    {
        try {
            // Insertamos la informacion proporcionada del evento que acaba de ocurrir
            DB::insert("
                INSERT INTO detalle_bitacora (id_bitacora, metodo, ruta, mensaje) VALUES (?, ?, ?, ?)
                ",[$id_bitacora, $metodo, $ruta, $mensaje]
            );

        } catch (\Exception $e) {
            \Log::error('Error al registrar en detalle_bitacora: ' . $e->getMessage());
        }
    }

    // Cerrar bitacora
    public static function cerrarBitacora($id_bitacora, $mensaje = 'Logout')
    {
        try {
            // Actualizamos los datos de salida
            DB::update("
                UPDATE bitacora SET fecha_fin = CURRENT_TIMESTAMP, hora_fin = CURRENT_TIME WHERE id = ?"
                ,[$id_bitacora]
            );

            // Registrar el detalle de cierre
            self::logEvent($id_bitacora, 'POST', '/auth/logout', $mensaje);
        } catch (\Exception $e) {
            \Log::error('Error al cerrar bitácora: ' . $e->getMessage());
        }
    }
}