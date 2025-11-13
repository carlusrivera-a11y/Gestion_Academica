import React, { useEffect, useState } from 'react';
import { usuarioAPI, rolAPI, docenteAPI } from '../api/api';
import '../styles/Dashboard.css';

const PAGE_SIZE = 5;

// ----------------------------
// API para importar usuarios
// ----------------------------
export const importarUsuariosAPI = {
  importar: (formData) => 
    apiRequest('api/usuarios/importar', {
      method: 'POST',
      body: formData,
      headers: {} // No establecer Content-Type para FormData
    }),
};

export default function UsuarioPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [search, setSearch] = useState('');
  const [rolesSearch, setRolesSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modales
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddDocenteModal, setShowAddDocenteModal] = useState(false);
  const [showAssignExistingModal, setShowAssignExistingModal] = useState(false);
  const [showAddDocenteFromScratchModal, setShowAddDocenteFromScratchModal] = useState(false);
  const [showRemoveDocenteModal, setShowRemoveDocenteModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const [modalError, setModalError] = useState('');
  const [loadingModal, setLoadingModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [docenteInfo, setDocenteInfo] = useState(null);

  const [usuarioForm, setUsuarioForm] = useState({
    ci: '', nombre: '', apellido_p: '', apellido_m: '',
    sexo: 'M', estado: 'SOLTERO', telefono: '',
    username: '', email: '', contrasena: '', id_rol: null
  });

  // ------------------ Fetch roles y usuarios ------------------
  const fetchRoles = async () => {
    try {
      const data = await rolAPI.getAll();
      setRoles(data);
    } catch (err) {
      console.error('Error al cargar roles', err);
    }
  };

  const fetchUsuarios = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await usuarioAPI.getAll();
      const dataConIdRol = data.map(u => ({
        ...u,
        id_rol: u.rol ? (roles.find(r => r.nombre === u.rol)?.id || null) : null
      }));
      setUsuarios(dataConIdRol);
    } catch (err) {
      setErrorMsg(err.message || 'Error al obtener usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRoles(); }, []);
  useEffect(() => { if (roles.length) fetchUsuarios(); }, [roles]);

  // ------------------ Filtros y paginación ------------------
  const filteredUsuarios = usuarios.filter(u =>
    u.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (u.rol || '').toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filteredUsuarios.length / PAGE_SIZE);
  const displayedUsuarios = filteredUsuarios.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // ------------------ Handlers generales ------------------
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUsuarioForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectRole = (roleId) => {
    setUsuarioForm(prev => ({ ...prev, id_rol: roleId }));
  };

  // ------------------ Abrir/Añadir Usuario ------------------
  const openAddModal = () => {
    setUsuarioForm({
      ci: '', nombre: '', apellido_p: '', apellido_m: '',
      sexo: 'M', estado: 'SOLTERO', telefono: '',
      username: '', email: '', contrasena: '', id_rol: null
    });
    setRolesSearch('');
    setModalError('');
    setShowAddModal(true);
  };

  const handleConfirmAdd = async () => {
    if (!usuarioForm.ci || !usuarioForm.nombre || !usuarioForm.apellido_p ||
        !usuarioForm.username || !usuarioForm.email || !usuarioForm.contrasena) {
      setModalError('Por favor complete los campos obligatorios.');
      return;
    }
    setLoadingModal(true);
    try {
      await usuarioAPI.create({
        ...usuarioForm,
        apellido_m: usuarioForm.apellido_m || null,
        telefono: usuarioForm.telefono || null,
        id_rol: usuarioForm.id_rol || null
      });
      setShowAddModal(false);
      fetchUsuarios();
    } catch (err) {
      setModalError(err.message || 'Error al crear el usuario');
    } finally {
      setLoadingModal(false);
    }
  };

  // ------------------ Editar Usuario ------------------
  const openEditModal = async (user) => {
    setSelectedUser(user);
    setUsuarioForm({
      ci: user.ci, nombre: user.nombre, apellido_p: user.apellido_p,
      apellido_m: user.apellido_m || '', sexo: user.sexo, estado: user.estado,
      telefono: user.telefono || '', username: user.username, email: user.email,
      contrasena: '', id_rol: user.id_rol
    });
    setRolesSearch('');
    setModalError('');
    
    // Verificar si el usuario es docente
    try {
      const docenteData = await docenteAPI.getByUsuarioId(user.id);
      if (docenteData) {
        setDocenteInfo(docenteData);
        // Incluir el código del docente en el formulario
        setUsuarioForm(prev => ({ 
          ...prev, 
          codigo_docente: docenteData.codigo 
        }));
      } else {
        setDocenteInfo(null);
      }
    } catch (err) {
      // Si no es docente, no hay problema
      setDocenteInfo(null);
    }
    
    setShowEditModal(true);
  };

  const handleConfirmEdit = async () => {
    if (!usuarioForm.nombre || !usuarioForm.apellido_p || !usuarioForm.username || !usuarioForm.email) {
      setModalError('Por favor complete los campos obligatorios.');
      return;
    }
    setLoadingModal(true);
    try {
      // Actualizar usuario primero
      await usuarioAPI.update(selectedUser.id, {
        ...usuarioForm,
        apellido_m: usuarioForm.apellido_m || null,
        telefono: usuarioForm.telefono || null,
        id_rol: usuarioForm.id_rol || null
      });

      // Si es docente y hay cambios en el código, actualizar el docente con TODOS los campos requeridos
      if (docenteInfo && usuarioForm.codigo_docente && usuarioForm.codigo_docente !== docenteInfo.codigo) {
        await docenteAPI.update(selectedUser.id, {
          nombre: usuarioForm.nombre,
          apellido_p: usuarioForm.apellido_p,
          apellido_m: usuarioForm.apellido_m || null,
          sexo: usuarioForm.sexo,
          estado: usuarioForm.estado,
          telefono: usuarioForm.telefono || null,
          codigo: usuarioForm.codigo_docente
        });
      }

      setShowEditModal(false);
      fetchUsuarios();
    } catch (err) {
      setModalError(err.message || 'Error al actualizar el usuario');
    } finally {
      setLoadingModal(false);
    }
  };

  // ------------------ Eliminar Usuario ------------------
  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setModalError('');
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    setLoadingModal(true);
    try {
      await usuarioAPI.remove(selectedUser.id);
      setShowDeleteModal(false);
      fetchUsuarios();
    } catch (err) {
      setModalError(err.message || 'Error al eliminar el usuario');
    } finally {
      setLoadingModal(false);
    }
  };

  // ------------------ Remover Docente ------------------
  const handleRemoveDocente = async () => {
    setLoadingModal(true);
    try {
      // Eliminar el registro de docente
      await docenteAPI.remove(selectedUser.id);
      
      // Remover el rol de docente (asumiendo que el rol docente tiene ID específico)
      const rolDocente = roles.find(r => r.nombre?.toUpperCase() === 'DOCENTE');
      if (rolDocente && selectedUser.id_rol === rolDocente.id) {
        await usuarioAPI.removeRole(selectedUser.id);
      }
      
      setShowRemoveDocenteModal(false);
      setShowEditModal(false);
      fetchUsuarios();
    } catch (err) {
      setModalError(err.message || 'Error al remover docente');
    } finally {
      setLoadingModal(false);
    }
  };

  // ------------------ Importar Usuarios ------------------
  const handleImport = async (file) => {
    if (!file) {
      setModalError('Por favor seleccione un archivo');
      return;
    }

    setLoadingModal(true);
    setModalError('');

    try {
      const formData = new FormData();
      formData.append('archivo', file);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/usuarios/importar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          // NO incluir 'Content-Type' - Deja que el navegador lo establezca automáticamente con el boundary
        },
        body: formData,
      });

      // Verificar si la respuesta es JSON
      const contentType = response.headers.get('content-type');
      let data;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // Si no es JSON, leer como texto para debug
        const text = await response.text();
        console.error('Respuesta no JSON del servidor:', text);
        throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
      }

      if (!response.ok) {
        // Manejar errores de validación del backend
        if (data.errors) {
          const errorMessages = Object.values(data.errors).flat().join(', ');
          throw new Error(errorMessages || data.message);
        }
        throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
      }

      setShowImportModal(false);
      fetchUsuarios();
      
      // Mostrar mensaje de éxito
      alert(`¡Importación exitosa! Se importaron ${data.total_importados} usuarios correctamente.`);
      
    } catch (err) {
      console.error('Error en importación:', err);
      setModalError(err.message || 'Error al importar el archivo. Verifique la consola para más detalles.');
    } finally {
      setLoadingModal(false);
    }
  };

  // ------------------ Render principal ------------------
  return (
    <div className="permiso-page">
      <h2>Gestionar Usuario</h2>

      <div className="permiso-header">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={openAddModal}>+ Añadir Usuario</button>
          <button className="btn-primary" onClick={() => setShowAddDocenteModal(true)}>+ Añadir Docente</button>
          <button className="btn-primary" onClick={() => setShowImportModal(true)}>Importar</button>
        </div>
        <input
          type="text"
          placeholder="Buscar por nombre o rol..."
          maxLength={100}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
        />
      </div>

      {errorMsg && <div className="error-box">{errorMsg}</div>}

      {loading ? (
        <p>Cargando usuarios...</p>
      ) : (
        <table className="permiso-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {displayedUsuarios.map(u => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.username}</td>
                <td>{u.email}</td>
                <td>{u.rol || '-'}</td>
                <td>
                  <button className="btn-edit" onClick={() => openEditModal(u)}>Editar</button>
                  <button className="btn-delete" onClick={() => openDeleteModal(u)}>Eliminar</button>
                </td>
              </tr>
            ))}
            {displayedUsuarios.length === 0 && (
              <tr><td colSpan="5" style={{ textAlign: 'center', color: '#777' }}>No se encontraron usuarios.</td></tr>
            )}
          </tbody>
        </table>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>◀️</button>
          <span>Página {currentPage} de {totalPages}</span>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>▶️</button>
        </div>
      )}

      {/* ---------- MODALES ---------- */}
      {showAddModal && (
        <AddEditUsuarioModal
          title="Añadir Usuario"
          form={usuarioForm}
          setForm={setUsuarioForm}
          roles={roles}
          rolesSearch={rolesSearch}
          setRolesSearch={setRolesSearch}
          onConfirm={handleConfirmAdd}
          onCancel={() => setShowAddModal(false)}
          loading={loadingModal}
          error={modalError}
          isDocente={false}
        />
      )}

      {showEditModal && (
        <AddEditUsuarioModal
          title="Editar Usuario"
          form={usuarioForm}
          setForm={setUsuarioForm}
          roles={roles}
          rolesSearch={rolesSearch}
          setRolesSearch={setRolesSearch}
          onConfirm={handleConfirmEdit}
          onCancel={() => setShowEditModal(false)}
          loading={loadingModal}
          error={modalError}
          isDocente={!!docenteInfo}
          docenteInfo={docenteInfo}
          onRemoveDocente={() => setShowRemoveDocenteModal(true)}
        />
      )}

      {showDeleteModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 400 }}>
            <h3>Confirmar eliminación</h3>
            <p>¿Eliminar al usuario <strong>{selectedUser?.username}</strong>?</p>
            {modalError && <div className="error-box">{modalError}</div>}
            <div className="modal-buttons">
              <button className="btn-delete" onClick={handleConfirmDelete} disabled={loadingModal}>
                {loadingModal ? 'Eliminando...' : 'Confirmar'}
              </button>
              <button className="btn-cancel" onClick={() => setShowDeleteModal(false)} disabled={loadingModal}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {showRemoveDocenteModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 450 }}>
            <h3>Dejar de ser Docente</h3>
            <p>
              ¿Está seguro que <strong>{selectedUser?.nombre} {selectedUser?.apellido_p}</strong> ya no será docente?
            </p>
            <p style={{ color: '#666', fontSize: '14px' }}>
              <strong>Nota:</strong> Esto eliminará el registro de docente pero mantendrá al usuario en el sistema.
            </p>
            {modalError && <div className="error-box">{modalError}</div>}
            <div className="modal-buttons">
              <button className="btn-delete" onClick={handleRemoveDocente} disabled={loadingModal}>
                {loadingModal ? 'Procesando...' : 'Confirmar'}
              </button>
              <button className="btn-cancel" onClick={() => setShowRemoveDocenteModal(false)} disabled={loadingModal}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------- Importar Usuarios -------- */}
      {showImportModal && (
        <ImportarUsuariosModal
          onClose={() => setShowImportModal(false)}
          onImport={handleImport}
          loading={loadingModal}
          error={modalError}
        />
      )}

      {/* -------- Añadir Docente -------- */}
      {showAddDocenteModal && (
        <AddDocenteModal
          onClose={() => setShowAddDocenteModal(false)}
          onSelectExisting={() => { setShowAddDocenteModal(false); setShowAssignExistingModal(true); }}
          onSelectNew={() => { setShowAddDocenteModal(false); setShowAddDocenteFromScratchModal(true); }}
        />
      )}

      {showAssignExistingModal && (
        <AssignExistingDocenteModal 
          onClose={() => setShowAssignExistingModal(false)} 
          onSuccess={() => { setShowAssignExistingModal(false); fetchUsuarios(); }}
        />
      )}

      {showAddDocenteFromScratchModal && (
        <AddDocenteFromScratchModal
          onClose={() => setShowAddDocenteFromScratchModal(false)}
          onSuccess={() => { setShowAddDocenteFromScratchModal(false); fetchUsuarios(); }}
          roles={roles}
        />
      )}
    </div>
  );
}

