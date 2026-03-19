import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { getReporteResumen } from '../services/api';

const COLORES = ['#2563eb', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];

const Reportes = () => {
  const [reporte, setReporte] = useState(null);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [cargando, setCargando] = useState(false);

  const cargarReporte = async () => {
    setCargando(true);
    try {
      const params = {};
      if (fechaDesde) params.fechaDesde = fechaDesde;
      if (fechaHasta) params.fechaHasta = fechaHasta;

      const res = await getReporteResumen(params);
      setReporte(res.data);
    } catch (error) {
      console.error('Error al cargar reporte:', error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarReporte();
  }, []);

  if (cargando) return <div className="page"><p>Cargando reportes...</p></div>;

  const datosBarras = reporte?.resumenPorProducto?.map(r => ({
    nombre: r.nombre?.length > 15 ? r.nombre.substring(0, 15) + '...' : r.nombre,
    cantidad: r.totalCantidad,
    costo: r.totalCosto,
  })) || [];

  const datosPie = reporte?.resumenPorTipo?.map(r => ({
    name: r._id === 'salida' ? 'Salidas' : r._id === 'entrada' ? 'Entradas' : 'Requerimientos',
    value: r.total,
  })) || [];

  return (
    <div className="page">
      <div className="page-header">
        <h2>Reportes y Estadísticas</h2>
      </div>

      <div className="filtros">
        <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
        <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
        <button className="btn btn-primary" onClick={cargarReporte}>Generar Reporte</button>
      </div>

      {reporte && (
        <>
          {/* Cards resumen */}
          <div className="resumen-cards">
            {reporte.resumenPorTipo?.map((r, i) => (
              <div key={r._id} className={`card card-${i === 0 ? 'info' : i === 1 ? 'success' : 'warning'}`}>
                <h4>{r._id === 'salida' ? 'Salidas' : r._id === 'entrada' ? 'Entradas' : 'Requerimientos'}</h4>
                <p className="card-number">{r.total}</p>
                <p className="card-sub">S/ {r.costoTotal?.toFixed(2)}</p>
              </div>
            ))}
            <div className="card card-danger">
              <h4>Productos con Stock Bajo</h4>
              <p className="card-number">{reporte.productosStockBajo?.length || 0}</p>
            </div>
          </div>

          {/* Gráficos */}
          <div className="charts-grid">
            <div className="chart-card">
              <h3>Consumo por Producto</h3>
              {datosBarras.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={datosBarras}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nombre" angle={-45} textAnchor="end" height={80} fontSize={12} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="cantidad" fill="#2563eb" name="Cantidad" />
                    <Bar dataKey="costo" fill="#f59e0b" name="Costo (S/)" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted">Sin datos para el período seleccionado</p>
              )}
            </div>

            <div className="chart-card">
              <h3>Distribución por Tipo</h3>
              {datosPie.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={datosPie}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      dataKey="value"
                    >
                      {datosPie.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORES[index % COLORES.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted">Sin datos para el período seleccionado</p>
              )}
            </div>
          </div>

          {/* Tabla de productos con stock bajo */}
          {reporte.productosStockBajo?.length > 0 && (
            <div className="chart-card">
              <h3>Productos con Stock Bajo - Requieren Atención</h3>
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th>Stock Actual</th>
                    <th>Stock Mínimo</th>
                    <th>Déficit</th>
                  </tr>
                </thead>
                <tbody>
                  {reporte.productosStockBajo.map(p => (
                    <tr key={p._id} className="row-warning">
                      <td className="font-bold">{p.nombre}</td>
                      <td>{p.categoria?.toUpperCase()}</td>
                      <td className="text-danger font-bold">{p.cantidad} {p.unidad}</td>
                      <td>{p.stockMinimo} {p.unidad}</td>
                      <td className="text-danger">{p.stockMinimo - p.cantidad} {p.unidad}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Reportes;
