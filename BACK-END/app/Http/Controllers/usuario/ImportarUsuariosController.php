<?php

namespace App\Http\Controllers\usuario;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use PhpOffice\PhpSpreadsheet\IOFactory;
use App\Services\BitacoraService;

class ImportarUsuariosController extends Controller
{
    // -------------------------------------------------
    // Importar usuarios desde archivo Excel o CSV
    // -------------------------------------------------
    public function importar(Request $request)
    {
        \Log::info('Iniciando importación de usuarios');

        $validator = Validator::make($request->all(), [
            'archivo' => 'required|file|mimes:xlsx,xls,csv|max:10240', // max 10MB
        ]);

        if ($validator->fails()) {
            \Log::error('Validación fallida: ' . json_encode($validator->errors()));
            return response()->json(['message' => 'Archivo inválido', 'errors' => $validator->errors()], 422);
        }

        $file = $request->file('archivo');
        \Log::info('Archivo recibido: ' . $file->getClientOriginalName());

        try {
            $spreadsheet = IOFactory::load($file->getPathname());
            $sheet = $spreadsheet->getActiveSheet();
            $rows = $sheet->toArray();

            \Log::info('Filas leídas: ' . count($rows));
            
            // Suponemos que la primera fila es cabecera
            $cabecera = array_map('strtolower', $rows[0]);
            $requiredColumns = ['ci','nombre','apellido_p','apellido_m','sexo','estado','telefono','username','email','contrasena','id_rol','codigo_docente'];

            foreach ($requiredColumns as $col) {
                if (!in_array($col, $cabecera)) {
                    return response()->json([
                        'message' => "La columna obligatoria '{$col}' no se encuentra en el archivo."
                    ], 422);
                }
            }

            $errores = [];
            DB::beginTransaction();

            // Recorrer las filas, empezando desde la segunda
            for ($i = 1; $i < count($rows); $i++) {
                $fila = array_combine($cabecera, $rows[$i]);

                // Validar fila
                $filaValidator = Validator::make($fila, [
                    'ci' => 'required|string|max:15|unique:persona,ci',
                    'nombre' => 'required|string|max:50',
                    'apellido_p' => 'required|string|max:50',
                    'apellido_m' => 'nullable|string|max:50',
                    'sexo' => 'required|string|in:M,F',
                    'estado' => 'required|string|in:SOLTERO,CASADO,DIVORCIADO,VIUDO,OTRO',
                    'telefono' => 'nullable|string|max:15',
                    'username' => 'required|string|max:50|regex:/^[A-Za-z0-9_\-]+$/|unique:usuario,username',
                    'email' => 'required|string|email|max:320|unique:usuario,email',
                    'contrasena' => 'required|string|max:250',
                    'id_rol' => 'nullable|integer|exists:rol,id',
                    'codigo_docente' => 'nullable|string|max:20|unique:docente,codigo'
                ]);

                if ($filaValidator->fails()) {
                    $errores[] = [
                        'fila' => $i + 1,
                        'errores' => $filaValidator->errors()
                    ];
                    continue;
                }

                try {
                    // Insertar persona
                    DB::table('persona')->insert([
                        'ci' => $fila['ci'],
                        'nombre' => $fila['nombre'],
                        'apellido_p' => $fila['apellido_p'],
                        'apellido_m' => $fila['apellido_m'],
                        'sexo' => $fila['sexo'],
                        'estado' => $fila['estado'],
                        'telefono' => $fila['telefono']
                    ]);

                    // Insertar usuario
                    DB::table('usuario')->insert([
                        'username' => $fila['username'],
                        'email' => $fila['email'],
                        'contrasena' => Hash::make($fila['contrasena']),
                        'ci_persona' => $fila['ci'],
                        'id_rol' => $fila['id_rol']
                    ]);

                    // Insertar docente si existe código
                    if (!empty($fila['codigo_docente'])) {
                        DB::table('docente')->insert([
                            'ci' => $fila['ci'],
                            'codigo' => $fila['codigo_docente']
                        ]);
                    }

                } catch (\Exception $e) {
                    $errores[] = [
                        'fila' => $i + 1,
                        'errores' => $e->getMessage()
                    ];
                }
            }

            if (!empty($errores)) {
                DB::rollBack();
                return response()->json([
                    'message' => 'Se encontraron errores al importar algunas filas',
                    'errores' => $errores
                ], 422);
            }

            DB::commit();

            // Registrar en bitácora
            $bitacoraId = $request->user['bitacoraId'] ?? null;
            if ($bitacoraId) {
                BitacoraService::logEvent(
                    $bitacoraId,
                    'POST',
                    '/usuarios/importar',
                    "Se importaron usuarios por lotes desde archivo {$file->getClientOriginalName()}"
                );
            }

            return response()->json([
                'message' => 'Usuarios importados correctamente',
                'total_importados' => count($rows) - 1
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error("Error al importar usuarios: " . $e->getMessage());
            return response()->json([
                'message' => 'Error interno al procesar el archivo',
                'details' => $e->getMessage()
            ], 500);
        }
    }
}