// --------------------- Modal Importar Usuarios ---------------------
function ImportarUsuariosModal({ onClose, onImport, loading, error }) {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validar tipo de archivo
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ];
      
      if (!allowedTypes.includes(selectedFile.type)) {
        alert('Por favor seleccione un archivo Excel (.xlsx, .xls) o CSV (.csv)');
        e.target.value = '';
        return;
      }

      // Validar tamaño (10MB máximo)
      if (selectedFile.size > 10 * 1024 * 1024) {
        alert('El archivo no debe superar los 10MB');
        e.target.value = '';
        return;
      }

      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onImport(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const input = document.createElement('input');
      input.type = 'file';
      input.files = e.dataTransfer.files;
      handleFileChange({ target: input });
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card" style={{ maxWidth: 600 }}>
        <h3>Importar Usuarios desde Excel/CSV</h3>
        
        <div 
          style={{
            border: '2px dashed #ccc',
            borderRadius: '8px',
            padding: '30px',
            textAlign: 'center',
            marginBottom: '20px',
            backgroundColor: '#f9f9f9',
            cursor: 'pointer'
          }}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input').click()}
        >
          <input
            id="file-input"
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          
          {fileName ? (
            <div>
              <div style={{ fontSize: '48px', color: '#28a745', marginBottom: '10px' }}>✓</div>
              <p><strong>Archivo seleccionado:</strong></p>
              <p>{fileName}</p>
              <small style={{ color: '#666' }}>
                Haga clic para seleccionar otro archivo
              </small>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '48px', color: '#6c757d', marginBottom: '10px' }}>📁</div>
              <p><strong>Haga clic o arrastre un archivo aquí</strong></p>
              <p style={{ color: '#666', fontSize: '14px' }}>
                Formatos soportados: .xlsx, .xls, .csv (máx. 10MB)
              </p>
            </div>
          )}
        </div>

        <div style={{ 
          backgroundColor: '#e8f4fd', 
          border: '1px solid #b8daff', 
          borderRadius: '4px', 
          padding: '15px',
          marginBottom: '20px'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#004085' }}>📋 Formato requerido:</h4>
          <div style={{ fontSize: '14px' }}>
            <p><strong>Columnas obligatorias (en este orden):</strong></p>
            <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
              <li><code>ci</code> - Cédula de identidad (texto, máximo 15 caracteres)</li>
              <li><code>nombre</code> - Nombre (texto, máximo 50 caracteres)</li>
              <li><code>apellido_p</code> - Apellido paterno (texto, máximo 50 caracteres)</li>
              <li><code>apellido_m</code> - Apellido materno (texto opcional, máximo 50 caracteres)</li>
              <li><code>sexo</code> - Sexo (M o F)</li>
              <li><code>estado</code> - Estado civil (SOLTERO, CASADO, DIVORCIADO, VIUDO, OTRO)</li>
              <li><code>telefono</code> - Teléfono (texto opcional, máximo 15 caracteres)</li>
              <li><code>username</code> - Nombre de usuario (texto, máximo 50 caracteres)</li>
              <li><code>email</code> - Correo electrónico (email válido, máximo 320 caracteres)</li>
              <li><code>contrasena</code> - Contraseña (texto, mínimo 8 caracteres)</li>
              <li><code>id_rol</code> - ID del rol (número opcional)</li>
              <li><code>codigo_docente</code> - Código de docente (texto opcional, máximo 20 caracteres)</li>
            </ul>
            <p><strong>Nota:</strong> La primera fila debe contener los nombres de las columnas.</p>
          </div>
        </div>

        {error && <div className="error-box">{error}</div>}

        <div className="modal-buttons">
          <button 
            className="btn-confirm" 
            onClick={handleSubmit} 
            disabled={loading || !file}
          >
            {loading ? 'Importando...' : 'Importar Usuarios'}
          </button>
          <button 
            className="btn-cancel" 
            onClick={onClose} 
            disabled={loading}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// --------------------- Modal Añadir/Editar Usuario ---------------------
function AddEditUsuarioModal({ 
  title, 
  form, 
  setForm, 
  roles, 
  rolesSearch, 
  setRolesSearch, 
  onConfirm, 
  onCancel, 
  loading, 
  error,
  isDocente,
  docenteInfo,
  onRemoveDocente
}) {
  const filteredRoles = roles.filter(r => r.nombre.toLowerCase().includes(rolesSearch.toLowerCase()));
  const handleInputChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleSelectRole = (roleId) => setForm(prev => ({ ...prev, id_rol: roleId }));

  return (
    <div className="modal-backdrop">
      <div className="modal-card" style={{ maxHeight: '80vh', overflowY: 'auto', width: '90%', maxWidth: 600 }}>
        <h3>{title}</h3>
        
        {/* Información de Docente */}
        {isDocente && (
          <div style={{
            background: '#e8f4fd',
            border: '1px solid #b8daff',
            borderRadius: '4px',
            padding: '10px',
            marginBottom: '15px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ color: '#004085' }}>👨‍🏫 Este usuario es DOCENTE</strong>
              <button 
                type="button"
                className="btn-delete"
                onClick={onRemoveDocente}
                style={{ padding: '5px 10px', fontSize: '12px' }}
              >
                Ya no soy docente
              </button>
            </div>
            {docenteInfo && (
              <div style={{ marginTop: '8px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Código de docente:
                </label>
                <input 
                  name="codigo_docente"
                  placeholder="Código de docente"
                  maxLength={20}
                  value={form.codigo_docente || ''}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '8px' }}
                />
                <small style={{ color: '#666', display: 'block', marginTop: '4px' }}>
                  Código actual: <strong>{docenteInfo.codigo}</strong>
                </small>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
          <input name="ci" placeholder="CI" maxLength={15} value={form.ci} onChange={handleInputChange} disabled={title === 'Editar Usuario'} />
          <input name="nombre" placeholder="Nombre" value={form.nombre} onChange={handleInputChange} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
          <input name="apellido_p" placeholder="Apellido Paterno" value={form.apellido_p} onChange={handleInputChange} />
          <input name="apellido_m" placeholder="Apellido Materno" value={form.apellido_m} onChange={handleInputChange} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
          <select name="sexo" value={form.sexo} onChange={handleInputChange}>
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
          </select>
          <select name="estado" value={form.estado} onChange={handleInputChange}>
            <option value="SOLTERO">Soltero</option>
            <option value="CASADO">Casado</option>
            <option value="DIVORCIADO">Divorciado</option>
            <option value="VIUDO">Viudo</option>
            <option value="OTRO">Otro</option>
          </select>
        </div>

        <input name="telefono" placeholder="Teléfono" value={form.telefono} onChange={handleInputChange} style={{ marginBottom: '10px' }} />
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
          <input name="username" placeholder="Username" value={form.username} onChange={handleInputChange} />
          <input name="email" placeholder="Email" value={form.email} onChange={handleInputChange} />
        </div>

        {title === 'Añadir Usuario' && (
          <input name="contrasena" type="password" placeholder="Contraseña" value={form.contrasena} onChange={handleInputChange} style={{ marginBottom: '10px' }} />
        )}

        <input type="text" placeholder="Buscar rol..." value={rolesSearch} onChange={(e) => setRolesSearch(e.target.value)} style={{ marginBottom: '10px' }} />
        <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 12 }}>
          <table className="permiso-table">
            <tbody>
              {filteredRoles.map(r => (
                <tr key={r.id}>
                  <td>{r.nombre}</td>
                  <td><input type="radio" checked={form.id_rol === r.id} onChange={() => handleSelectRole(r.id)} /></td>
                </tr>
              ))}
              {filteredRoles.length === 0 && (
                <tr><td colSpan={2} style={{ textAlign: 'center', color: '#777' }}>No se encontraron roles.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {error && <div className="error-box">{error}</div>}
        <div className="modal-buttons">
          <button className="btn-confirm" onClick={onConfirm} disabled={loading}>
            {loading ? 'Guardando...' : 'Confirmar'}
          </button>
          <button className="btn-cancel" onClick={onCancel} disabled={loading}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// --------------------- Modal Añadir Docente ---------------------
function AddDocenteModal({ onClose, onSelectExisting, onSelectNew }) {
  return (
    <div className="modal-backdrop">
      <div className="modal-card" style={{ maxWidth: 400, position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 8, right: 10, background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>❌</button>
        <h3>Añadir Docente</h3>
        <p>Seleccione una opción:</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button className="btn-primary" onClick={onSelectExisting}>👤 Usuario existente</button>
          <button className="btn-secondary" onClick={onSelectNew}>🆕 Nuevo usuario</button>
        </div>
      </div>
    </div>
  );
}

// --------------------- Modal Asignar Docente Existente ---------------------
function AssignExistingDocenteModal({ onClose, onSuccess }) {
  const [codigo, setCodigo] = useState('');
  const [search, setSearch] = useState('');
  const [usuarios, setUsuarios] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const data = await usuarioAPI.getAll();
      const docentes = await docenteAPI.getAll();
      const docentesIds = new Set(docentes.map(d => d.id_usuario));
      const disponibles = data.filter(u => !docentesIds.has(u.id));
      setUsuarios(disponibles);
    } catch {
      setError('Error al cargar usuarios disponibles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsuarios(); }, []);

  const filteredUsuarios = usuarios.filter(u =>
    u.nombre.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  const handleConfirm = async () => {
    if (!codigo || !selectedId) {
      setError('Debe ingresar un código y seleccionar un usuario.');
      return;
    }
    try {
      setLoading(true);
      await docenteAPI.assignToExistingUser({ id_usuario: selectedId, codigo });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Error al asignar docente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card" style={{ width: '90%', maxWidth: 700 }}>
        <h3>Asignar Docente a Usuario Existente</h3>
        <label>Código docente (máx. 20 caracteres):</label>
        <input type="text" maxLength={20} value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Ej: DOC-2025-01" />
        <label>Buscar usuario:</label>
        <input type="text" maxLength={50} placeholder="Buscar por nombre o username..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <div style={{ maxHeight: 250, overflowY: 'auto', marginTop: 8 }}>
          <table className="permiso-table">
            <thead><tr><th>Nombre</th><th>Seleccionar</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="2">Cargando...</td></tr> :
                filteredUsuarios.length > 0 ? filteredUsuarios.map(u => (
                  <tr key={u.id}>
                    <td>{`${u.nombre} ${u.apellido_p} ${u.apellido_m || ''}`}</td>
                    <td><input type="radio" checked={selectedId === u.id} onChange={() => setSelectedId(u.id)} /></td>
                  </tr>
                )) :
                <tr><td colSpan="2" style={{ textAlign: 'center', color: '#777' }}>No hay usuarios disponibles.</td></tr>}
            </tbody>
          </table>
        </div>
        {error && <div className="error-box">{error}</div>}
        <div className="modal-buttons">
          <button className="btn-confirm" onClick={handleConfirm} disabled={loading}>{loading ? 'Asignando...' : 'Confirmar'}</button>
          <button className="btn-cancel" onClick={onClose} disabled={loading}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// --------------------- Modal Crear Docente desde cero ---------------------
function AddDocenteFromScratchModal({ onClose, onSuccess, roles }) {
  const [form, setForm] = useState({
    ci: '', nombre: '', apellido_p: '', apellido_m: '',
    sexo: 'M', estado: 'SOLTERO', telefono: '',
    username: '', email: '', contrasena: '',
    codigo: '', id_rol: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Asignar automáticamente el rol "DOCENTE"
  useEffect(() => {
    const rolDocente = roles.find(r => r.nombre?.toUpperCase() === 'DOCENTE');
    if (rolDocente) setForm(prev => ({ ...prev, id_rol: rolDocente.id }));
  }, [roles]);

  const handleInputChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleConfirm = async () => {
    if (!form.ci || !form.nombre || !form.apellido_p || !form.username ||
        !form.email || !form.contrasena || !form.codigo) {
      setError('Por favor complete todos los campos obligatorios.');
      return;
    }

    setLoading(true);
    try {
      await docenteAPI.storeFromScratch({
        ...form,
        apellido_m: form.apellido_m || null,
        telefono: form.telefono || null,
      });
      onSuccess();
    } catch (err) {
      setError(err.message || 'Error al crear docente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card" style={{ maxHeight: '80vh', overflowY: 'auto', width: '90%', maxWidth: 600 }}>
        <h3>Crear Nuevo Docente</h3>
        <input name="ci" placeholder="CI" maxLength={15} value={form.ci} onChange={handleInputChange} />
        <input name="nombre" placeholder="Nombre" value={form.nombre} onChange={handleInputChange} />
        <input name="apellido_p" placeholder="Apellido Paterno" value={form.apellido_p} onChange={handleInputChange} />
        <input name="apellido_m" placeholder="Apellido Materno" value={form.apellido_m} onChange={handleInputChange} />
        <select name="sexo" value={form.sexo} onChange={handleInputChange}>
          <option value="M">Masculino</option>
          <option value="F">Femenino</option>
        </select>
        <select name="estado" value={form.estado} onChange={handleInputChange}>
          <option value="SOLTERO">Soltero</option>
          <option value="CASADO">Casado</option>
          <option value="DIVORCIADO">Divorciado</option>
          <option value="VIUDO">Viudo</option>
          <option value="OTRO">Otro</option>
        </select>
        <input name="telefono" placeholder="Teléfono" value={form.telefono} onChange={handleInputChange} />
        <input name="username" placeholder="Username" value={form.username} onChange={handleInputChange} />
        <input name="email" placeholder="Email" value={form.email} onChange={handleInputChange} />
        <input name="contrasena" type="password" placeholder="Contraseña" value={form.contrasena} onChange={handleInputChange} />
        <input name="codigo" placeholder="Código Docente (máx. 20 caracteres)" maxLength={20} value={form.codigo} onChange={handleInputChange} />

        {error && <div className="error-box">{error}</div>}

        <div className="modal-buttons">
          <button className="btn-confirm" onClick={handleConfirm} disabled={loading}>
            {loading ? 'Guardando...' : 'Confirmar'}
          </button>
          <button className="btn-cancel" onClick={onClose} disabled={loading}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}