import React, { useEffect, useState } from 'react';
import * as QRCode from 'qrcode.react'; // Compatible con Vite
import { asistenciaAPI } from '../api/api';
import '../styles/Dashboard.css';

export default function AsistenciaPage() {
  const [gestion, setGestion] = useState(null);
  const [clases, setClases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [modalQR, setModalQR] = useState(null);

  // ---------------------- Fetch clases y gestión activa ----------------------
  const fetchMisClases = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await asistenciaAPI.getMisClases();
      setGestion(data.gestion || null);
      const clasesConFlag = (Array.isArray(data.clases) ? data.clases : []).map(c => ({
        ...c,
        registrada: false,
      }));
      setClases(clasesConFlag);
    } catch (err) {
      console.error(err);
      setGestion(null);
      setClases([]);
      setErrorMsg(err.message || 'Error al obtener las clases del docente');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMisClases();
  }, []);

  // ---------------------- Función para detectar horario actual ----------------------
  const isNowWithinRange = (dia, horaInicio, horaFin) => {
    const now = new Date();
    const dias = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
    let diaHoy = dias[now.getDay()];

    const normalize = str =>
      str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase();

    diaHoy = normalize(diaHoy);
    const diaClase = normalize(dia);

    if (diaHoy !== diaClase) return false;

    const parseHora = horaStr => {
      const [h, m, s = '00'] = horaStr.split(':').map(Number);
      const d = new Date();
      d.setHours(h, m, s, 0);
      return d;
    };

    const inicio = parseHora(horaInicio);
    const fin = parseHora(horaFin);

    return now >= inicio && now <= fin;
  };

  // ---------------------- Manejo Modal QR ----------------------
  const handleShowQR = (clase) => {
    // Creamos payload base64 con los datos de la clase
    const payload = btoa(JSON.stringify({
      id_gestion: clase.id_gestion,
      nro_aula: clase.nro_aula,
      id_horario: clase.id_horario,
    }));

    setModalQR({
      ...clase,
      qrUrl: `${window.location.origin}/qr?payload=${payload}` // URL que abre QRRegistroPage
    });
  };

  const handleCloseModal = () => setModalQR(null);

  const handleRegistrada = (claseIndex) => {
    setClases(prev => {
      const copy = [...prev];
      copy[claseIndex].registrada = true;
      return copy;
    });
    handleCloseModal();
  };

  // ---------------------- Render principal ----------------------
  return (
    <div className="permiso-page">
      <h2>Registrar Asistencia Docente</h2>

      {/* Gestión activa */}
      <div style={{
        backgroundColor: '#f1f1f1',
        padding: '15px 20px',
        borderRadius: '6px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <strong style={{ fontSize: '20px' }}>
          {gestion ? `Gestión Activa: ${gestion.semestre}-${gestion.anio}` : '(No hay gestión activa)'}
        </strong>
        <button className="btn-primary" onClick={fetchMisClases} disabled={loading}>
          🔄 Actualizar
        </button>
      </div>

      {/* Estado general */}
      {errorMsg && <div className="error-box">{errorMsg}</div>}
      {loading && <p>Cargando clases asignadas...</p>}

      {!loading && clases.length > 0 && (
        <table className="permiso-table">
          <thead>
            <tr>
              <th>Materia</th>
              <th>Grupo</th>
              <th>Aula</th>
              <th>Día</th>
              <th>Hora Inicio</th>
              <th>Hora Fin</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {clases.map((clase, index) => {
              const activo = isNowWithinRange(clase.dia, clase.hora_inicio, clase.hora_fin);
              return (
                <tr key={index}>
                  <td><strong>{clase.sigla_materia}</strong></td>
                  <td>{clase.sigla_grupo}</td>
                  <td>{clase.nro_aula ?? '—'}</td>
                  <td>{clase.dia}</td>
                  <td>{clase.hora_inicio}</td>
                  <td>{clase.hora_fin}</td>
                  <td>
                    {activo && !clase.registrada ? (
                      <button
                        className="btn-primary"
                        onClick={() => handleShowQR({ ...clase, index })}
                      >
                        Registrar Asistencia
                      </button>
                    ) : clase.registrada ? (
                      <span style={{ color: 'green', fontWeight: 'bold' }}>✔ Registrado</span>
                    ) : (
                      <span style={{ color: '#888' }}>Fuera de horario</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {!loading && clases.length === 0 && !errorMsg && (
        <div style={{ textAlign: 'center', color: '#666', marginTop: '20px' }}>
          No hay clases asignadas en la gestión actual.
        </div>
      )}

      {/* Modal QR */}
      {modalQR && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Escanea este QR para registrar tu asistencia</h3>
            <QRCode.QRCodeCanvas
              value={modalQR.qrUrl} // Ahora apunta a la URL que registra automáticamente
              size={200}
            />
            <button
              className="btn-secondary"
              onClick={handleCloseModal}
              style={{ marginTop: '15px' }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
