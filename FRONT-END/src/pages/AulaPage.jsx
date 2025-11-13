import React, { useEffect, useState } from 'react';
import { aulaAPI, tipoAulaAPI } from '../api/api';
import '../styles/Dashboard.css';

const PAGE_SIZE = 5;

export default function AulaPage() {
  const [aulas, setAulas] = useState([]);
  const [tiposAula, setTiposAula] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Estados para modales
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddTipoModal, setShowAddTipoModal] = useState(false);
  const [selectedAula, setSelectedAula] = useState(null);
  const [modalError, setModalError] = useState('');
  const [loadingModal, setLoadingModal] = useState(false);

  // Estados para los formularios
  const [aulaForm, setAulaForm] = useState({
    nro: '',
    piso: '',
    capacidad: '',
    descripcion: '',
    estado: 'DISPONIBLE',
    id_tipo: null
  });

  const [editForm, setEditForm] = useState({
    nro: '',
    piso: '',
    capacidad: '',
    descripcion: '',
    estado: 'DISPONIBLE',
    id_tipo: null
  });

  const [tipoForm, setTipoForm] = useState({
    nombre: ''
  });

  // ------------------ Fetch aulas y tipos ------------------
  const fetchAulas = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await aulaAPI.getAll();
      setAulas(data);
    } catch (err) {
      setErrorMsg(err.message || 'Error al obtener aulas');
    } finally {
      setLoading(false);
    }
  };

  const fetchTiposAula = async () => {
    try {
      const data = await tipoAulaAPI.getAll();
      setTiposAula(data);
    } catch (err) {
      console.error('Error al cargar tipos de aula', err);
    }
  };

  useEffect(() => { 
    fetchAulas();
    fetchTiposAula();
  }, []);

  // ------------------ Filtros y paginación ------------------
  const filteredAulas = aulas.filter(a =>
    a.nro?.toString().includes(search.toLowerCase()) ||
    a.descripcion?.toLowerCase().includes(search.toLowerCase()) ||
    a.tipo_nombre?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredAulas.length / PAGE_SIZE);
  const displayedAulas = filteredAulas.slice(
    (currentPage - 1) * PAGE_SIZE, 
    currentPage * PAGE_SIZE
  );

  // ------------------ Handlers para modales ------------------
  const openAddModal = () => {
    setAulaForm({
      nro: '',
      piso: '',
      capacidad: '',
      descripcion: '',
      estado: 'DISPONIBLE',
      id_tipo: null
    });
    setModalError('');
    setShowAddModal(true);
  };

  const openEditModal = (aula) => {
    setSelectedAula(aula);
    setEditForm({
      nro: aula.nro.toString(),
      piso: aula.piso.toString(),
      capacidad: aula.capacidad ? aula.capacidad.toString() : '',
      descripcion: aula.descripcion || '',
      estado: aula.estado,
      id_tipo: aula.id_tipo
    });
    setModalError('');
    setShowEditModal(true);
  };

  const openDeleteModal = (aula) => {
    setSelectedAula(aula);
    setModalError('');
    setShowDeleteModal(true);
  };

  const openAddTipoModal = () => {
    setTipoForm({ nombre: '' });
    setModalError('');
    setShowAddTipoModal(true);
  };

  // ------------------ Handlers para inputs ------------------
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAulaForm(prev => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleTipoInputChange = (e) => {
    const { name, value } = e.target;
    setTipoForm(prev => ({ ...prev, [name]: value }));
  };

  // ------------------ Crear nueva aula ------------------
  const handleConfirmAdd = async () => {
    if (!aulaForm.nro || !aulaForm.piso) {
      setModalError('Por favor complete los campos obligatorios: Número y Piso.');
      return;
    }

    const nro = parseInt(aulaForm.nro);
    const piso = parseInt(aulaForm.piso);
    const capacidad = aulaForm.capacidad ? parseInt(aulaForm.capacidad) : null;

    if (isNaN(nro) || nro < 0) {
      setModalError('El número de aula debe ser un número válido.');
      return;
    }

    if (isNaN(piso) || piso < 0) {
      setModalError('El piso debe ser un número válido.');
      return;
    }

    if (capacidad !== null && (isNaN(capacidad) || capacidad < 0)) {
      setModalError('La capacidad debe ser un número mayor o igual a 0.');
      return;
    }

    setLoadingModal(true);
    setModalError('');

    try {
      await aulaAPI.create({
        nro: nro,
        piso: piso,
        capacidad: capacidad,
        descripcion: aulaForm.descripcion || null,
        estado: aulaForm.estado,
        id_tipo: aulaForm.id_tipo || null
      });

      setShowAddModal(false);
      fetchAulas();
    } catch (err) {
      setModalError(err.message || 'Error al crear el aula');
    } finally {
      setLoadingModal(false);
    }
  };

  // ------------------ Editar aula ------------------
  const handleConfirmEdit = async () => {
    if (!editForm.nro || !editForm.piso) {
      setModalError('Por favor complete los campos obligatorios: Número y Piso.');
      return;
    }

    const nro = parseInt(editForm.nro);
    const piso = parseInt(editForm.piso);
    const capacidad = editForm.capacidad ? parseInt(editForm.capacidad) : null;

    if (isNaN(nro) || nro < 0) {
      setModalError('El número de aula debe ser un número válido.');
      return;
    }

    if (isNaN(piso) || piso < 0) {
      setModalError('El piso debe ser un número válido.');
      return;
    }

    if (capacidad !== null && (isNaN(capacidad) || capacidad < 0)) {
      setModalError('La capacidad debe ser un número mayor o igual a 0.');
      return;
    }

    setLoadingModal(true);
    setModalError('');

    try {
      await aulaAPI.update(selectedAula.nro, {
        nro: nro,
        piso: piso,
        capacidad: capacidad,
        descripcion: editForm.descripcion || null,
        estado: editForm.estado,
        id_tipo: editForm.id_tipo || null
      });

      setShowEditModal(false);
      fetchAulas();
    } catch (err) {
      setModalError(err.message || 'Error al actualizar el aula');
    } finally {
      setLoadingModal(false);
    }
  };

  // ------------------ Eliminar aula ------------------
  const handleConfirmDelete = async () => {
    setLoadingModal(true);
    setModalError('');

    try {
      await aulaAPI.remove(selectedAula.nro);
      setShowDeleteModal(false);
      fetchAulas();
    } catch (err) {
      setModalError(err.message || 'Error al eliminar el aula');
    } finally {
      setLoadingModal(false);
    }
  };

  // ------------------ Crear tipo de aula ------------------
  const handleConfirmAddTipo = async () => {
    if (!tipoForm.nombre) {
      setModalError('Por favor ingrese el nombre del tipo de aula.');
      return;
    }

    if (tipoForm.nombre.length > 50) {
      setModalError('El nombre no puede tener más de 50 caracteres.');
      return;
    }

    setLoadingModal(true);
    setModalError('');

    try {
      await tipoAulaAPI.create(tipoForm.nombre);
      setShowAddTipoModal(false);
      fetchTiposAula(); // Recargar los tipos
    } catch (err) {
      setModalError(err.message || 'Error al crear el tipo de aula');
    } finally {
      setLoadingModal(false);
    }
  };

  // ------------------ Render principal ------------------
  return (
    <div className="permiso-page">
      <h2>Gestionar Aulas</h2>

      <div className="permiso-header">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={openAddModal}>
            + Añadir Aula
          </button>
          <button className="btn-secondary" onClick={openAddTipoModal}>
            + Añadir Tipo de Aula
          </button>
        </div>
        <input
          type="text"
          placeholder="Buscar por número, descripción o tipo..."
          maxLength={100}
          value={search}
          onChange={(e) => { 
            setSearch(e.target.value); 
            setCurrentPage(1); 
          }}
        />
      </div>

      {errorMsg && <div className="error-box">{errorMsg}</div>}

      {loading ? (
        <p>Cargando aulas...</p>
      ) : (
        <table className="permiso-table">
          <thead>
            <tr>
              <th>Número</th>
              <th>Piso</th>
              <th>Capacidad</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {displayedAulas.map(aula => (
              <tr key={aula.nro}>
                <td>
                  <strong>{aula.nro}</strong>
                </td>
                <td>{aula.piso}</td>
                <td>
                  {aula.capacidad || (
                    <span style={{ color: '#777', fontStyle: 'italic' }}>
                      Sin definir
                    </span>
                  )}
                </td>
                <td>
                  {aula.tipo_nombre || (
                    <span style={{ color: '#777', fontStyle: 'italic' }}>
                      Sin tipo
                    </span>
                  )}
                </td>
                <td>
                  <span style={{ 
                    background: aula.estado === 'DISPONIBLE' ? '#d4edda' : '#f8d7da', 
                    color: aula.estado === 'DISPONIBLE' ? '#155724' : '#721c24',
                    padding: '4px 8px', 
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    fontSize: '12px'
                  }}>
                    {aula.estado}
                  </span>
                </td>
                <td>
                  <button 
                    className="btn-edit" 
                    onClick={() => openEditModal(aula)}
                  >
                    Editar
                  </button>
                  <button 
                    className="btn-delete" 
                    onClick={() => openDeleteModal(aula)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {displayedAulas.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', color: '#777' }}>
                  {search ? 'No se encontraron aulas que coincidan con la búsqueda.' : 'No hay aulas registradas.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button 
            disabled={currentPage === 1} 
            onClick={() => setCurrentPage(p => p - 1)}
          >
            ◀️
          </button>
          <span>Página {currentPage} de {totalPages}</span>
          <button 
            disabled={currentPage === totalPages} 
            onClick={() => setCurrentPage(p => p + 1)}
          >
            ▶️
          </button>
        </div>
      )}

      {/* ---------- MODALES ---------- */}
      
      {/* Modal Añadir Aula */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 500 }}>
            <h3>Añadir Nueva Aula</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                  Número de Aula *
                </label>
                <input
                  type="number"
                  name="nro"
                  placeholder="Ej: 101"
                  min="0"
                  value={aulaForm.nro}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '8px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                  Piso *
                </label>
                <input
                  type="number"
                  name="piso"
                  placeholder="Ej: 1"
                  min="0"
                  value={aulaForm.piso}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '8px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                  Capacidad
                </label>
                <input
                  type="number"
                  name="capacidad"
                  placeholder="Ej: 30"
                  min="0"
                  value={aulaForm.capacidad}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '8px' }}
                />
                <small style={{ color: '#666' }}>Número mayor o igual a 0 (opcional)</small>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                  Descripción
                </label>
                <textarea
                  name="descripcion"
                  placeholder="Descripción opcional del aula..."
                  rows={3}
                  value={aulaForm.descripcion}
                  onChange={handleInputChange}
                  style={{ 
                    width: '100%', 
                    padding: '8px',
                    resize: 'vertical',
                    minHeight: '60px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                  Estado *
                </label>
                <select
                  name="estado"
                  value={aulaForm.estado}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '8px' }}
                >
                  <option value="DISPONIBLE">DISPONIBLE</option>
                  <option value="NO DISPONIBLE">NO DISPONIBLE</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                  Tipo de Aula
                </label>
                <select
                  name="id_tipo"
                  value={aulaForm.id_tipo || ''}
                  onChange={(e) => setAulaForm(prev => ({ 
                    ...prev, 
                    id_tipo: e.target.value ? parseInt(e.target.value) : null 
                  }))}
                  style={{ width: '100%', padding: '8px' }}
                >
                  <option value="">-- Ninguno --</option>
                  {tiposAula.map(tipo => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {modalError && (
              <div className="error-box" style={{ marginBottom: '15px' }}>
                {modalError}
              </div>
            )}

            <div className="modal-buttons">
              <button 
                className="btn-confirm" 
                onClick={handleConfirmAdd}
                disabled={loadingModal}
              >
                {loadingModal ? 'Creando...' : 'Confirmar'}
              </button>
              <button 
                className="btn-cancel" 
                onClick={() => setShowAddModal(false)}
                disabled={loadingModal}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Aula */}
      {showEditModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 500 }}>
            <h3>Editar Aula</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                  Número de Aula *
                </label>
                <input
                  type="number"
                  name="nro"
                  placeholder="Ej: 101"
                  min="0"
                  value={editForm.nro}
                  onChange={handleEditInputChange}
                  style={{ width: '100%', padding: '8px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                  Piso *
                </label>
                <input
                  type="number"
                  name="piso"
                  placeholder="Ej: 1"
                  min="0"
                  value={editForm.piso}
                  onChange={handleEditInputChange}
                  style={{ width: '100%', padding: '8px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                  Capacidad
                </label>
                <input
                  type="number"
                  name="capacidad"
                  placeholder="Ej: 30"
                  min="0"
                  value={editForm.capacidad}
                  onChange={handleEditInputChange}
                  style={{ width: '100%', padding: '8px' }}
                />
                <small style={{ color: '#666' }}>Número mayor o igual a 0 (opcional)</small>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                  Descripción
                </label>
                <textarea
                  name="descripcion"
                  placeholder="Descripción opcional del aula..."
                  rows={3}
                  value={editForm.descripcion}
                  onChange={handleEditInputChange}
                  style={{ 
                    width: '100%', 
                    padding: '8px',
                    resize: 'vertical',
                    minHeight: '60px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                  Estado *
                </label>
                <select
                  name="estado"
                  value={editForm.estado}
                  onChange={handleEditInputChange}
                  style={{ width: '100%', padding: '8px' }}
                >
                  <option value="DISPONIBLE">DISPONIBLE</option>
                  <option value="NO DISPONIBLE">NO DISPONIBLE</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                  Tipo de Aula
                </label>
                <select
                  name="id_tipo"
                  value={editForm.id_tipo || ''}
                  onChange={(e) => setEditForm(prev => ({ 
                    ...prev, 
                    id_tipo: e.target.value ? parseInt(e.target.value) : null 
                  }))}
                  style={{ width: '100%', padding: '8px' }}
                >
                  <option value="">-- Ninguno --</option>
                  {tiposAula.map(tipo => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {modalError && (
              <div className="error-box" style={{ marginBottom: '15px' }}>
                {modalError}
              </div>
            )}

            <div className="modal-buttons">
              <button 
                className="btn-confirm" 
                onClick={handleConfirmEdit}
                disabled={loadingModal}
              >
                {loadingModal ? 'Actualizando...' : 'Confirmar'}
              </button>
              <button 
                className="btn-cancel" 
                onClick={() => setShowEditModal(false)}
                disabled={loadingModal}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Eliminar Aula */}
      {showDeleteModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 450 }}>
            <h3>Confirmar Eliminación</h3>
            
            <div style={{ 
              backgroundColor: '#f8d7da', 
              padding: '15px', 
              borderRadius: '4px', 
              marginBottom: '15px' 
            }}>
              <p style={{ margin: 0, fontWeight: 'bold', color: '#721c24' }}>
                ⚠️ Esta acción no se puede deshacer
              </p>
            </div>
            
            <p>
              ¿Está seguro que desea eliminar el aula número{' '}
              <strong>{selectedAula?.nro}</strong>?
            </p>
            
            <p style={{ color: '#666', fontSize: '14px' }}>
              Se eliminarán todos los datos asociados a esta aula.
            </p>

            {modalError && (
              <div className="error-box" style={{ marginBottom: '15px' }}>
                {modalError}
              </div>
            )}

            <div className="modal-buttons">
              <button 
                className="btn-delete" 
                onClick={handleConfirmDelete}
                disabled={loadingModal}
              >
                {loadingModal ? 'Eliminando...' : 'Confirmar Eliminación'}
              </button>
              <button 
                className="btn-cancel" 
                onClick={() => setShowDeleteModal(false)}
                disabled={loadingModal}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Añadir Tipo de Aula */}
      {showAddTipoModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 400 }}>
            <h3>Añadir Tipo de Aula</h3>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                Nombre del Tipo *
              </label>
              <input
                type="text"
                name="nombre"
                placeholder="Ej: Laboratorio, Teórica, Práctica..."
                maxLength={50}
                value={tipoForm.nombre}
                onChange={handleTipoInputChange}
                style={{ width: '100%', padding: '8px' }}
              />
              <small style={{ color: '#666' }}>Máximo 50 caracteres</small>
            </div>

            {modalError && (
              <div className="error-box" style={{ marginBottom: '15px' }}>
                {modalError}
              </div>
            )}

            <div className="modal-buttons">
              <button 
                className="btn-confirm" 
                onClick={handleConfirmAddTipo}
                disabled={loadingModal}
              >
                {loadingModal ? 'Creando...' : 'Confirmar'}
              </button>
              <button 
                className="btn-cancel" 
                onClick={() => setShowAddTipoModal(false)}
                disabled={loadingModal}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}