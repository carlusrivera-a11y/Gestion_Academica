import React, { useEffect, useState } from 'react';
import { historialAPI } from '../api/api';
import '../styles/Dashboard.css';

const PAGE_SIZE = 5;
const DETAIL_PAGE_SIZE = 5;

export default function HistorialPage() {
  const [bitacoras, setBitacoras] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // -----------------------------
  // Modal de Detalles
  // -----------------------------
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detalles, setDetalles] = useState([]);
  const [selectedBitacora, setSelectedBitacora] = useState(null);
  const [detailSearch, setDetailSearch] = useState('');
  const [detailCurrentPage, setDetailCurrentPage] = useState(1);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  // -----------------------------
  // Fetch bitácoras
  // -----------------------------
  const fetchBitacoras = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await historialAPI.getAll();
      setBitacoras(data);
    } catch (err) {
      setErrorMsg(err.message || 'Error al obtener bitácoras');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBitacoras();
  }, []);

  // -----------------------------
  // Filtrado y paginación de bitácoras
  // -----------------------------
  const filtered = bitacoras.filter(b => {
    const query = search.toLowerCase();
    return (
      b.username.toLowerCase().includes(query) ||
      b.ip.toLowerCase().includes(query) ||
      (b.fecha_inicio && b.fecha_inicio.toLowerCase().includes(query)) ||
      (b.fecha_fin && b.fecha_fin.toLowerCase().includes(query))
    );
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const displayed = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // -----------------------------
  // Abrir modal de detalles
  // -----------------------------
  const openDetailModal = async (bitacora) => {
    setSelectedBitacora(bitacora);
    setDetailLoading(true);
    setDetailError('');
    setDetailSearch('');
    setDetailCurrentPage(1);
    setShowDetailModal(true);

    try {
      const data = await historialAPI.getDetalles(bitacora.id);
      setDetalles(data);
    } catch (err) {
      setDetailError(err.message || 'No se pudieron cargar los detalles');
      setDetalles([]);
    } finally {
      setDetailLoading(false);
    }
  };

  // -----------------------------
  // Filtrado y paginación de detalles
  // -----------------------------
  const filteredDetails = detalles.filter(d => {
    const query = detailSearch.toLowerCase();
    return Object.values(d).some(val => String(val).toLowerCase().includes(query));
  });
  const totalDetailPages = Math.ceil(filteredDetails.length / DETAIL_PAGE_SIZE);
  const displayedDetails = filteredDetails.slice(
    (detailCurrentPage - 1) * DETAIL_PAGE_SIZE,
    detailCurrentPage * DETAIL_PAGE_SIZE
  );

  return (
    <div className="historial-page">
      <h2>Historial de Acciones</h2>

      <div className="permiso-header">
        <input
          type="text"
          placeholder="Buscar por usuario, IP o fecha..."
          maxLength={100}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
        />
      </div>

      {errorMsg && <div className="error-box" style={{ marginBottom: 10 }}>{errorMsg}</div>}

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <table className="permiso-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Usuario</th>
              <th>IP</th>
              <th>Fecha Inicio</th>
              <th>Hora Inicio</th>
              <th>Fecha Fin</th>
              <th>Hora Fin</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((b) => (
              <tr key={b.id}>
                <td>{b.id}</td>
                <td>{b.username}</td>
                <td>{b.ip}</td>
                <td>{b.fecha_inicio || '-'}</td>
                <td>{b.hora_inicio || '-'}</td>
                <td>{b.fecha_fin || '-'}</td>
                <td>{b.hora_fin || '-'}</td>
                <td>
                  <button
                    className="btn-primary"
                    style={{ padding: '4px 10px', fontSize: '13px' }}
                    onClick={() => openDetailModal(b)}
                  >
                    Ver Detalle
                  </button>
                </td>
              </tr>
            ))}
            {displayed.length === 0 && (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', color: '#777' }}>
                  No se encontraron registros.
                </td>
              </tr>
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

      {/* ------------------- Modal Detalles ------------------- */}
      {showDetailModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ width: '95%', maxWidth: '700px', maxHeight: '80vh', overflow: 'auto' }}>
            {/* Header con título y botón X */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3>Detalles de Bitácora #{selectedBitacora.id}</h3>
              <button
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: 22,
                  cursor: 'pointer',
                  color: '#555',
                  fontWeight: 'bold',
                }}
                onClick={() => setShowDetailModal(false)}
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>

            {/* Buscador de detalles */}
            <input
              type="text"
              placeholder="Buscar en detalles..."
              maxLength={100}
              value={detailSearch}
              onChange={(e) => { setDetailSearch(e.target.value); setDetailCurrentPage(1); }}
              style={{ marginBottom: 10, padding: 8, width: '100%', borderRadius: 6, border: '1px solid #ccc' }}
            />

            {detailError && <div className="error-box" style={{ marginBottom: 10 }}>{detailError}</div>}

            {detailLoading ? (
              <p>Cargando detalles...</p>
            ) : (
              <table className="permiso-table">
                <thead>
                  <tr>
                    {detalles[0] && Object.keys(detalles[0]).map((key) => (
                      <th key={key}>{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayedDetails.map((d) => (
                    <tr key={d.id}>
                      {Object.values(d).map((val, idx) => (
                        <td key={idx}>{val}</td>
                      ))}
                    </tr>
                  ))}
                  {displayedDetails.length === 0 && (
                    <tr>
                      <td colSpan={detalles[0] ? Object.keys(detalles[0]).length : 1} style={{ textAlign: 'center', color: '#777' }}>
                        No se encontraron detalles.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {/* Paginación de detalles */}
            {totalDetailPages > 1 && (
              <div className="pagination" style={{ marginTop: 10 }}>
                <button disabled={detailCurrentPage === 1} onClick={() => setDetailCurrentPage(p => p - 1)}>◀️</button>
                <span>Página {detailCurrentPage} de {totalDetailPages}</span>
                <button disabled={detailCurrentPage === totalDetailPages} onClick={() => setDetailCurrentPage(p => p + 1)}>▶️</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
