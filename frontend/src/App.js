import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Inventario from './pages/Inventario';
import NuevoPedido from './pages/NuevoPedido';
import Pedidos from './pages/Pedidos';
import Reportes from './pages/Reportes';
import './App.css';

const RutaProtegida = ({ children }) => {
  const { usuario, cargando } = useAuth();
  if (cargando) return <div className="loading">Cargando...</div>;
  return usuario ? children : <Navigate to="/login" />;
};

const AppContent = () => {
  const { usuario } = useAuth();

  return (
    <Router>
      {usuario && <Navbar />}
      <main className={usuario ? 'main-content' : ''}>
        <Routes>
          <Route path="/login" element={usuario ? <Navigate to="/" /> : <Login />} />
          <Route path="/" element={<RutaProtegida><Inventario /></RutaProtegida>} />
          <Route path="/pedidos" element={<RutaProtegida><Pedidos /></RutaProtegida>} />
          <Route path="/nuevo-pedido" element={<RutaProtegida><NuevoPedido /></RutaProtegida>} />
          <Route path="/reportes" element={<RutaProtegida><Reportes /></RutaProtegida>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
