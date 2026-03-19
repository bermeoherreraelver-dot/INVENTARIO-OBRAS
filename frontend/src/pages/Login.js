import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login, registro } from '../services/api';

const Login = () => {
  const [esRegistro, setEsRegistro] = useState(false);
  const [form, setForm] = useState({ nombre: '', email: '', password: '', rol: 'almacenero' });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const { iniciarSesion } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      const res = esRegistro
        ? await registro(form)
        : await login({ email: form.email, password: form.password });

      iniciarSesion(res.data.token, res.data.usuario);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error de conexión');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">📦 Inventario Obras</h1>
        <p className="login-subtitle">Sistema de Gestión de Materiales y Equipos</p>

        <form onSubmit={handleSubmit}>
          {esRegistro && (
            <div className="form-group">
              <label>Nombre completo</label>
              <input
                type="text"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                required={esRegistro}
                placeholder="Juan Pérez"
              />
            </div>
          )}
          <div className="form-group">
            <label>Correo electrónico</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="correo@ejemplo.com"
            />
          </div>
          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          {esRegistro && (
            <div className="form-group">
              <label>Rol</label>
              <select name="rol" value={form.rol} onChange={handleChange}>
                <option value="almacenero">Almacenero</option>
                <option value="jefe_obra">Jefe de Obra</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          )}

          {error && <div className="alert alert-error">{error}</div>}

          <button type="submit" className="btn btn-primary btn-block" disabled={cargando}>
            {cargando ? 'Procesando...' : esRegistro ? 'Crear cuenta' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="login-toggle">
          {esRegistro ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}{' '}
          <button className="btn-link" onClick={() => { setEsRegistro(!esRegistro); setError(''); }}>
            {esRegistro ? 'Iniciar sesión' : 'Registrarse'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
