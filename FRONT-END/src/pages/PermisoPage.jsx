import React, { useEffect, useState } from 'react';
import { permisoAPI } from '../api/api';
import '../styles/Dashboard.css';

const PAGE_SIZE = 5;

export default function PermisoPage() {
  const [permisos, setPermisos] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedPermiso, setSelectedPermiso] = useState(null);
  const [nombre, setNombre] = useState('');
  const [modalError, setModalError] = useState('');

  // Obtener permisos
  const fetchPermisos = async () => {
    setLoading(true);
    setGlobalError('');
    try {
      const data = await permisoAPI.getAll();
      setPermisos(data);
    } catch (err) {
      setGlobalError(err.message || 'Error al cargar permisos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermisos();
  }, []);

  // Filtrado y paginación
  const filtered = permisos.filter(p =>
    p.nombre.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const displayed = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Abrir modal de crear
  const openAddModal = () => {
    setEditMode(false);
    setNombre('');
    setModalError('');
    setShowModal(true);
  };

  // Abrir modal de editar
  const openEditModal = (permiso) => {
    setEditMode(true);
    setSelectedPermiso(permiso);
    setNombre(permiso.nombre);
    setModalError('');
    setShowModal(true);
  };

  // Guardar nuevo o editado
  const handleSave = async () => {
    if (!nombre.trim()) {
      setModalError('El campo nombre es obligatorio.');
      return;
    }

    if (nombre.length > 50) {
      setModalError('El nombre no puede exceder los 50 caracteres.');
      return;
    }

    setLoading(true);
    setModalError('');

    try {
      if (editMode) {
        await permisoAPI.update(selectedPermiso.id, nombre.trim());
      } else {
        await permisoAPI.create(nombre.trim());
      }
      setShowModal(false);
      fetchPermisos();
    } catch (err) {
      setModalError(err.message || 'Error en el servidor');
    } finally {
      setLoading(false);
    }
  };

  // Abrir modal eliminar
  const openDeleteModal = (permiso) => {
    setSelectedPermiso(permiso);
    setModalError('');
    setShowDeleteModal(true);
  };

  // Confirmar eliminar
  const handleDelete = async () => {
    setLoading(true);
    setModalError('');
    try {
      await permisoAPI.remove(selectedPermiso.id);
      setShowDeleteModal(false);
      fetchPermisos();
    } catch (err) {
      setModalError(err.message || 'Error al eliminar permiso');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="permiso-page">
      <h2>Gestionar Permiso</h2>

      <div className="permiso-header">
        <button className="btn-primary" onClick={openAddModal}>+ Añadir Permiso</button>
        <input
          type="text"
          placeholder="Buscar permiso..."
          maxLength={100}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
        />
      </div>

      {globalError && <div className="error-box" style={{ marginBottom: 10 }}>{globalError}</div>}

      {loading ? (
        <p>Cargando...</p>
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
            {displayed.map((permiso) => (
              <tr key={permiso.id}>
                <td>{permiso.id}</td>
                <td>{permiso.nombre}</td>
                <td>
                  <button className="btn-edit" onClick={() => openEditModal(permiso)}>Editar</button>
                  <button className="btn-delete" onClick={() => openDeleteModal(permiso)}>Eliminar</button>
                </td>
              </tr>
            ))}
            {displayed.length === 0 && (
              <tr><td colSpan="3" style={{ textAlign: 'center', color: '#777' }}>No se encontraron resultados.</td></tr>
            )}
          </tbody>
        </table>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>◀️</button>
          <span>Página {currentPage} de {totalPages}</span>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>▶️</button>
        </div>
      )}

      {/* Modal de Crear/Editar */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3>{editMode ? 'Editar Permiso' : 'Añadir Permiso'}</h3>
            <input
              type="text"
              placeholder="Nombre del permiso"
              maxLength={50}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
            {modalError && (
              <div className="error-box" style={{ marginBottom: 10, fontSize: 13 }}>
                ⚠️ {modalError}
              </div>
            )}
            <div className="modal-buttons">
              <button className="btn-confirm" onClick={handleSave} disabled={loading}>
                {loading ? 'Guardando...' : 'Confirmar'}
              </button>
              <button className="btn-cancel" onClick={() => setShowModal(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de eliminar */}
      {showDeleteModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3>Confirmar eliminación</h3>
            <p>¿Seguro que deseas eliminar el permiso <strong>{selectedPermiso?.nombre}</strong>?</p>
            {modalError && (
              <div className="error-box" style={{ marginBottom: 10, fontSize: 13 }}>
                ⚠️ {modalError}
              </div>
            )}
            <div className="modal-buttons">
              <button className="btn-delete" onClick={handleDelete} disabled={loading}>
                {loading ? 'Eliminando...' : 'Confirmar'}
              </button>
              <button className="btn-cancel" onClick={() => setShowDeleteModal(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
