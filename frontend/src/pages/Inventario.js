import React, { useState, useEffect, useCallback } from 'react';
import { getProductos, crearProducto, actualizarProducto, eliminarProducto } from '../services/api';
import Modal from '../components/Modal';

const categorias = [
  { value: 'material', label: 'Material' },
  { value: 'equipo', label: 'Equipo' },
  { value: 'epp', label: 'EPP' },
];

const productoInicial = {
  nombre: '', categoria: 'material', unidad: '', cantidad: 0,
  stockMinimo: 5, precioUnitario: 0, ubicacion: 'Almacén principal',
};

const Inventario = () => {
  const [productos, setProductos] = useState([]);
  const [buscar, setBuscar] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [soloStockBajo, setSoloStockBajo] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);
  const [form, setForm] = useState(productoInicial);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

  const cargarProductos = useCallback(async () => {
    setCargando(true);
    try {
      const params = {};
      if (buscar) params.buscar = buscar;
      if (filtroCategoria) params.categoria = filtroCategoria;
      if (soloStockBajo) params.stockBajo = 'true';

      const res = await getProductos(params);
      setProductos(res.data);
    } catch (error) {
      mostrarMensaje('Error al cargar productos', 'error');
    } finally {
      setCargando(false);
    }
  }, [buscar, filtroCategoria, soloStockBajo]);

  useEffect(() => {
    cargarProductos();
  }, [cargarProductos]);

  const mostrarMensaje = (texto, tipo = 'success') => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
  };

  const abrirModal = (producto = null) => {
    if (producto) {
      setProductoEditando(producto);
      setForm({
        nombre: producto.nombre,
        categoria: producto.categoria,
        unidad: producto.unidad,
        cantidad: producto.cantidad,
        stockMinimo: producto.stockMinimo,
        precioUnitario: producto.precioUnitario,
        ubicacion: producto.ubicacion,
      });
    } else {
      setProductoEditando(null);
      setForm(productoInicial);
    }
    setModalAbierto(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (productoEditando) {
        await actualizarProducto(productoEditando._id, form);
        mostrarMensaje('Producto actualizado');
      } else {
        await crearProducto(form);
        mostrarMensaje('Producto creado');
      }
      setModalAbierto(false);
      cargarProductos();
    } catch (error) {
      mostrarMensaje(error.response?.data?.mensaje || 'Error al guardar', 'error');
    }
  };

  const handleEliminar = async (id, nombre) => {
    if (!window.confirm(`¿Eliminar "${nombre}" del inventario?`)) return;
    try {
      await eliminarProducto(id);
      mostrarMensaje('Producto eliminado');
      cargarProductos();
    } catch (error) {
      mostrarMensaje('Error al eliminar', 'error');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>Inventario de Materiales, Equipos y EPPs</h2>
        <button className="btn btn-primary" onClick={() => abrirModal()}>
          + Nuevo Producto
        </button>
      </div>

      {mensaje.texto && (
        <div className={`alert alert-${mensaje.tipo}`}>{mensaje.texto}</div>
      )}

      <div className="filtros">
        <input
          type="text"
          placeholder="Buscar producto..."
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
          className="input-buscar"
        />
        <select
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
        >
          <option value="">Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={soloStockBajo}
            onChange={(e) => setSoloStockBajo(e.target.checked)}
          />
          Solo stock bajo
        </label>
      </div>

      <div className="tabla-container">
        <table className="tabla">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Cantidad</th>
              <th>Unidad</th>
              <th>Stock Mín.</th>
              <th>Precio Unit.</th>
              <th>Ubicación</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan="9" className="text-center">Cargando...</td></tr>
            ) : productos.length === 0 ? (
              <tr><td colSpan="9" className="text-center">No hay productos registrados</td></tr>
            ) : (
              productos.map((p) => (
                <tr key={p._id} className={p.stockBajo ? 'row-warning' : ''}>
                  <td className="font-bold">{p.nombre}</td>
                  <td>
                    <span className={`badge badge-${p.categoria}`}>
                      {categorias.find(c => c.value === p.categoria)?.label}
                    </span>
                  </td>
                  <td className={p.stockBajo ? 'text-danger font-bold' : ''}>{p.cantidad}</td>
                  <td>{p.unidad}</td>
                  <td>{p.stockMinimo}</td>
                  <td>S/ {p.precioUnitario?.toFixed(2)}</td>
                  <td>{p.ubicacion}</td>
                  <td>
                    {p.stockBajo ? (
                      <span className="badge badge-danger">Stock Bajo</span>
                    ) : (
                      <span className="badge badge-success">OK</span>
                    )}
                  </td>
                  <td>
                    <button className="btn btn-sm btn-edit" onClick={() => abrirModal(p)}>Editar</button>
                    <button className="btn btn-sm btn-delete" onClick={() => handleEliminar(p._id, p.nombre)}>Eliminar</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="resumen-cards">
        <div className="card card-info">
          <h4>Total Productos</h4>
          <p className="card-number">{productos.length}</p>
        </div>
        <div className="card card-warning">
          <h4>Stock Bajo</h4>
          <p className="card-number">{productos.filter(p => p.stockBajo).length}</p>
        </div>
        <div className="card card-success">
          <h4>Valor Total Estimado</h4>
          <p className="card-number">
            S/ {productos.reduce((acc, p) => acc + (p.cantidad * p.precioUnitario), 0).toFixed(2)}
          </p>
        </div>
      </div>

      <Modal
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        title={productoEditando ? 'Editar Producto' : 'Nuevo Producto'}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre del producto</label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              required
              placeholder="Ej: Cemento Portland"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Categoría</label>
              <select
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
              >
                {categorias.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Unidad</label>
              <input
                type="text"
                value={form.unidad}
                onChange={(e) => setForm({ ...form, unidad: e.target.value })}
                required
                placeholder="Ej: bolsas, unidades, m3"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Cantidad</label>
              <input
                type="number"
                value={form.cantidad}
                onChange={(e) => setForm({ ...form, cantidad: Number(e.target.value) })}
                min="0"
                required
              />
            </div>
            <div className="form-group">
              <label>Stock mínimo</label>
              <input
                type="number"
                value={form.stockMinimo}
                onChange={(e) => setForm({ ...form, stockMinimo: Number(e.target.value) })}
                min="0"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Precio unitario (S/)</label>
              <input
                type="number"
                step="0.01"
                value={form.precioUnitario}
                onChange={(e) => setForm({ ...form, precioUnitario: Number(e.target.value) })}
                min="0"
              />
            </div>
            <div className="form-group">
              <label>Ubicación</label>
              <input
                type="text"
                value={form.ubicacion}
                onChange={(e) => setForm({ ...form, ubicacion: e.target.value })}
                placeholder="Almacén principal"
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setModalAbierto(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              {productoEditando ? 'Actualizar' : 'Crear Producto'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Inventario;
