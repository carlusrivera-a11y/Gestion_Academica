import React from 'react';

export default function SimplePage({ title }) {
  return (
    <div style={{
      padding: '28px',
      borderRadius: 12,
      background: '#fff',
      boxShadow: '0 6px 18px rgba(0,0,0,0.06)',
      minHeight: 260
    }}>
      <h2 style={{ marginBottom: 12 }}>{title}</h2>
      <p style={{ color: '#666' }}>Página simple — aquí se implementará la funcionalidad de <strong>{title}</strong>.</p>
    </div>
  );
}
