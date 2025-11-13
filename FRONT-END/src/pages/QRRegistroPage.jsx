import React, { useEffect, useState } from 'react';
import { asistenciaAPI } from '../api/api';

export default function QRRegistroPage() {
  const [status, setStatus] = useState('Procesando asistencia...');

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const payloadBase64 = searchParams.get('payload');

    if (!payloadBase64) {
      setStatus('Payload inválido.');
      return;
    }

    try {
      const data = JSON.parse(atob(payloadBase64));
      // POST a /api/asistencia
      const token = localStorage.getItem('token'); // Debe estar logueado
      fetch(`${import.meta.env.VITE_API_URL}/api/asistencia`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })
        .then(async (res) => {
          const result = await res.json();
          if (!res.ok) throw new Error(result.message || 'Error al registrar asistencia');
          setStatus('✅ Asistencia registrada correctamente');
        })
        .catch(err => {
          console.error(err);
          setStatus('❌ Error al registrar asistencia: ' + err.message);
        });
    } catch (err) {
      console.error(err);
      setStatus('Payload inválido.');
    }
  }, []);

  return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', flexDirection:'column', textAlign:'center' }}>
      <h2>{status}</h2>
    </div>
  );
}
