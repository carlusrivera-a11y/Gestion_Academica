import React, { useEffect, useState } from 'react';
import { grupoAPI, materiaAPI, asignarDocenteAPI, gestionAPI, docenteAPI, asignarAulaAPI, aulaAPI } from '../api/api';
import '../styles/Dashboard.css';

const PAGE_SIZE = 5;

export default function GrupoPage() {
  const [grupos, setGrupos] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Estados para modales principales
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showGestionOfertaModal, setShowGestionOfertaModal] = useState(false);
  const [selectedGrupo, setSelectedGrupo] = useState(null);
  const [selectedGrupoMateria, setSelectedGrupoMateria] = useState(null);
  const [modalError, setModalError] = useState('');
  const [loadingModal, setLoadingModal] = useState(false);

  // Estado para el formulario de grupo-materia
  const [grupoForm, setGrupoForm] = useState({
    sigla_grupo: '',
    sigla_materia: ''
  });

  // ------------------ Fetch grupos y materias ------------------
  const fetchGrupos = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await grupoAPI.getAll();
      setGrupos(data);
    } catch (err) {
      setErrorMsg(err.message || 'Error al obtener grupos');
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterias = async () => {
    try {
      const data = await materiaAPI.getAll();
      setMaterias(data);
    } catch (err) {
      console.error('Error al cargar materias', err);
    }
  };

  useEffect(() => { 
    fetchGrupos();
    fetchMaterias();
  }, []);

  // ------------------ Filtros y paginación ------------------
  const filteredGrupos = grupos.filter(g =>
    g.sigla_grupo?.toLowerCase().includes(search.toLowerCase()) ||
    g.sigla_materia?.toLowerCase().includes(search.toLowerCase()) ||
    g.nombre_materia?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredGrupos.length / PAGE_SIZE);
  const displayedGrupos = filteredGrupos.slice(
    (currentPage - 1) * PAGE_SIZE, 
    currentPage * PAGE_SIZE
  );

  // ------------------ Handlers para modales principales ------------------
  const openAddModal = () => {
    setGrupoForm({
      sigla_grupo: '',
      sigla_materia: ''
    });
    setModalError('');
    setShowAddModal(true);
  };

  const openDeleteModal = (grupo) => {
    setSelectedGrupo(grupo);
    setModalError('');
    setShowDeleteModal(true);
  };

  const openGestionOfertaModal = (grupo) => {
    setSelectedGrupoMateria({
      sigla_materia: grupo.sigla_materia,
      sigla_grupo: grupo.sigla_grupo,
      nombre_materia: grupo.nombre_materia
    });
    setShowGestionOfertaModal(true);
  };

  // ------------------ Handlers para inputs ------------------
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setGrupoForm(prev => ({ 
      ...prev, 
      [name]: value.toUpperCase()
    }));
  };

  // ------------------ Crear nueva asociación ------------------
  const handleConfirmAdd = async () => {
    if (!grupoForm.sigla_grupo || !grupoForm.sigla_materia) {
      setModalError('Por favor complete todos los campos obligatorios.');
      return;
    }

    if (grupoForm.sigla_grupo.length > 2) {
      setModalError('La sigla del grupo no puede tener más de 2 caracteres.');
      return;
    }

    // Verificar si ya existe la asociación
    const existe = grupos.find(g => 
      g.sigla_grupo === grupoForm.sigla_grupo && 
      g.sigla_materia === grupoForm.sigla_materia
    );

    if (existe) {
      setModalError('Esta asociación materia-grupo ya existe.');
      return;
    }

    setLoadingModal(true);
    setModalError('');

    try {
      await grupoAPI.create(grupoForm.sigla_grupo, grupoForm.sigla_materia);
      setShowAddModal(false);
      fetchGrupos();
    } catch (err) {
      setModalError(err.message || 'Error al crear la asociación');
    } finally {
      setLoadingModal(false);
    }
  };

  // ------------------ Eliminar asociación ------------------
  const handleConfirmDelete = async () => {
    setLoadingModal(true);
    setModalError('');

    try {
      await grupoAPI.remove(selectedGrupo.sigla_materia, selectedGrupo.sigla_grupo);
      setShowDeleteModal(false);
      fetchGrupos();
    } catch (err) {
      setModalError(err.message || 'Error al eliminar la asociación');
    } finally {
      setLoadingModal(false);
    }
  };

  // ------------------ Render principal ------------------
  return (
    <div className="permiso-page">
      <h2>Gestionar Grupos</h2>

      <div className="permiso-header">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={openAddModal}>
            + Añadir Grupo-Materia
          </button>
        </div>
        <input
          type="text"
          placeholder="Buscar por sigla de grupo, materia o nombre..."
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
        <p>Cargando grupos...</p>
      ) : (
        <table className="permiso-table">
          <thead>
            <tr>
              <th>Sigla Materia</th>
              <th>Nombre Materia</th>
              <th>Créditos</th>
              <th>Grupo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {displayedGrupos.map(grupo => (
              <tr key={`${grupo.sigla_materia}-${grupo.sigla_grupo}`}>
                <td>
                  <strong>{grupo.sigla_materia}</strong>
                </td>
                <td>{grupo.nombre_materia}</td>
                <td>
                  <span style={{ 
                    background: '#e8f4fd', 
                    padding: '4px 8px', 
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    color: '#004085'
                  }}>
                    {grupo.creditos}
                  </span>
                </td>
                <td>
                  <span style={{ 
                    background: '#fff3cd', 
                    padding: '4px 8px', 
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    color: '#856404'
                  }}>
                    {grupo.sigla_grupo}
                  </span>
                </td>
                <td>
                  <button 
                    className="btn-edit" 
                    onClick={() => openGestionOfertaModal(grupo)}
                    style={{ marginRight: '8px' }}
                  >
                    Gestionar Oferta
                  </button>
                  <button 
                    className="btn-delete" 
                    onClick={() => openDeleteModal(grupo)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {displayedGrupos.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', color: '#777' }}>
                  {search ? 'No se encontraron grupos que coincidan con la búsqueda.' : 'No hay grupos registrados.'}
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

      {/* ---------- MODALES PRINCIPALES ---------- */}
      
      {/* Modal Añadir Grupo-Materia */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 450 }}>
            <h3>Añadir Asociación Grupo-Materia</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                  Sigla del Grupo *
                </label>
                <input
                  type="text"
                  name="sigla_grupo"
                  placeholder="Ej: A, B, 1, 2..."
                  maxLength={2}
                  value={grupoForm.sigla_grupo}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '8px', textTransform: 'uppercase' }}
                />
                <small style={{ color: '#666' }}>Máximo 2 caracteres</small>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                  Materia *
                </label>
                <select
                  name="sigla_materia"
                  value={grupoForm.sigla_materia}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '8px' }}
                >
                  <option value="">-- Seleccione una materia --</option>
                  {materias.map(materia => (
                    <option key={materia.sigla} value={materia.sigla}>
                      {materia.sigla} - {materia.nombre}
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

      {/* Modal Eliminar Asociación */}
      {showDeleteModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 500 }}>
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
              ¿Está seguro que desea eliminar la asociación entre{' '}
              <strong>{selectedGrupo?.sigla_materia}</strong> y el grupo{' '}
              <strong>{selectedGrupo?.sigla_grupo}</strong>?
            </p>
            
            <div style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '10px', 
              borderRadius: '4px',
              marginBottom: '15px'
            }}>
              <p style={{ margin: 0, fontWeight: 'bold' }}>Detalles:</p>
              <p style={{ margin: '5px 0 0 0' }}>
                <strong>Materia:</strong> {selectedGrupo?.nombre_materia} ({selectedGrupo?.sigla_materia})<br/>
                <strong>Grupo:</strong> {selectedGrupo?.sigla_grupo}<br/>
                <strong>Créditos:</strong> {selectedGrupo?.creditos}
              </p>
            </div>

            <p style={{ color: '#666', fontSize: '14px' }}>
              Nota: Si este grupo no tiene más asociaciones con otras materias, también será eliminado.
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

      {/* Modal Gestionar Oferta */}
      {showGestionOfertaModal && (
        <GestionarOfertaModal
          grupoMateria={selectedGrupoMateria}
          onClose={() => setShowGestionOfertaModal(false)}
        />
      )}
    </div>
  );
}

