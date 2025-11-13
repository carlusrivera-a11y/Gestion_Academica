import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import '../styles/Dashboard.css';

function AccordionItem({ title, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="accordion-item">
      <button
        className={`accordion-title ${open ? 'open' : ''}`}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span>{title}</span>
        <span className="chev">{open ? '▾' : '▸'}</span>
      </button>
      <div className={`accordion-body ${open ? 'open' : ''}`}>
        {children}
      </div>
    </div>
  );
}

export default function Sidebar({ collapsed, onToggle }) {
  return (
    <aside className={`app-sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Botón siempre visible, aunque esté colapsado */}
      <div className="sidebar-toggle-wrapper">
        <button className="sidebar-toggle" onClick={onToggle} aria-label="Ocultar/Mostrar menú">
          {collapsed ? '☰' : '‹'}
        </button>
      </div>

      {/* Contenido del menú */}
      <nav className={`sidebar-nav ${collapsed ? 'hidden' : ''}`}>
        <AccordionItem title="Administrar Usuario">
          <NavLink to="/dashboard/admin/permiso" className="nav-link">Gestionar Permiso</NavLink>
          <NavLink to="/dashboard/admin/rol" className="nav-link">Gestionar Rol</NavLink>
          <NavLink to="/dashboard/admin/usuario" className="nav-link">Gestionar Usuario</NavLink>
          <NavLink to="/dashboard/admin/historial" className="nav-link">Historial de Acciones</NavLink>
        </AccordionItem>

        <AccordionItem title="Administrar Gestión Académica">
          <NavLink to="/dashboard/academica/aula" className="nav-link">Gestionar Aula</NavLink>
          <NavLink to="/dashboard/academica/materia" className="nav-link">Gestionar Materia</NavLink>
          <NavLink to="/dashboard/academica/gestion" className="nav-link">Gestionar Gestión Académica</NavLink>
          <NavLink to="/dashboard/academica/grupo" className="nav-link">Gestionar Grupo</NavLink>
        </AccordionItem>

        <AccordionItem title="Administrar Asistencia">
          <NavLink to="/dashboard/asistencia/registrar" className="nav-link">Registrar Asistencia</NavLink>
          <NavLink to="/dashboard/asistencia/mis-registros" className="nav-link">Ver mis Registros</NavLink>
        </AccordionItem>

        <AccordionItem title="Administrar Reportes">
          <NavLink to="/dashboard/reportes/panel" className="nav-link">Panel de Control</NavLink>
          <NavLink to="/dashboard/reportes/estadisticos" className="nav-link">Reportes Estadísticos</NavLink>
        </AccordionItem>
      </nav>
    </aside>
  );
}
