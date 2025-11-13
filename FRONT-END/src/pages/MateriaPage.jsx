import React, { useEffect, useState } from 'react';
import { materiaAPI } from '../api/api';
import '../styles/Dashboard.css';

const PAGE_SIZE = 5;

export default function MateriaPage() {
  const [materias, setMaterias] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Estados para modales
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMateria, setSelectedMateria] = useState(null);
  const [modalError, setModalError] = useState('');
  const [loadingModal, setLoadingModal] = useState(false);

  // Estados para los formularios
  const [materiaForm, setMateriaForm] = useState({
    sigla: '',
    nombre: '',
    descripcion: '',
    creditos: ''
  });

  const [editForm, setEditForm] = useState({
    nombre: '',
    descripcion: '',
    creditos: ''
  });

  // ------------------ Fetch materias ------------------
  const fetchMaterias = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await materiaAPI.getAll();
      setMaterias(data);
    } catch (err) {
      setErrorMsg(err.message || 'Error al obtener materias');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchMaterias(); 
  }, []);

  // ------------------ Filtros y paginación ------------------
  const filteredMaterias = materias.filter(m =>
    m.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    m.sigla?.toLowerCase().includes(search.toLowerCase()) ||
    m.descripcion?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredMaterias.length / PAGE_SIZE);
  const displayedMaterias = filteredMaterias.slice(
    (currentPage - 1) * PAGE_SIZE, 
    currentPage * PAGE_SIZE
  );

  // ------------------ Handlers para modales ------------------
  const openAddModal = () => {
    setMateriaForm({
      sigla: '',
      nombre: '',
      descripcion: '',
      creditos: ''
    });
    setModalError('');
    setShowAddModal(true);
  };

  const openEditModal = (materia) => {
    setSelectedMateria(materia);
    setEditForm({
      nombre: materia.nombre,
      descripcion: materia.descripcion || '',
      creditos: materia.creditos.toString()
    });
    setModalError('');
    setShowEditModal(true);
  };

  const openDeleteModal = (materia) => {
    setSelectedMateria(materia);
    setModalError('');
    setShowDeleteModal(true);
  };

  // ------------------ Handlers para inputs del formulario ------------------
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setMateriaForm(prev => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  // ------------------ Crear nueva materia ------------------
  const handleConfirmAdd = async () => {
    // Validaciones básicas
    if (!materiaForm.sigla || !materiaForm.nombre || !materiaForm.creditos) {
      setModalError('Por favor complete los campos obligatorios: Sigla, Nombre y Créditos.');
      return;
    }

    if (materiaForm.sigla.length > 10) {
      setModalError('La sigla no puede tener más de 10 caracteres.');
      return;
    }

    if (materiaForm.nombre.length > 255) {
      setModalError('El nombre no puede tener más de 255 caracteres.');
      return;
    }

    const creditos = parseInt(materiaForm.creditos);
    if (isNaN(creditos) || creditos < 0) {
      setModalError('Los créditos deben ser un número mayor o igual a 0.');
      return;
    }

    setLoadingModal(true);
    setModalError('');

    try {
      await materiaAPI.create({
        sigla: materiaForm.sigla.toUpperCase(),
        nombre: materiaForm.nombre,
        descripcion: materiaForm.descripcion || null,
        creditos: creditos
      });

      setShowAddModal(false);
      fetchMaterias(); // Recargar la lista
    } catch (err) {
      setModalError(err.message || 'Error al crear la materia');
    } finally {
      setLoadingModal(false);
    }
  };

  // ------------------ Editar materia ------------------
  const handleConfirmEdit = async () => {
    // Validaciones básicas
    if (!editForm.nombre || !editForm.creditos) {
      setModalError('Por favor complete los campos obligatorios: Nombre y Créditos.');
      return;
    }

    if (editForm.nombre.length > 255) {
      setModalError('El nombre no puede tener más de 255 caracteres.');
      return;
    }

    const creditos = parseInt(editForm.creditos);
    if (isNaN(creditos) || creditos < 0) {
      setModalError('Los créditos deben ser un número mayor o igual a 0.');
      return;
    }

    setLoadingModal(true);
    setModalError('');

    try {
      await materiaAPI.update(selectedMateria.sigla, {
        nombre: editForm.nombre,
        descripcion: editForm.descripcion || null,
        creditos: creditos
      });

      setShowEditModal(false);
      fetchMaterias(); // Recargar la lista
    } catch (err) {
      setModalError(err.message || 'Error al actualizar la materia');
    } finally {
      setLoadingModal(false);
    }
  };

  // ------------------ Eliminar materia ------------------
  const handleConfirmDelete = async () => {
    setLoadingModal(true);
    setModalError('');

    try {
      await materiaAPI.remove(selectedMateria.sigla);
      setShowDeleteModal(false);
      fetchMaterias(); // Recargar la lista
    } catch (err) {
      setModalError(err.message || 'Error al eliminar la materia');
    } finally {
      setLoadingModal(false);
    }
  };

  // ------------------ Render principal ------------------
  return (
    <div className="permiso-page">
      <h2>Gestionar Materias</h2>

      <div className="permiso-header">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={openAddModal}>
            + Añadir Materia
          </button>
        </div>
        <input
          type="text"
          placeholder="Buscar por nombre, sigla o descripción..."
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
        <p>Cargando materias...</p>
      ) : (
        <table className="permiso-table">
          <thead>
            <tr>
              <th>Sigla</th>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Créditos</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {displayedMaterias.map(materia => (
              <tr key={materia.sigla}>
                <td>
                  <strong>{materia.sigla}</strong>
                </td>
                <td>{materia.nombre}</td>
                <td>
                  {materia.descripcion || (
                    <span style={{ color: '#777', fontStyle: 'italic' }}>
                      Sin descripción
                    </span>
                  )}
                </td>
                <td>
                  <span style={{ 
                    background: '#e8f4fd', 
                    padding: '4px 8px', 
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    color: '#004085'
                  }}>
                    {materia.creditos}
                  </span>
                </td>
                <td>
                  <button 
                    className="btn-edit" 
                    onClick={() => openEditModal(materia)}
                  >
                    Editar
                  </button>
                  <button 
                    className="btn-delete" 
                    onClick={() => openDeleteModal(materia)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {displayedMaterias.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', color: '#777' }}>
                  {search ? 'No se encontraron materias que coincidan con la búsqueda.' : 'No hay materias registradas.'}
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
      
      {/* Modal Añadir Materia */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 500 }}>
            <h3>Añadir Nueva Materia</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                  Sigla *
                </label>
                <input
                  type="text"
                  name="sigla"
                  placeholder="Ej: MAT101"
                  maxLength={10}
                  value={materiaForm.sigla}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '8px' }}
                />
                <small style={{ color: '#666' }}>Máximo 10 caracteres</small>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                  Nombre *
                </label>
                <input
                  type="text"
                  name="nombre"
                  placeholder="Ej: Matemáticas Básicas"
                  maxLength={255}
                  value={materiaForm.nombre}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '8px' }}
                />
                <small style={{ color: '#666' }}>Máximo 255 caracteres</small>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                  Descripción
                </label>
                <textarea
                  name="descripcion"
                  placeholder="Descripción opcional de la materia..."
                  rows={3}
                  value={materiaForm.descripcion}
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
                  Créditos *
                </label>
                <input
                  type="number"
                  name="creditos"
                  placeholder="Ej: 4"
                  min="0"
                  max="20"
                  value={materiaForm.creditos}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '8px' }}
                />
                <small style={{ color: '#666' }}>Número mayor o igual a 0</small>
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

      {/* Modal Editar Materia */}
      {showEditModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 500 }}>
            <h3>Editar Materia</h3>
            
            <div style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '10px', 
              borderRadius: '4px', 
              marginBottom: '15px' 
            }}>
              <p style={{ margin: 0, fontWeight: 'bold' }}>
                Editando: <span style={{ color: '#004085' }}>{selectedMateria?.sigla}</span>
              </p>
              <small style={{ color: '#666' }}>
                La sigla no se puede modificar
              </small>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                  Nombre *
                </label>
                <input
                  type="text"
                  name="nombre"
                  placeholder="Ej: Matemáticas Básicas"
                  maxLength={255}
                  value={editForm.nombre}
                  onChange={handleEditInputChange}
                  style={{ width: '100%', padding: '8px' }}
                />
                <small style={{ color: '#666' }}>Máximo 255 caracteres</small>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                  Descripción
                </label>
                <textarea
                  name="descripcion"
                  placeholder="Descripción opcional de la materia..."
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
                  Créditos *
                </label>
                <input
                  type="number"
                  name="creditos"
                  placeholder="Ej: 4"
                  min="0"
                  max="20"
                  value={editForm.creditos}
                  onChange={handleEditInputChange}
                  style={{ width: '100%', padding: '8px' }}
                />
                <small style={{ color: '#666' }}>Número mayor o igual a 0</small>
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

      {/* Modal Eliminar Materia */}
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
              ¿Está seguro que desea eliminar la materia{' '}
              <strong>{selectedMateria?.nombre}</strong> ({selectedMateria?.sigla})?
            </p>
            
            <p style={{ color: '#666', fontSize: '14px' }}>
              Se eliminarán todos los datos asociados a esta materia.
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