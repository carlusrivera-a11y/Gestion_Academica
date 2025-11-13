import React, { useEffect, useState } from 'react';

export default function QRRegistroPage() {
  const [status, setStatus] = useState('Procesando asistencia...');

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const payloadBase64 = searchParams.get('payload');

    if (!payloadBase64) {
      setStatus('❌ QR inválido o dañado.');
      return;
    }

    try {
      // Decodificamos y validamos el contenido del QR
      const data = JSON.parse(atob(payloadBase64));

      // Validar estructura básica
      if (!data.id_gestion || !data.nro_aula || !data.id_horario) {
        setStatus('❌ Datos incompletos en el QR.');
        return;
      }

      // Realizamos la petición SIN token
      fetch(`${import.meta.env.VITE_API_URL}/api/asistencia/qr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
        .then(async (res) => {
          const result = await res.json();
          if (!res.ok) throw new Error(result.message || 'Error al registrar asistencia');
          setStatus('✅ Asistencia registrada correctamente');
        })
        .catch((err) => {
          console.error('Error:', err);
          setStatus('❌ No se pudo registrar la asistencia: ' + err.message);
        });
    } catch (err) {
      console.error('Error al decodificar payload:', err);
      setStatus('❌ QR inválido o corrupto.');
    }
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        textAlign: 'center',
        backgroundColor: '#f7f7f7',
      }}
    >
      <h2>{status}</h2>
      <p style={{ color: '#666', marginTop: 10 }}>Puede cerrar esta ventana.</p>
    </div>
  );
}
