<?php

// Administrar Usuario
require __DIR__ . '/usuario/auth.routes.php';
require __DIR__ . '/usuario/docente.routes.php';
require __DIR__ . '/usuario/importar_usuarios.routes.php';
require __DIR__ . '/usuario/permiso.routes.php';
require __DIR__ . '/usuario/rol.routes.php';
require __DIR__ . '/usuario/usuario.routes.php';
require __DIR__ . '/usuario/ver_historial.routes.php';

// Administrar Gestion Academica
require __DIR__ . '/academico/materia.routes.php';
require __DIR__ . '/academico/gestion.routes.php';
require __DIR__ . '/academico/tipo_aula.routes.php';
require __DIR__ . '/academico/aula.routes.php';
require __DIR__ . '/academico/grupo.routes.php';
require __DIR__ . '/academico/asignar_docente.routes.php';
require __DIR__ . '/academico/asignar_aula.routes.php';

// Administrar Asistencia
require __DIR__ . '/asistencia/asistencia.routes.php';

// Administrar Reporte
