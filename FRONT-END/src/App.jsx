import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import DashboardLayout from './pages/DashboardLayout';
import SimplePage from './pages/SimplePage';
import PermisoPage from './pages/PermisoPage';
import RolPage from './pages/RolPage';
import HistorialPage from './pages/HistorialPage';
import UsuarioPage from './pages/UsuarioPage';
import AulaPage from './pages/AulaPage';
import MateriaPage from './pages/MateriaPage';
import GestionPage from './pages/GestionPage';
import GrupoPage from './pages/GrupoPage';
import AsistenciaPage from './pages/AsistenciaPage';
import QRRegistroPage from './pages/QRRegistroPage';

function makeTitlePage(name) {
  return <SimplePage title={name} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={makeTitlePage('Panel principal')} />

          {/* Administrar Usuario */}
          <Route path="admin/permiso" element={<PermisoPage />} />
          <Route path="admin/rol" element={<RolPage />} />
          <Route path="admin/usuario" element={<UsuarioPage />} />
          <Route path="admin/historial" element={<HistorialPage />} />

          {/* Gestion Academica */}
          <Route path="academica/aula" element={<AulaPage />} />
          <Route path="academica/materia" element={<MateriaPage />} />
          <Route path="academica/gestion" element={<GestionPage />} />
          <Route path="academica/grupo" element={<GrupoPage />} />

          {/* Asistencia */}
          <Route path="asistencia/registrar" element={<AsistenciaPage />} />
          <Route path="asistencia/mis-registros" element={makeTitlePage('Ver mis Registros')} />
          <Route path="asistencia/qr" element={<QRRegistroPage />} />

          {/* Reportes */}
          <Route path="reportes/panel" element={makeTitlePage('Panel de Control')} />
          <Route path="reportes/estadisticos" element={makeTitlePage('Reportes Estadísticos')} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}