import React, { useEffect, useState } from 'react';
import { gestionAPI } from '../api/api';
import '../styles/Dashboard.css';

const PAGE_SIZE = 5;

export default function GestionPage() {
  const [gestiones, setGestiones] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Estados para modales
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedGestion, setSelectedGestion] = useState(null);
  const [modalError, setModalError] = useState('');
  const [loadingModal, setLoadingModal] = useState(false);

  // Estados para los formularios
  const [gestionForm, setGestionForm] = useState({
    anio: new Date().getFullYear(),
    semestre: '1',
    fecha_inicio: '',
    fecha_fin: '',
    estado: 'PLANIFICADO'
  });

  const [editForm, setEditForm] = useState({
    anio: '',
    semestre: '',
    fecha_inicio: '',
    fecha_fin: '',
    estado: ''
  });

  // ------------------ Fetch gestiones ------------------
  const fetchGestiones = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await gestionAPI.getAll();
      setGestiones(data);
    } catch (err) {
      setErrorMsg(err.message || 'Error al obtener gestiones académicas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchGestiones(); 
  }, []);

  // ------------------ Filtros y paginación ------------------
  const filteredGestiones = gestiones.filter(g =>
    g.anio?.toString().includes(search.toLowerCase()) ||
    g.semestre?.toLowerCase().includes(search.toLowerCase()) ||
    g.estado?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredGestiones.length / PAGE_SIZE);
  const displayedGestiones = filteredGestiones.slice(
    (currentPage - 1) * PAGE_SIZE, 
    currentPage * PAGE_SIZE
  );

  // ------------------ Handlers para modales ------------------
  const openAddModal = () => {
    const currentYear = new Date().getFullYear();
    setGestionForm({
      anio: currentYear,
      semestre: '1',
      fecha_inicio: '',
      fecha_fin: '',
      estado: 'PLANIFICADO'
    });
    setModalError('');
    setShowAddModal(true);
  };

  const openEditModal = (gestion) => {
    setSelectedGestion(gestion);
    setEditForm({
      anio: gestion.anio,
      semestre: gestion.semestre,
      fecha_inicio: gestion.fecha_inicio.split('T')[0], // Formato YYYY-MM-DD para input date
      fecha_fin: gestion.fecha_fin.split('T')[0],
      estado: gestion.estado
    });
    setModalError('');
    setShowEditModal(true);
  };

  const openDeleteModal = (gestion) => {
    setSelectedGestion(gestion);
    setModalError('');
    setShowDeleteModal(true);
  };

  // ------------------ Handlers para inputs del formulario ------------------
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setGestionForm(prev => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  // ------------------ Crear nueva gestión ------------------
  const handleConfirmAdd = async () => {
    // Validaciones básicas
    if (!gestionForm.anio || !gestionForm.semestre || !gestionForm.fecha_inicio || !gestionForm.fecha_fin || !gestionForm.estado) {
      setModalError('Por favor complete todos los campos obligatorios.');
      return;
    }

    const anio = parseInt(gestionForm.anio);
    if (isNaN(anio) || anio < 2000 || anio > 2100) {
      setModalError('El año debe ser un número entre 2000 y 2100.');
      return;
    }

    if (new Date(gestionForm.fecha_fin) <= new Date(gestionForm.fecha_inicio)) {
      setModalError('La fecha de fin debe ser posterior a la fecha de inicio.');
      return;
    }

    setLoadingModal(true);
    setModalError('');

    try {
      await gestionAPI.create({
        anio: anio,
        semestre: gestionForm.semestre,
        fecha_inicio: gestionForm.fecha_inicio,
        fecha_fin: gestionForm.fecha_fin,
        estado: gestionForm.estado
      });

      setShowAddModal(false);
      fetchGestiones(); // Recargar la lista
    } catch (err) {
      setModalError(err.message || 'Error al crear la gestión académica');
    } finally {
      setLoadingModal(false);
    }
  };

  // ------------------ Editar gestión ------------------
  const handleConfirmEdit = async () => {
    // Validaciones básicas
    if (!editForm.anio || !editForm.semestre || !editForm.fecha_inicio || !editForm.fecha_fin || !editForm.estado) {
      setModalError('Por favor complete todos los campos obligatorios.');
      return;
    }

    const anio = parseInt(editForm.anio);
    if (isNaN(anio) || anio < 2000 || anio > 2100) {
      setModalError('El año debe ser un número entre 2000 y 2100.');
      return;
    }

    if (new Date(editForm.fecha_fin) <= new Date(editForm.fecha_inicio)) {
      setModalError('La fecha de fin debe ser posterior a la fecha de inicio.');
      return;
    }

    setLoadingModal(true);
    setModalError('');

    try {
      await gestionAPI.update(selectedGestion.id, {
        anio: anio,
        semestre: editForm.semestre,
        fecha_inicio: editForm.fecha_inicio,
        fecha_fin: editForm.fecha_fin,
        estado: editForm.estado
      });

      setShowEditModal(false);
      fetchGestiones(); // Recargar la lista
    } catch (err) {
      setModalError(err.message || 'Error al actualizar la gestión académica');
    } finally {
      setLoadingModal(false);
    }
  };

  // ------------------ Eliminar gestión ------------------
  const handleConfirmDelete = async () => {
    setLoadingModal(true);
    setModalError('');

    try {
      await gestionAPI.remove(selectedGestion.id);
      setShowDeleteModal(false);
      fetchGestiones(); // Recargar la lista
    } catch (err) {
      setModalError(err.message || 'Error al eliminar la gestión académica');
    } finally {
      setLoadingModal(false);
    }
  };

  // ------------------ Función para formatear fecha ------------------
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };

  // ------------------ Función para obtener el nombre del semestre ------------------
  const getSemestreName = (semestre) => {
    return semestre === '1' ? 'Primer Semestre' : 'Segundo Semestre';
  };

  // ------------------ Función para obtener el color del estado ------------------
  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'ACTIVO': return '#28a745';
      case 'FINALIZADO': return '#6c757d';
      case 'PLANIFICADO': return '#ffc107';
      default: return '#6c757d';
    }
  };

  // ------------------ Render principal ------------------
  return (
    <div className="permiso-page">
      <h2>Gestionar Gestión Académica</h2>

      <div className="permiso-header">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={openAddModal}>
            + Añadir Gestión
          </button>
        </div>
        <input
          type="text"
          placeholder="Buscar por año, semestre o estado..."
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
        <p>Cargando gestiones académicas...</p>
      ) : (
        <table className="permiso-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Año</th>
              <th>Semestre</th>
              <th>Fecha Inicio</th>
              <th>Fecha Fin</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {displayedGestiones.map(gestion => (
              <tr key={gestion.id}>
                <td>{gestion.id}</td>
                <td>
                  <strong>{gestion.anio}</strong>
                </td>
                <td>{getSemestreName(gestion.semestre)}</td>
                <td>{formatDate(gestion.fecha_inicio)}</td>
                <td>{formatDate(gestion.fecha_fin)}</td>
                <td>
                  <span style={{ 
                    background: getEstadoColor(gestion.estado),
                    color: 'white',
                    padding: '4px 8px', 
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    fontSize: '12px'
                  }}>
                    {gestion.estado}
                  </span>
                </td>
                <td>
                  <button 
                    className="btn-edit" 
                    onClick={() => openEditModal(gestion)}
                  >
                    Editar
                  </button>
                  <button 
                    className="btn-delete" 
                    onClick={() => openDeleteModal(gestion)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {displayedGestiones.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', color: '#777' }}>
                  {search ? 'No se encontraron gestiones que coincidan con la búsqueda.' : 'No hay gestiones académicas registradas.'}
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
      
      {/* Modal Añadir Gestión */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 500 }}>
            <h3>Añadir Nueva Gestión Académica</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                  Año *
                </label>
                <input
                  type="number"
                  name="anio"
                  placeholder="Ej: 2024"
                  min="2000"
                  max="2100"
                  value={gestionForm.anio}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '8px' }}
                />
                <small style={{ color: '#666' }}>Entre 2000 y 2100</small>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                  Semestre *
                </label>
                <select
                  name="semestre"
                  value={gestionForm.semestre}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '8px' }}
                >
                  <option value="1">Primer Semestre</option>
                  <option value="2">Segundo Semestre</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                  Fecha Inicio *
                </label>
                <input
                  type="date"
                  name="fecha_inicio"
                  value={gestionForm.fecha_inicio}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '8px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                  Fecha Fin *
                </label>
                <input
                  type="date"
                  name="fecha_fin"
                  value={gestionForm.fecha_fin}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '8px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                  Estado *
                </label>
                <select
                  name="estado"
                  value={gestionForm.estado}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '8px' }}
                >
                  <option value="PLANIFICADO">Planificado</option>
                  <option value="ACTIVO">Activo</option>
                  <option value="FINALIZADO">Finalizado</option>
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

      {/* Modal Editar Gestión */}
      {showEditModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 500 }}>
            <h3>Editar Gestión Académica</h3>
            
            <div style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '10px', 
              borderRadius: '4px', 
              marginBottom: '15px' 
            }}>
              <p style={{ margin: 0, fontWeight: 'bold' }}>
                Editando Gestión ID: <span style={{ color: '#004085' }}>{selectedGestion?.id}</span>
              </p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                  Año *
                </label>
                <input
                  type="number"
                  name="anio"
                  placeholder="Ej: 2024"
                  min="2000"
                  max="2100"
                  value={editForm.anio}
                  onChange={handleEditInputChange}
                  style={{ width: '100%', padding: '8px' }}
                />
                <small style={{ color: '#666' }}>Entre 2000 y 2100</small>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                  Semestre *
                </label>
                <select
                  name="semestre"
                  value={editForm.semestre}
                  onChange={handleEditInputChange}
                  style={{ width: '100%', padding: '8px' }}
                >
                  <option value="1">Primer Semestre</option>
                  <option value="2">Segundo Semestre</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                  Fecha Inicio *
                </label>
                <input
                  type="date"
                  name="fecha_inicio"
                  value={editForm.fecha_inicio}
                  onChange={handleEditInputChange}
                  style={{ width: '100%', padding: '8px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                  Fecha Fin *
                </label>
                <input
                  type="date"
                  name="fecha_fin"
                  value={editForm.fecha_fin}
                  onChange={handleEditInputChange}
                  style={{ width: '100%', padding: '8px' }}
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
                  <option value="PLANIFICADO">Planificado</option>
                  <option value="ACTIVO">Activo</option>
                  <option value="FINALIZADO">Finalizado</option>
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

      {/* Modal Eliminar Gestión */}
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
              ¿Está seguro que desea eliminar la gestión académica del año{' '}
              <strong>{selectedGestion?.anio}</strong> - {selectedGestion && getSemestreName(selectedGestion.semestre)}?
            </p>
            
            <p style={{ color: '#666', fontSize: '14px' }}>
              Se eliminarán todos los datos asociados a esta gestión académica.
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
    </div>
  );
}