// --------------------- Modal Gestionar Oferta ---------------------
function GestionarOfertaModal({ grupoMateria, onClose }) {
  const [asignaciones, setAsignaciones] = useState([]);
  const [gestiones, setGestiones] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Estados para modales internos
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showHorariosModal, setShowHorariosModal] = useState(false);
  const [selectedAsignacion, setSelectedAsignacion] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  // Estado para formularios
  const [asignacionForm, setAsignacionForm] = useState({
    id_gestion: '',
    ci_docente: ''
  });

  // ------------------ Fetch datos ------------------
  const fetchAsignaciones = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await asignarDocenteAPI.getByGrupoMateria(
        grupoMateria.sigla_materia, 
        grupoMateria.sigla_grupo
      );
      setAsignaciones(data);
    } catch (err) {
      setError(err.message || 'Error al cargar las asignaciones');
    } finally {
      setLoading(false);
    }
  };

  const fetchGestiones = async () => {
    try {
      const data = await gestionAPI.getAll();
      setGestiones(data);
    } catch (err) {
      console.error('Error al cargar gestiones', err);
    }
  };

  const fetchDocentes = async () => {
    try {
      const data = await docenteAPI.getAll();
      setDocentes(data);
    } catch (err) {
      console.error('Error al cargar docentes', err);
    }
  };

  useEffect(() => {
    fetchAsignaciones();
    fetchGestiones();
    fetchDocentes();
  }, []);

  // ------------------ Handlers modales ------------------
  const openAddModal = () => {
    setAsignacionForm({
      id_gestion: '',
      ci_docente: ''
    });
    setModalError('');
    setShowAddModal(true);
  };

  const openEditModal = (asignacion) => {
    setSelectedAsignacion(asignacion);
    setAsignacionForm({
      id_gestion: asignacion.id_gestion,
      ci_docente: asignacion.ci_docente || ''
    });
    setModalError('');
    setShowEditModal(true);
  };

  const openDeleteModal = (asignacion) => {
    setSelectedAsignacion(asignacion);
    setModalError('');
    setShowDeleteModal(true);
  };

  const openHorariosModal = (asignacion) => {
    setSelectedAsignacion(asignacion);
    setShowHorariosModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAsignacionForm(prev => ({ ...prev, [name]: value }));
  };

  // ------------------ Crear asignación ------------------
  const handleConfirmAdd = async () => {
    if (!asignacionForm.id_gestion) {
      setModalError('Por favor seleccione una gestión.');
      return;
    }

    setModalLoading(true);
    setModalError('');

    try {
      await asignarDocenteAPI.create({
        id_gestion: parseInt(asignacionForm.id_gestion),
        sigla_materia: grupoMateria.sigla_materia,
        sigla_grupo: grupoMateria.sigla_grupo,
        ci_docente: asignacionForm.ci_docente || null
      });

      setShowAddModal(false);
      fetchAsignaciones();
    } catch (err) {
      setModalError(err.message || 'Error al crear la asignación');
    } finally {
      setModalLoading(false);
    }
  };

  // ------------------ Editar asignación ------------------
  const handleConfirmEdit = async () => {
    if (!asignacionForm.id_gestion) {
      setModalError('Por favor seleccione una gestión.');
      return;
    }

    setModalLoading(true);
    setModalError('');

    try {
      await asignarDocenteAPI.update(
        selectedAsignacion.id_gestion,
        grupoMateria.sigla_materia,
        grupoMateria.sigla_grupo,
        asignacionForm.ci_docente || null
      );

      setShowEditModal(false);
      fetchAsignaciones();
    } catch (err) {
      setModalError(err.message || 'Error al actualizar la asignación');
    } finally {
      setModalLoading(false);
    }
  };

  // ------------------ Eliminar asignación ------------------
    const handleConfirmDelete = async () => {
    setModalLoading(true);
    setModalError('');

    try {
        await asignarDocenteAPI.remove(
        selectedAsignacion.id_gestion,
        grupoMateria.sigla_materia,
        grupoMateria.sigla_grupo
        );

        setShowDeleteModal(false);
        
        // ACTUALIZACIÓN DIRECTA DEL ESTADO - AÑADE ESTAS LÍNEAS:
        setAsignaciones(prevAsignaciones => 
        prevAsignaciones.filter(a => 
            !(a.id_gestion === selectedAsignacion.id_gestion && 
            a.sigla_materia === grupoMateria.sigla_materia && 
            a.sigla_grupo === grupoMateria.sigla_grupo)
        )
        );
        
        // También puedes mantener el fetchAsignaciones() para asegurar consistencia:
        // fetchAsignaciones();
        
    } catch (err) {
        setModalError(err.message || 'Error al eliminar la asignación');
    } finally {
        setModalLoading(false);
    }
    };

  // ------------------ Helper functions ------------------
  const getGestionDescripcion = (id_gestion) => {
    const gestion = gestiones.find(g => g.id === id_gestion);
    return gestion ? `${gestion.anio} - ${gestion.semestre}` : 'N/A';
  };

  const getDocenteNombre = (ci_docente) => {
    if (!ci_docente) return 'Sin asignar';
    const docente = docentes.find(d => d.ci === ci_docente);
    return docente ? 
      `${docente.nombre} ${docente.apellido_p} ${docente.apellido_m || ''}`.trim() : 
      'Docente no encontrado';
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card" style={{ width: '95%', maxWidth: 900, maxHeight: '90vh' }}>
        {/* Header del modal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3>Gestionar Oferta - {grupoMateria.sigla_materia} - {grupoMateria.sigla_grupo}</h3>
          <button 
            onClick={onClose}
            style={{ 
              background: 'none', 
              border: 'none', 
              fontSize: 24, 
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ×
          </button>
        </div>

        {/* Botón Añadir */}
        <div style={{ marginBottom: 20 }}>
          <button className="btn-primary" onClick={openAddModal}>
            + Añadir Asignación
          </button>
        </div>

        {/* Mensaje de error general */}
        {error && <div className="error-box" style={{ marginBottom: 15 }}>{error}</div>}

        {/* Tabla de asignaciones */}
        {loading ? (
          <p>Cargando asignaciones...</p>
        ) : (
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            <table className="permiso-table">
              <thead>
                <tr>
                  <th>Gestión</th>
                  <th>Docente</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {asignaciones.map(asignacion => (
                  <tr key={`${asignacion.id_gestion}-${grupoMateria.sigla_materia}-${grupoMateria.sigla_grupo}`}>
                    <td>
                      <strong>{getGestionDescripcion(asignacion.id_gestion)}</strong>
                      <br />
                      <small style={{ color: '#666' }}>ID: {asignacion.id_gestion}</small>
                    </td>
                    <td>
                      {getDocenteNombre(asignacion.ci_docente)}
                      {asignacion.ci_docente && (
                        <br />
                      )}
                      {asignacion.ci_docente && (
                        <small style={{ color: '#666' }}>CI: {asignacion.ci_docente}</small>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button 
                          className="btn-edit"
                          onClick={() => openEditModal(asignacion)}
                          style={{ fontSize: 12, padding: '4px 8px' }}
                        >
                          Cambiar Docente
                        </button>
                        <button 
                          className="btn-delete"
                          onClick={() => openDeleteModal(asignacion)}
                          style={{ fontSize: 12, padding: '4px 8px' }}
                        >
                          Eliminar
                        </button>
                        <button 
                          className="btn-secondary"
                          onClick={() => openHorariosModal(asignacion)}
                          style={{ fontSize: 12, padding: '4px 8px' }}
                        >
                          Ver Horarios
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {asignaciones.length === 0 && (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', color: '#777' }}>
                      No hay asignaciones registradas para este grupo-materia.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ---------- MODALES INTERNOS ---------- */}

        {/* Modal Añadir Asignación */}
        {showAddModal && (
          <div className="modal-backdrop">
            <div className="modal-card" style={{ maxWidth: 500 }}>
              <h3>Añadir Asignación</h3>
              
              <div style={{ marginBottom: 20 }}>
                <p>
                  <strong>Materia:</strong> {grupoMateria.sigla_materia}<br />
                  <strong>Grupo:</strong> {grupoMateria.sigla_grupo}
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                    Gestión *
                  </label>
                  <select
                    name="id_gestion"
                    value={asignacionForm.id_gestion}
                    onChange={handleInputChange}
                    style={{ width: '100%', padding: '8px' }}
                  >
                    <option value="">-- Seleccione una gestión --</option>
                    {gestiones.map(gestion => (
                      <option key={gestion.id} value={gestion.id}>
                        {gestion.anio} - {gestion.semestre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                    Docente (Opcional)
                  </label>
                  <select
                    name="ci_docente"
                    value={asignacionForm.ci_docente}
                    onChange={handleInputChange}
                    style={{ width: '100%', padding: '8px' }}
                  >
                    <option value="">-- Sin docente --</option>
                    {docentes.map(docente => (
                      <option key={docente.ci} value={docente.ci}>
                        {docente.ci} - {docente.nombre} {docente.apellido_p} {docente.apellido_m || ''}
                      </option>
                    ))}
                  </select>
                  <small style={{ color: '#666' }}>
                    Puede asignar un docente ahora o después
                  </small>
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
                  disabled={modalLoading}
                >
                  {modalLoading ? 'Creando...' : 'Confirmar'}
                </button>
                <button 
                  className="btn-cancel" 
                  onClick={() => setShowAddModal(false)}
                  disabled={modalLoading}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Editar Asignación */}
        {showEditModal && (
          <div className="modal-backdrop">
            <div className="modal-card" style={{ maxWidth: 500 }}>
              <h3>Cambiar Docente</h3>
              
              <div style={{ marginBottom: 20 }}>
                <p>
                  <strong>Materia:</strong> {grupoMateria.sigla_materia}<br />
                  <strong>Grupo:</strong> {grupoMateria.sigla_grupo}<br />
                  <strong>Gestión:</strong> {getGestionDescripcion(selectedAsignacion?.id_gestion)}
                </p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                  Docente
                </label>
                <select
                  name="ci_docente"
                  value={asignacionForm.ci_docente}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '8px' }}
                >
                  <option value="">-- Sin docente --</option>
                  {docentes.map(docente => (
                    <option key={docente.ci} value={docente.ci}>
                      {docente.ci} - {docente.nombre} {docente.apellido_p} {docente.apellido_m || ''}
                    </option>
                  ))}
                </select>
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
                  disabled={modalLoading}
                >
                  {modalLoading ? 'Actualizando...' : 'Confirmar'}
                </button>
                <button 
                  className="btn-cancel" 
                  onClick={() => setShowEditModal(false)}
                  disabled={modalLoading}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Eliminar Asignación */}
        {showDeleteModal && (
          <div className="modal-backdrop">
            <div className="modal-card" style={{ maxWidth: 500 }}>
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
                ¿Está seguro que desea eliminar la asignación de la gestión{' '}
                <strong>{getGestionDescripcion(selectedAsignacion?.id_gestion)}</strong>{' '}
                para {grupoMateria.sigla_materia}-{grupoMateria.sigla_grupo}?
              </p>

              {selectedAsignacion?.ci_docente && (
                <p>
                  <strong>Docente asignado:</strong>{' '}
                  {getDocenteNombre(selectedAsignacion.ci_docente)}
                </p>
              )}

              {modalError && (
                <div className="error-box" style={{ marginBottom: '15px' }}>
                  {modalError}
                </div>
              )}

              <div className="modal-buttons">
                <button 
                  className="btn-delete" 
                  onClick={handleConfirmDelete}
                  disabled={modalLoading}
                >
                  {modalLoading ? 'Eliminando...' : 'Confirmar Eliminación'}
                </button>
                <button 
                  className="btn-cancel" 
                  onClick={() => setShowDeleteModal(false)}
                  disabled={modalLoading}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Ver Horarios */}
        {showHorariosModal && (
          <VerHorariosModal
            asignacion={selectedAsignacion}
            grupoMateria={grupoMateria}
            onClose={() => setShowHorariosModal(false)}
          />
        )}
      </div>
    </div>
  );
}

// --------------------- Modal Ver Horarios ---------------------
function VerHorariosModal({ asignacion, grupoMateria, onClose }) {
  const [horarios, setHorarios] = useState([]);
  const [aulas, setAulas] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Estados para modales internos
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedHorario, setSelectedHorario] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  // Estado para formularios
  const [horarioForm, setHorarioForm] = useState({
    nro_aula: '',
    dia: 'LUNES',
    hora_inicio: '',
    hora_fin: ''
  });

  // ------------------ Fetch datos ------------------
  const fetchHorarios = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await asignarAulaAPI.getByGrupoMateria(
        grupoMateria.sigla_materia, 
        grupoMateria.sigla_grupo
      );
      // Filtrar por la gestión específica
      const horariosFiltrados = data.filter(h => h.id_gestion === asignacion.id_gestion);
      setHorarios(horariosFiltrados);
    } catch (err) {
      setError(err.message || 'Error al cargar los horarios');
    } finally {
      setLoading(false);
    }
  };

  const fetchAulas = async () => {
    try {
      const data = await aulaAPI.getAll();
      setAulas(data);
    } catch (err) {
      console.error('Error al cargar aulas', err);
    }
  };

  useEffect(() => {
    fetchHorarios();
    fetchAulas();
  }, []);

  // ------------------ Handlers modales ------------------
  const openAddModal = () => {
    setHorarioForm({
      nro_aula: '',
      dia: 'LUNES',
      hora_inicio: '',
      hora_fin: ''
    });
    setModalError('');
    setShowAddModal(true);
  };

  const openDeleteModal = (horario) => {
    setSelectedHorario(horario);
    setModalError('');
    setShowDeleteModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setHorarioForm(prev => ({ ...prev, [name]: value }));
  };

  // ------------------ Crear horario ------------------
  const handleConfirmAdd = async () => {
    if (!horarioForm.nro_aula || !horarioForm.dia || !horarioForm.hora_inicio || !horarioForm.hora_fin) {
      setModalError('Por favor complete todos los campos obligatorios.');
      return;
    }

    if (horarioForm.hora_inicio >= horarioForm.hora_fin) {
      setModalError('La hora de inicio debe ser anterior a la hora de fin.');
      return;
    }

    setModalLoading(true);
    setModalError('');

    try {
      await asignarAulaAPI.create({
        id_gestion: asignacion.id_gestion,
        nro_aula: parseInt(horarioForm.nro_aula),
        sigla_materia: grupoMateria.sigla_materia,
        sigla_grupo: grupoMateria.sigla_grupo,
        dia: horarioForm.dia,
        hora_inicio: horarioForm.hora_inicio,
        hora_fin: horarioForm.hora_fin
      });

      setShowAddModal(false);
      fetchHorarios(); // Recargar la lista
    } catch (err) {
      setModalError(err.message || 'Error al crear el horario');
    } finally {
      setModalLoading(false);
    }
  };

  // ------------------ Eliminar horario ------------------
  const handleConfirmDelete = async () => {
    setModalLoading(true);
    setModalError('');

    try {
      await asignarAulaAPI.remove(
        selectedHorario.id_gestion,
        selectedHorario.nro_aula,
        {
          dia: selectedHorario.dia,
          hora_inicio: selectedHorario.hora_inicio,
          hora_fin: selectedHorario.hora_fin
        }
      );

      setShowDeleteModal(false);
      fetchHorarios(); // Recargar la lista
    } catch (err) {
      setModalError(err.message || 'Error al eliminar el horario');
    } finally {
      setModalLoading(false);
    }
  };

  // ------------------ Filtros ------------------
  const filteredHorarios = horarios.filter(h =>
    h.nro_aula?.toString().includes(search.toLowerCase()) ||
    h.dia?.toLowerCase().includes(search.toLowerCase()) ||
    h.hora_inicio?.toLowerCase().includes(search.toLowerCase()) ||
    h.hora_fin?.toLowerCase().includes(search.toLowerCase())
  );

  // ------------------ Helper functions ------------------
  const getAulaInfo = (nro_aula) => {
    const aula = aulas.find(a => a.nro === nro_aula);
    return aula ? `Piso ${aula.piso}` : 'N/A';
  };

  const formatHora = (hora) => {
    if (!hora) return '';
    return hora.slice(0, 5); // Formato HH:MM
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card" style={{ width: '95%', maxWidth: 1000, maxHeight: '90vh' }}>
        {/* Header del modal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3>Horarios - {grupoMateria.sigla_materia} - {grupoMateria.sigla_grupo}</h3>
          <button 
            onClick={onClose}
            style={{ 
              background: 'none', 
              border: 'none', 
              fontSize: 24, 
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ×
          </button>
        </div>

        {/* Barra de búsqueda y botón añadir */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 10 }}>
          <button className="btn-primary" onClick={openAddModal}>
            + Añadir Horario
          </button>
          <input
            type="text"
            placeholder="Buscar por aula, día o hora..."
            maxLength={100}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '300px', padding: '8px' }}
          />
        </div>

        {/* Mensaje de error general */}
        {error && <div className="error-box" style={{ marginBottom: 15 }}>{error}</div>}

        {/* Tabla de horarios */}
        {loading ? (
          <p>Cargando horarios...</p>
        ) : (
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            <table className="permiso-table">
              <thead>
                <tr>
                  <th>Aula</th>
                  <th>Día</th>
                  <th>Hora Inicio</th>
                  <th>Hora Fin</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredHorarios.map(horario => (
                  <tr key={`${horario.nro_aula}-${horario.dia}-${horario.hora_inicio}-${horario.hora_fin}`}>
                    <td>
                      <strong>Aula {horario.nro_aula}</strong>
                      <br />
                      <small style={{ color: '#666' }}>{getAulaInfo(horario.nro_aula)}</small>
                    </td>
                    <td>
                      <span style={{ 
                        background: '#e8f4fd', 
                        padding: '4px 8px', 
                        borderRadius: '4px',
                        fontWeight: 'bold',
                        color: '#004085'
                      }}>
                        {horario.dia}
                      </span>
                    </td>
                    <td>
                      <strong>{formatHora(horario.hora_inicio)}</strong>
                    </td>
                    <td>
                      <strong>{formatHora(horario.hora_fin)}</strong>
                    </td>
                    <td>
                      <button 
                        className="btn-delete"
                        onClick={() => openDeleteModal(horario)}
                        style={{ fontSize: 12, padding: '4px 8px' }}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredHorarios.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: '#777' }}>
                      {search ? 'No se encontraron horarios que coincidan con la búsqueda.' : 'No hay horarios registrados.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ---------- MODALES INTERNOS ---------- */}

        {/* Modal Añadir Horario */}
        {showAddModal && (
          <div className="modal-backdrop">
            <div className="modal-card" style={{ maxWidth: 500 }}>
              <h3>Añadir Horario</h3>
              
              <div style={{ marginBottom: 20 }}>
                <p>
                  <strong>Materia:</strong> {grupoMateria.sigla_materia}<br />
                  <strong>Grupo:</strong> {grupoMateria.sigla_grupo}<br />
                  <strong>Gestión:</strong> {asignacion.id_gestion}
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                    Aula *
                  </label>
                  <select
                    name="nro_aula"
                    value={horarioForm.nro_aula}
                    onChange={handleInputChange}
                    style={{ width: '100%', padding: '8px' }}
                  >
                    <option value="">-- Seleccione un aula --</option>
                    {aulas.map(aula => (
                      <option key={aula.nro} value={aula.nro}>
                        Aula {aula.nro} - Piso {aula.piso}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                    Día *
                  </label>
                  <select
                    name="dia"
                    value={horarioForm.dia}
                    onChange={handleInputChange}
                    style={{ width: '100%', padding: '8px' }}
                  >
                    <option value="LUNES">LUNES</option>
                    <option value="MARTES">MARTES</option>
                    <option value="MIERCOLES">MIÉRCOLES</option>
                    <option value="JUEVES">JUEVES</option>
                    <option value="VIERNES">VIERNES</option>
                    <option value="SABADO">SÁBADO</option>
                    <option value="DOMINGO">DOMINGO</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                    Hora Inicio *
                  </label>
                  <input
                    type="time"
                    name="hora_inicio"
                    value={horarioForm.hora_inicio}
                    onChange={handleInputChange}
                    style={{ width: '100%', padding: '8px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                    Hora Fin *
                  </label>
                  <input
                    type="time"
                    name="hora_fin"
                    value={horarioForm.hora_fin}
                    onChange={handleInputChange}
                    style={{ width: '100%', padding: '8px' }}
                  />
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
                  disabled={modalLoading}
                >
                  {modalLoading ? 'Creando...' : 'Confirmar'}
                </button>
                <button 
                  className="btn-cancel" 
                  onClick={() => setShowAddModal(false)}
                  disabled={modalLoading}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Eliminar Horario */}
        {showDeleteModal && (
          <div className="modal-backdrop">
            <div className="modal-card" style={{ maxWidth: 500 }}>
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
                ¿Está seguro que desea eliminar el horario del aula{' '}
                <strong>{selectedHorario?.nro_aula}</strong> el día{' '}
                <strong>{selectedHorario?.dia}</strong> de {selectedHorario?.hora_inicio} a {selectedHorario?.hora_fin}?
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
                  disabled={modalLoading}
                >
                  {modalLoading ? 'Eliminando...' : 'Confirmar Eliminación'}
                </button>
                <button 
                  className="btn-cancel" 
                  onClick={() => setShowDeleteModal(false)}
                  disabled={modalLoading}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}