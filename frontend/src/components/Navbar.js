import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { usuario, cerrarSesion } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';

  if (!usuario) return null;

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">
          <span className="navbar-logo">📦</span> Inventario Obras
        </Link>
      </div>
      <div className="navbar-links">
        <Link to="/" className={isActive('/')}>Inventario</Link>
        <Link to="/pedidos" className={isActive('/pedidos')}>Pedidos</Link>
        <Link to="/nuevo-pedido" className={isActive('/nuevo-pedido')}>Nuevo Pedido</Link>
        <Link to="/reportes" className={isActive('/reportes')}>Reportes</Link>
      </div>
      <div className="navbar-user">
        <span className="user-info">{usuario.nombre} ({usuario.rol})</span>
        <button onClick={cerrarSesion} className="btn btn-logout">Salir</button>
      </div>
    </nav>
  );
};

export default Navbar;
