const API_URL = import.meta.env.VITE_API_URL;

// ----------------------------
// Función principal para requests
// ----------------------------
export async function apiRequest(endpoint, options = {}) {
  const {
    method = 'GET',
    body = null,
    headers = {},
    ...restOptions
  } = options;

  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...restOptions,
  };

  // Token si existe
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Body si hay
  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    console.log('Enviando body:', JSON.stringify(body, null, 2));
    const response = await fetch(`${API_URL}/${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
    }

    return data;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
}

// ----------------------------
// Auth API
// ----------------------------
export const authAPI = {
  login: (credentials) => apiRequest('api/auth/login', { method: 'POST', body: credentials }),
  logout: () => apiRequest('api/auth/logout', { method: 'POST' }),
};

// ----------------------------
// Permiso API
// ----------------------------
export const permisoAPI = {
  // Obtener todos los permisos
  getAll: () => apiRequest('api/permiso', { method: 'GET' }),

  // Obtener permiso por ID
  getById: (id) => apiRequest(`api/permiso/${id}`, { method: 'GET' }),

  // Crear nuevo permiso
  create: (nombre) =>
    apiRequest('api/permiso', {
      method: 'POST',
      body: { nombre },
    }),

  // Actualizar permiso existente
  update: (id, nombre) =>
    apiRequest(`api/permiso/${id}`, {
      method: 'PUT',
      body: { nombre },
    }),

  // Eliminar permiso
  remove: (id) =>
    apiRequest(`api/permiso/${id}`, { method: 'DELETE' }),
};

// ----------------------------
// Rol API
// ----------------------------
export const rolAPI = {
  getAll: async () => apiRequest('api/rol'),
  getById: async (id) => apiRequest(`api/rol/${id}`),
  getByName: async (nombre) => apiRequest(`api/rol/nombre/${nombre}`),
  create: async (rol) => apiRequest('api/rol', { method: 'POST', body: rol }),
  update: async (id, rol) => apiRequest(`api/rol/${id}`, { method: 'PUT', body: rol }),
  remove: async (id) => apiRequest(`api/rol/${id}`, { method: 'DELETE' }),
  
  // ---------------- Permisos ----------------
  getPermisos: async (rolId) => apiRequest(`api/rol/${rolId}/permisos`),
  
  assignPermiso: async (rolId, permisoId) =>
    apiRequest('api/rol/permiso', {
      method: 'POST',
      body: { id_rol: rolId, id_permiso: permisoId }
    }),
  
  removePermiso: async (rolId, permisoId) =>
      apiRequest(`api/rol/${rolId}/permiso/${permisoId}`, { method: 'DELETE' }),
};

// ----------------------------
// Usuario API
// ----------------------------
export const usuarioAPI = {
  // Obtener todos los usuarios
  getAll: () => apiRequest('api/usuario', { method: 'GET' }),

  // Obtener usuario por ID
  getById: (id) => apiRequest(`api/usuario/${id}`, { method: 'GET' }),

  // Obtener usuario por username
  getByUsername: (username) => apiRequest(`api/usuario/username/${username}`, { method: 'GET' }),

  // Crear nuevo usuario
  create: (usuarioData) =>
    apiRequest('api/usuario', {
      method: 'POST',
      body: usuarioData,
    }),

  // Actualizar usuario existente
  update: (id, usuarioData) =>
    apiRequest(`api/usuario/${id}`, {
      method: 'PUT',
      body: usuarioData,
    }),

  // Eliminar usuario
  remove: (id) =>
    apiRequest(`api/usuario/${id}`, { method: 'DELETE' }),

  // Asignar rol a usuario
  assignRole: (id, id_rol) =>
    apiRequest(`api/usuario/rol/${id}`, {
      method: 'POST',
      body: { id_rol },
    }),

  // Eliminar rol asignado a usuario
  removeRole: (id) =>
    apiRequest(`api/usuario/rol/${id}`, { method: 'DELETE' }),
};

// ----------------------------
// Docente API
// ----------------------------
export const docenteAPI = {
  getAll: () => apiRequest('api/docente', { method: 'GET' }),
  getByCodigo: (codigo) => apiRequest(`api/docente/codigo/${codigo}`, { method: 'GET' }),
  getByUsuarioId: (id_usuario) => apiRequest(`api/docente/usuario/${id_usuario}`, { method: 'GET' }),

  assignToExistingUser: (payload) =>
    apiRequest('api/docente/assignToExistingUser', { method: 'POST', body: payload }),

  storeFromScratch: (payload) =>
    apiRequest('api/docente/storeFromScratch', { method: 'POST', body: payload }),

  update: (id_usuario, payload) =>
    apiRequest(`api/docente/${id_usuario}`, { method: 'PUT', body: payload }),

  remove: (id_usuario) =>
    apiRequest(`api/docente/${id_usuario}`, { method: 'DELETE' }),
};

// ----------------------------
// Historial API
// ----------------------------
export const historialAPI = {
  // Obtener todas las bitácoras
  getAll: () => apiRequest('api/bitacora', { method: 'GET' }),

  // Obtener una bitácora por ID
  getById: (id) => apiRequest(`api/bitacora/${id}`, { method: 'GET' }),

  // Obtener bitácoras por usuario
  getByUserId: (userId) => apiRequest(`api/bitacora/usuario/${userId}`, { method: 'GET' }),

  // Obtener todos los detalles de una bitácora en especifico
  getDetalles: (bitacoraId) => apiRequest(`api/bitacora/${bitacoraId}/detalles`, { method: 'GET' }),

  // Obtener un detalle en especifico de una bitácora en especifico
  getDetalleById: (bitacoraId, detalleId) => apiRequest(`api/bitacora/${bitacoraId}/detalle/${detalleId}`, { method: 'GET' }),
};

// ----------------------------
// Aula API
// ----------------------------
export const aulaAPI = {
  getAll: () => apiRequest('api/aula', { method: 'GET' }),
  getByNro: (nro) => apiRequest(`api/aula/${nro}`, { method: 'GET' }),
  create: (aula) => apiRequest('api/aula', { method: 'POST', body: aula }),
  update: (nro, aula) => apiRequest(`api/aula/${nro}`, { method: 'PUT', body: aula }),
  remove: (nro) => apiRequest(`api/aula/${nro}`, { method: 'DELETE' }),
};

// ----------------------------
// Tipo Aula API 
// ----------------------------
export const tipoAulaAPI = {
  // Obtener todos los tipos de aula
  getAll: () => apiRequest('api/tipo', { method: 'GET' }),

  // Obtener tipo por ID
  getById: (id) => apiRequest(`api/tipo/${id}`, { method: 'GET' }),

  // Obtener tipo por nombre
  getByNombre: (nombre) => apiRequest(`api/tipo/nombre/${nombre}`, { method: 'GET' }),

  // Crear nuevo tipo de aula
  create: (nombre) => 
    apiRequest('api/tipo', {
      method: 'POST',
      body: { nombre },
    }),

  // Actualizar tipo de aula
  update: (id, nombre) => 
    apiRequest(`api/tipo/${id}`, {
      method: 'PUT',
      body: { nombre },
    }),

  // Eliminar tipo de aula
  remove: (id) => 
    apiRequest(`api/tipo/${id}`, { method: 'DELETE' }),
};

// ----------------------------
// Materia API
// ----------------------------
export const materiaAPI = {
  // Obtener todas las materias
  getAll: () => apiRequest('api/materia', { method: 'GET' }),

  // Obtener materia por sigla
  getBySigla: (sigla) => apiRequest(`api/materia/sigla/${sigla}`, { method: 'GET' }),

  // Obtener materia por nombre
  getByNombre: (nombre) => apiRequest(`api/materia/nombre/${nombre}`, { method: 'GET' }),

  // Crear nueva materia
  create: (materiaData) => 
    apiRequest('api/materia', {
      method: 'POST',
      body: materiaData,
    }),

  // Actualizar materia existente
  update: (sigla, materiaData) => 
    apiRequest(`api/materia/${sigla}`, {
      method: 'PUT',
      body: materiaData,
    }),

  // Eliminar materia
  remove: (sigla) => 
    apiRequest(`api/materia/${sigla}`, { method: 'DELETE' }),
};

// ----------------------------
// Gestion Academica API
// ----------------------------
export const gestionAPI = {
  // Obtener todas las gestiones
  getAll: () => apiRequest('api/gestion', { method: 'GET' }),

  // Obtener gestión por ID
  getById: (id) => apiRequest(`api/gestion/${id}`, { method: 'GET' }),

  // Obtener gestiones por año y semestre
  getByAnioSemestre: (anio, semestre) => 
    apiRequest(`api/gestion/filtrar?anio=${anio}&semestre=${semestre}`, { method: 'GET' }),

  // Crear nueva gestión
  create: (gestionData) => 
    apiRequest('api/gestion', {
      method: 'POST',
      body: gestionData,
    }),

  // Actualizar gestión existente
  update: (id, gestionData) => 
    apiRequest(`api/gestion/${id}`, {
      method: 'PUT',
      body: gestionData,
    }),

  // Eliminar gestión
  remove: (id) => 
    apiRequest(`api/gestion/${id}`, { method: 'DELETE' }),
};

// ----------------------------
// Grupo API (NUEVO)
// ----------------------------
export const grupoAPI = {
  // Obtener todos los grupos con materias asociadas
  getAll: () => apiRequest('api/grupo', { method: 'GET' }),

  // Obtener grupo-materia específico
  getBySiglas: (sigla_materia, sigla_grupo) => 
    apiRequest(`api/grupo/${sigla_materia}/${sigla_grupo}`, { method: 'GET' }),

  // Crear grupo y asociarlo a materia
  create: (sigla_grupo, sigla_materia) => 
    apiRequest('api/grupo', {
      method: 'POST',
      body: { sigla_grupo, sigla_materia },
    }),

  // Eliminar asociación materia-grupo
  remove: (sigla_materia, sigla_grupo) => 
    apiRequest(`api/grupo/${sigla_materia}/${sigla_grupo}`, { method: 'DELETE' }),
};

// ----------------------------
// Asignar Docente API 
// ----------------------------
export const asignarDocenteAPI = {
  // Obtener todas las asociaciones
  getAll: () => apiRequest('api/asignar-docente', { method: 'GET' }),

  // Obtener asociaciones por materia y grupo
  getByGrupoMateria: (sigla_materia, sigla_grupo) => 
    apiRequest(`api/asignar-docente/${sigla_materia}/${sigla_grupo}`, { method: 'GET' }),

  // Obtener una asociación específica
  getOne: (id_gestion, sigla_materia, sigla_grupo) => 
    apiRequest(`api/asignar-docente/${id_gestion}/${sigla_materia}/${sigla_grupo}`, { method: 'GET' }),

  // Crear nueva asociación
  create: (data) => 
    apiRequest('api/asignar-docente', {
      method: 'POST',
      body: data,
    }),

  // Actualizar docente asociado
  update: (id_gestion, sigla_materia, sigla_grupo, ci_docente) => 
    apiRequest(`api/asignar-docente/${id_gestion}/${sigla_materia}/${sigla_grupo}`, {
      method: 'PUT',
      body: { ci_docente },
    }),

  // Eliminar asociación
  remove: (id_gestion, sigla_materia, sigla_grupo) => 
    apiRequest(`api/asignar-docente/${id_gestion}/${sigla_materia}/${sigla_grupo}`, { method: 'DELETE' }),
};

// ----------------------------
// Asignar Aula API (NUEVO)
// ----------------------------
export const asignarAulaAPI = {
  // Obtener todas las asociaciones
  getAll: () => apiRequest('api/asignar-aula', { method: 'GET' }),

  // Obtener asociaciones por grupo-materia
  getByGrupoMateria: (sigla_materia, sigla_grupo) => 
    apiRequest(`api/asignar-aula/${sigla_materia}/${sigla_grupo}`, { method: 'GET' }),

  // Obtener asociaciones por gestión
  getByGestion: (id_gestion) => 
    apiRequest(`api/asignar-aula/gestion/${id_gestion}`, { method: 'GET' }),

  // Obtener asociaciones por aula y gestión
  getByAulaGestion: (nro_aula, id_gestion) => 
    apiRequest(`api/asignar-aula/${nro_aula}/gestion/${id_gestion}`, { method: 'GET' }),

  // Crear nueva asociación aula-horario
  create: (data) => 
    apiRequest('api/asignar-aula', {
      method: 'POST',
      body: data,
    }),

  // Eliminar asociación aula-horario
  remove: (id_gestion, nro_aula, data) => 
    apiRequest(`api/asignar-aula/${id_gestion}/${nro_aula}`, {
      method: 'DELETE',
      body: data,
    }),
};

// ----------------------------
// Asistencia API
// ----------------------------
export const asistenciaAPI = {
  // Obtener clases del docente para la gestión activa más reciente
  getMisClases: () => apiRequest('api/asistencia/mis-clases', { method: 'GET' }),

  // Registrar asistencia del docente (por ahora sin acción en frontend)
  registrar: (data) =>
    apiRequest('api/asistencia', {
      method: 'POST',
      body: data,
    }),

  // Obtener todas las asistencias del docente autenticado
  getMisAsistencias: () => apiRequest('api/asistencias/mias', { method: 'GET' }),
};
