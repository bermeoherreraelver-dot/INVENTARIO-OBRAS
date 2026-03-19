const supabase = require('../lib/supabase');
const allowCors = require('../lib/cors');

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ mensaje: 'Método no permitido' });
  }

  const { fechaDesde, fechaHasta } = req.query;

  try {
    // Pedidos completados para resumen por producto
    let queryPedidos = supabase
      .from('pedidos')
      .select('*, productos(id, nombre, categoria)')
      .eq('estado', 'completado');

    if (fechaDesde) queryPedidos = queryPedidos.gte('created_at', fechaDesde);
    if (fechaHasta) queryPedidos = queryPedidos.lte('created_at', fechaHasta + 'T23:59:59.999Z');

    const { data: pedidos } = await queryPedidos;

    // Resumen por producto
    const porProducto = {};
    (pedidos || []).forEach(p => {
      const nombre = p.productos?.nombre || 'N/A';
      if (!porProducto[nombre]) {
        porProducto[nombre] = { nombre, categoria: p.productos?.categoria, totalCantidad: 0, totalCosto: 0, numeroPedidos: 0 };
      }
      porProducto[nombre].totalCantidad += p.cantidad;
      porProducto[nombre].totalCosto += parseFloat(p.costo_estimado || 0);
      porProducto[nombre].numeroPedidos += 1;
    });

    const resumenPorProducto = Object.values(porProducto).sort((a, b) => b.totalCantidad - a.totalCantidad);

    // Resumen por tipo (todos los pedidos, no solo completados)
    let queryTodos = supabase.from('pedidos').select('tipo, costo_estimado');
    if (fechaDesde) queryTodos = queryTodos.gte('created_at', fechaDesde);
    if (fechaHasta) queryTodos = queryTodos.lte('created_at', fechaHasta + 'T23:59:59.999Z');

    const { data: todosPedidos } = await queryTodos;

    const porTipo = {};
    (todosPedidos || []).forEach(p => {
      if (!porTipo[p.tipo]) porTipo[p.tipo] = { _id: p.tipo, total: 0, costoTotal: 0 };
      porTipo[p.tipo].total += 1;
      porTipo[p.tipo].costoTotal += parseFloat(p.costo_estimado || 0);
    });

    const resumenPorTipo = Object.values(porTipo);

    // Productos con stock bajo
    const { data: todosProductos } = await supabase.from('productos').select('*');
    const productosStockBajo = (todosProductos || [])
      .filter(p => p.cantidad <= p.stock_minimo)
      .map(p => ({
        ...p,
        _id: p.id,
        stockMinimo: p.stock_minimo,
        precioUnitario: parseFloat(p.precio_unitario),
      }));

    return res.json({ resumenPorProducto, resumenPorTipo, productosStockBajo });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
}

module.exports = allowCors(handler);
