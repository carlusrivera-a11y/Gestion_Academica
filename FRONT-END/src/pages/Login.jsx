import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import '../styles/Login.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login, loading, error } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Trim para evitar espacios accidentales
    const trimmedUser = username.trim();
    const trimmedPass = contrasena.trim();

    try {
      const res = await login(trimmedUser, trimmedPass);
      if (res.success) navigate('/dashboard');
    } catch (err) {
      console.error('Error al iniciar sesión:', err.message);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-header">
          <h1>FICCT</h1>
          <p>Sistema de Gestión Académica</p>
        </div>

        <h2>Iniciar Sesión</h2>
        <form onSubmit={handleSubmit} className="login-form">
          {/* Campo Usuario */}
          <div className="form-group">
            <label htmlFor="username">Usuario</label>
            <input
              id="username"
              type="text"
              placeholder="Ingrese su usuario"
              value={username}
              onChange={(e) => {
                // Limita caracteres y elimina espacios dobles
                const value = e.target.value.slice(0, 50).replace(/\s+/g, ' ');
                setUsername(value);
              }}
              maxLength={50}
              required
            />
          </div>

          {/* Campo Contraseña */}
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <div className="password-input">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Ingrese su contraseña"
                value={contrasena}
                onChange={(e) => {
                  // Limita caracteres (por seguridad, 250 máx.)
                  const value = e.target.value.slice(0, 250);
                  setContrasena(value);
                }}
                maxLength={250}
                required
              />
              <button
                type="button"
                className="toggle-visibility"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Mensaje de error */}
          {error && (
            <div className="error-box">
              <span>⚠️ {error}</span>
            </div>
          )}

          {/* Botón de envío */}
          <button type="submit" disabled={loading}>
            {loading ? 'Ingresando...' : 'Entrar'}
          </button>
        </form>

        <footer className="login-footer">
          <small>© 2025 FICCT - Universidad Autónoma Gabriel René Moreno</small>
        </footer>
      </div>
    </div>
  );
}
