<?php

namespace App\Http\Middleware;

use Closure;

class getClientIp
{
    public function handle($request, Closure $next)
    {
        // Obtener la IP del cliente
        $clientIp = $request->ip();
        
        // Adjuntar la IP al request
        $request->merge(['client_ip' => $clientIp]);
        
        return $next($request);
    }
}