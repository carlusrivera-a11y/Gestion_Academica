<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;

class CorsServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Lista de orígenes permitidos (puedes agregar todos los que necesites)
        $allowedOrigins = [
            'http://localhost:5173',  // Vite dev server
            'http://127.0.0.1:5173',  // Vite alternativo
            'http://localhost:3000',  // React dev server
            'https://gestion-academica-eight.vercel.app', // Producción
            'https://tu-otro-frontend.com',     // Segundo frontend
        ];

        // Manejar preflight requests (OPTIONS)
        $this->app->router->options('{any}', function (Request $request) use ($allowedOrigins) {
            $origin = $request->header('Origin');
            
            if (in_array($origin, $allowedOrigins)) {
                return Response::make('OK', 200)
                    ->header('Access-Control-Allow-Origin', $origin)
                    ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
                    ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-CSRF-TOKEN')
                    ->header('Access-Control-Allow-Credentials', 'true')
                    ->header('Access-Control-Max-Age', '86400'); // 24 horas
            }
            
            return Response::make('Unauthorized', 403);
        })->where('any', '.*');

        // Agregar headers CORS a todas las respuestas
        Response::macro('withCors', function ($response, Request $request) use ($allowedOrigins) {
            $origin = $request->header('Origin');
            
            if (in_array($origin, $allowedOrigins)) {
                $response->header('Access-Control-Allow-Origin', $origin)
                        ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
                        ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-CSRF-TOKEN')
                        ->header('Access-Control-Allow-Credentials', 'true');
            }
            
            return $response;
        });
    }
}