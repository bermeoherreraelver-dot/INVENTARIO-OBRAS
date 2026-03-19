import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProductos, crearPedido } from '../services/api';

const NuevoPedido = () => {
  const [productos, setProductos] = useState([]);
  const [form, setForm] = useState({
    producto: '', cantidad: 1, tipo: 'salida', solicitante: '', observaciones: '',
  });
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await getProductos();
        setProductos(res.data);
      } catch (error) {
        setMensaje({ texto: 'Error al cargar productos', tipo: 'error' });
      }
    };
    cargar();
  }, []);

  const handleProductoChange = (e) => {
    const id = e.target.value;
    setForm({ ...form, producto: id });
    setProductoSeleccionado(productos.find(p => p._id === id) || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);

    try {
      const res = await crearPedido(form);
      setMensaje({ texto: res.data.mensaje, tipo: 'success' });
      setTimeout(() => navigate('/pedidos'), 1500);
    } catch (error) {
      setMensaje({
        texto: error.response?.data?.mensaje || 'Error al crear pedido',
        tipo: 'error',
      });
    } finally {
      setCargando(false);
    }
  };

  const costoEstimado = productoSeleccionado
    ? (form.cantidad * productoSeleccionado.precioUnitario).toFixed(2)
    : '0.00';

  return (
    <div className="page">
      <div className="page-header">
        <h2>Nuevo Movimiento / Pedido</h2>
      </div>

      {mensaje.texto && (
        <div className={`alert alert-${mensaje.tipo}`}>{mensaje.texto}</div>
      )}

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Tipo de movimiento</label>
            <div className="tipo-selector">
              {[
                { value: 'salida', label: 'Salida', desc: 'Retiro del almacén', icon: '📤' },
                { value: 'entrada', label: 'Entrada', desc: 'Ingreso al almacén', icon: '📥' },
                { value: 'requerimiento', label: 'Requerimiento', desc: 'Pedido nuevo', icon: '📋' },
              ].map(t => (
                <button
                  key={t.value}
                  type="button"
                  className={`tipo-btn ${form.tipo === t.value ? 'active' : ''}`}
                  onClick={() => setForm({ ...form, tipo: t.value })}
                >
                  <span className="tipo-icon">{t.icon}</span>
                  <span className="tipo-label">{t.label}</span>
                  <span className="tipo-desc">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Producto</label>
            <select value={form.producto} onChange={handleProductoChange} required>
              <option value="">Seleccionar producto...</option>
              {productos.map(p => (
                <option key={p._id} value={p._id}>
                  {p.nombre} (Stock: {p.cantidad} {p.unidad})
                </option>
              ))}
            </select>
          </div>

          {productoSeleccionado && (
            <div className="producto-info">
              <span>Categoría: <strong>{productoSeleccionado.categoria.toUpperCase()}</strong></span>
              <span>Stock actual: <strong>{productoSeleccionado.cantidad} {productoSeleccionado.unidad}</strong></span>
              <span>Precio unit.: <strong>S/ {productoSeleccionado.precioUnitario?.toFixed(2)}</strong></span>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>Cantidad</label>
              <input
                type="number"
                value={form.cantidad}
                onChange={(e) => setForm({ ...form, cantidad: Number(e.target.value) })}
                min="1"
                max={form.tipo === 'salida' && productoSeleccionado ? productoSeleccionado.cantidad : undefined}
                required
              />
              {form.tipo === 'salida' && productoSeleccionado && form.cantidad > productoSeleccionado.cantidad && (
                <span className="field-error">Excede el stock disponible</span>
              )}
            </div>
            <div className="form-group">
              <label>Costo estimado</label>
              <input type="text" value={`S/ ${costoEstimado}`} disabled className="input-disabled" />
            </div>
          </div>

          <div className="form-group">
            <label>Solicitante</label>
            <input
              type="text"
              value={form.solicitante}
              onChange={(e) => setForm({ ...form, solicitante: e.target.value })}
              placeholder="Nombre del solicitante"
            />
          </div>

          <div className="form-group">
            <label>Observaciones</label>
            <textarea
              value={form.observaciones}
              onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
              placeholder="Notas adicionales..."
              rows="3"
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/pedidos')}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={cargando}>
              {cargando ? 'Procesando...' : 'Registrar Movimiento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NuevoPedido;
