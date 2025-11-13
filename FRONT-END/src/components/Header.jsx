import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import '../styles/Dashboard.css';

export default function Header() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout(); 
      navigate('/');   
    } catch (err) {
      console.error('Error al cerrar sesión:', err.message);
      alert('No se pudo cerrar sesión correctamente.');
    }
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <div className="brand">
          <div className="brand-logo">FICCT</div>
          <div className="brand-text">
            <strong>Sistema de Gestión</strong>
          </div>
        </div>
      </div>

      <div className="header-right">
        <div className="profile" ref={menuRef}>
          <button
            className="avatar-btn"
            aria-label="Abrir menú de usuario"
            onClick={() => setOpen((s) => !s)}
          >
            <div className="avatar-circle">FT</div>
          </button>

          <div className={`profile-menu ${open ? 'open' : ''}`} role="menu" aria-hidden={!open}>
            <button className="profile-menu-item" onClick={handleLogout}>
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
