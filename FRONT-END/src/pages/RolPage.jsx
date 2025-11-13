import React, { useEffect, useState } from 'react';
import { rolAPI, permisoAPI } from '../api/api';
import '../styles/Dashboard.css';

const PAGE_SIZE = 5;

export default function RolPage() {
  const [roles, setRoles] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [errorMsg, setErrorMsg] = useState('');

  // Modal estados
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [selectedRole, setSelectedRole] = useState(null);
  const [nombre, setNombre] = useState('');
  const [modalError, setModalError] = useState('');
  const [loadingModal, setLoadingModal] = useState(false);

  const [permisos, setPermisos] = useState([]);
  const [permisosFilter, setPermisosFilter] = useState('');
  const [permisosSearch, setPermisosSearch] = useState([]);

  // Modal eliminar
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // ---------------- Fetch roles ----------------
  const fetchRoles = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await rolAPI.getAll();
      setRoles(data);
    } catch (err) {
      setErrorMsg(err.message || 'Error al obtener roles');
    } finally {
      setLoading(false);
    }
  };

  // ---------------- Fetch permisos ----------------
  const fetchPermisos = async () => {
    try {
      const data = await permisoAPI.getAll();
      const permisosData = data.map(p => ({ ...p, selected: false }));
      setPermisos(permisosData);
      setPermisosSearch(permisosData);
    } catch (err) {
      console.error('Error al cargar permisos', err);
      setPermisos([]);
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchPermisos();
  }, []);

  // ---------------- Filtrado roles y paginación ----------------
  const filteredRoles = roles.filter(r =>
    r.nombre.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filteredRoles.length / PAGE_SIZE);
  const displayedRoles = filteredRoles.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // ---------------- Abrir modal añadir/editar ----------------
  const openModal = async (mode, role = null) => {
    setModalMode(mode);
    setSelectedRole(role);
    setNombre(role?.nombre || '');
    setModalError('');
    setPermisosFilter('');

    const permisosData = permisos.map(p => ({ ...p, selected: false }));

    if (mode === 'edit' && role) {
      try {
        const permisosAsignados = await rolAPI.getPermisos(role.id);
        permisosData.forEach(p => {
          if (permisosAsignados.some(pa => pa.id === p.id)) {
            p.selected = true;
          }
        });
      } catch (err) {
        console.error('Error al cargar permisos del rol', err);
      }
    }

    setPermisosSearch(permisosData);
    setPermisos(permisosData);
    setShowModal(true);
  };

  // ---------------- Toggle permisos ----------------
  const handleTogglePermiso = (permisoId) => {
    setPermisosSearch(prev =>
      prev.map(p => (p.id === permisoId ? { ...p, selected: !p.selected } : p))
    );
  };

  // ---------------- Confirmar modal añadir/editar ----------------
  const handleConfirmModal = async () => {
    if (!nombre.trim()) {
      setModalError('El nombre del rol es obligatorio.');
      return;
    }

    setLoadingModal(true);
    setModalError('');

    try {
      let rolId;

      if (modalMode === 'add') {
        const res = await rolAPI.create({ nombre: nombre.trim() });
        rolId = res.id || null;
      } else {
        rolId = selectedRole.id;
        await rolAPI.update(rolId, { nombre: nombre.trim() });
      }

      if (!rolId) throw new Error('No se obtuvo ID del rol');

      // ---------------- Sincronizar permisos ----------------
      const permisosSeleccionados = permisosSearch.filter(p => p.selected).map(p => p.id);
      const permisosActuales = (await rolAPI.getPermisos(rolId)).map(p => p.id);

      // Asignar permisos nuevos
      for (let idPermiso of permisosSeleccionados) {
        if (!permisosActuales.includes(idPermiso)) {
          await rolAPI.assignPermiso(rolId, idPermiso);
        }
      }

      // Eliminar permisos desmarcados usando la nueva ruta
      for (let idPermiso of permisosActuales) {
        if (!permisosSeleccionados.includes(idPermiso)) {
          await rolAPI.removePermiso(rolId, idPermiso);
        }
      }

      setShowModal(false);
      fetchRoles();
    } catch (err) {
      setModalError(err.message || 'Error en el servidor');
    } finally {
      setLoadingModal(false);
    }
  };

  // ---------------- Abrir modal eliminar ----------------
  const openDeleteModal = (role) => {
    setSelectedRole(role);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    setLoadingModal(true);
    setModalError('');
    try {
      await rolAPI.remove(selectedRole.id);
      setShowDeleteModal(false);
      fetchRoles();
    } catch (err) {
      setModalError(err.message || 'Error al eliminar rol');
    } finally {
      setLoadingModal(false);
    }
  };

  // ---------------- Filtrado permisos en modal ----------------
  useEffect(() => {
    setPermisosSearch(
      permisos.filter(p =>
        p.nombre.toLowerCase().includes(permisosFilter.toLowerCase())
      )
    );
  }, [permisosFilter, permisos]);

  return (
    <div className="rol-page">
      <h2>Gestionar Rol</h2>

      <div className="permiso-header">
        <button className="btn-primary" onClick={() => openModal('add')}>+ Añadir Rol</button>
        <input
          type="text"
          placeholder="Buscar rol..."
          maxLength={100}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
        />
      </div>

      {errorMsg && <div className="error-box" style={{ marginBottom: 10 }}>{errorMsg}</div>}

      {loading ? (
        <p>Cargando roles...</p>
      ) : (
        <table className="permiso-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {displayedRoles.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.nombre}</td>
                <td>
                  <button className="btn-edit" style={{ marginRight: 6 }} onClick={() => openModal('edit', r)}>Editar</button>
                  <button className="btn-delete" onClick={() => openDeleteModal(r)}>Eliminar</button>
                </td>
              </tr>
            ))}
            {displayedRoles.length === 0 && (
              <tr>
                <td colSpan="3" style={{ textAlign: 'center', color: '#777' }}>
                  No se encontraron roles.
                </td>
              </tr>
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

      {/* ---------------- Modal Añadir / Editar ---------------- */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ width: '90%', maxWidth: 500, maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3>{modalMode === 'add' ? 'Añadir Rol' : 'Editar Rol'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', fontSize: 22, cursor: 'pointer', color: '#555' }}>×</button>
            </div>

            <input
              type="text"
              placeholder="Nombre del rol"
              maxLength={50}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              style={{ marginBottom: 12, padding: 8, width: '100%', borderRadius: 6, border: '1px solid #ccc' }}
            />

            <input
              type="text"
              placeholder="Buscar permisos..."
              maxLength={100}
              value={permisosFilter}
              onChange={(e) => setPermisosFilter(e.target.value)}
              style={{ marginBottom: 12, padding: 8, width: '100%', borderRadius: 6, border: '1px solid #ccc' }}
            />

            <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #eee', padding: 8, borderRadius: 6, marginBottom: 12 }}>
              <table style={{ width: '100%' }}>
                <tbody>
                  {permisosSearch.map(p => (
                    <tr key={p.id}>
                      <td>{p.nombre}</td>
                      <td style={{ textAlign: 'right' }}>
                        <input
                          type="checkbox"
                          checked={p.selected || false}
                          onChange={() => handleTogglePermiso(p.id)}
                        />
                      </td>
                    </tr>
                  ))}
                  {permisosSearch.length === 0 && (
                    <tr>
                      <td colSpan={2} style={{ textAlign: 'center', color: '#777' }}>
                        No se encontraron permisos.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {modalError && (
              <div className="error-box" style={{ marginBottom: 10 }}>{modalError}</div>
            )}

            <div className="modal-buttons">
              <button className="btn-confirm" onClick={handleConfirmModal} disabled={loadingModal}>
                {loadingModal ? 'Guardando...' : 'Confirmar'}
              </button>
              <button className="btn-cancel" onClick={() => setShowModal(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- Modal Eliminar ---------------- */}
      {showDeleteModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ width: '90%', maxWidth: 400 }}>
            <h3>Confirmar eliminación</h3>
            <p>¿Deseas eliminar el rol <strong>{selectedRole?.nombre}</strong>?</p>

            {modalError && (
              <div className="error-box" style={{ marginBottom: 10 }}>{modalError}</div>
            )}

            <div className="modal-buttons">
              <button className="btn-delete" onClick={handleDelete} disabled={loadingModal}>
                {loadingModal ? 'Eliminando...' : 'Confirmar'}
              </button>
              <button className="btn-cancel" onClick={() => setShowDeleteModal(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
