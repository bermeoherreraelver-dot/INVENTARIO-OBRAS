import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getPedidos, completarPedido, cancelarPedido } from '../services/api';

const tipoLabels = { salida: 'Salida', entrada: 'Entrada', requerimiento: 'Requerimiento' };
const estadoLabels = { pendiente: 'Pendiente', completado: 'Completado', cancelado: 'Cancelado' };

const Pedidos = () => {
  const [pedidos, setPedidos] = useState([]);
  const [filtros, setFiltros] = useState({ estado: '', tipo: '', fechaDesde: '', fechaHasta: '' });
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

  const cargarPedidos = useCallback(async () => {
    setCargando(true);
    try {
      const params = {};
      if (filtros.estado) params.estado = filtros.estado;
      if (filtros.tipo) params.tipo = filtros.tipo;
      if (filtros.fechaDesde) params.fechaDesde = filtros.fechaDesde;
      if (filtros.fechaHasta) params.fechaHasta = filtros.fechaHasta;

      const res = await getPedidos(params);
      setPedidos(res.data);
    } catch (error) {
      mostrarMensaje('Error al cargar pedidos', 'error');
    } finally {
      setCargando(false);
    }
  }, [filtros]);

  useEffect(() => {
    cargarPedidos();
  }, [cargarPedidos]);

  const mostrarMensaje = (texto, tipo = 'success') => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
  };

  const handleCompletar = async (id) => {
    if (!window.confirm('¿Marcar este pedido como completado?')) return;
    try {
      await completarPedido(id);
      mostrarMensaje('Pedido completado');
      cargarPedidos();
    } catch (error) {
      mostrarMensaje(error.response?.data?.mensaje || 'Error', 'error');
    }
  };

  const handleCancelar = async (id) => {
    if (!window.confirm('¿Cancelar este pedido?')) return;
    try {
      await cancelarPedido(id);
      mostrarMensaje('Pedido cancelado');
      cargarPedidos();
    } catch (error) {
      mostrarMensaje(error.response?.data?.mensaje || 'Error', 'error');
    }
  };

  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-PE', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>Historial de Pedidos y Movimientos</h2>
        <Link to="/nuevo-pedido" className="btn btn-primary">+ Nuevo Movimiento</Link>
      </div>

      {mensaje.texto && (
        <div className={`alert alert-${mensaje.tipo}`}>{mensaje.texto}</div>
      )}

      <div className="filtros">
        <select
          value={filtros.estado}
          onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
        >
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="completado">Completado</option>
          <option value="cancelado">Cancelado</option>
        </select>
        <select
          value={filtros.tipo}
          onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
        >
          <option value="">Todos los tipos</option>
          <option value="salida">Salida</option>
          <option value="entrada">Entrada</option>
          <option value="requerimiento">Requerimiento</option>
        </select>
        <input
          type="date"
          value={filtros.fechaDesde}
          onChange={(e) => setFiltros({ ...filtros, fechaDesde: e.target.value })}
          placeholder="Desde"
        />
        <input
          type="date"
          value={filtros.fechaHasta}
          onChange={(e) => setFiltros({ ...filtros, fechaHasta: e.target.value })}
          placeholder="Hasta"
        />
      </div>

      <div className="tabla-container">
        <table className="tabla">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Solicitante</th>
              <th>Costo Est.</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan="8" className="text-center">Cargando...</td></tr>
            ) : pedidos.length === 0 ? (
              <tr><td colSpan="8" className="text-center">No hay pedidos registrados</td></tr>
            ) : (
              pedidos.map((p) => (
                <tr key={p._id}>
                  <td>{formatFecha(p.createdAt)}</td>
                  <td>
                    <span className={`badge badge-tipo-${p.tipo}`}>
                      {tipoLabels[p.tipo]}
                    </span>
                  </td>
                  <td className="font-bold">{p.producto?.nombre || 'N/A'}</td>
                  <td>{p.cantidad} {p.producto?.unidad}</td>
                  <td>{p.solicitante}</td>
                  <td>S/ {p.costoEstimado?.toFixed(2)}</td>
                  <td>
                    <span className={`badge badge-estado-${p.estado}`}>
                      {estadoLabels[p.estado]}
                    </span>
                  </td>
                  <td>
                    {p.estado === 'pendiente' && (
                      <>
                        <button className="btn btn-sm btn-success" onClick={() => handleCompletar(p._id)}>
                          Completar
                        </button>
                        <button className="btn btn-sm btn-delete" onClick={() => handleCancelar(p._id)}>
                          Cancelar
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Pedidos;
