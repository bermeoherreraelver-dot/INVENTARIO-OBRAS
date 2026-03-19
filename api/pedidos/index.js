const supabase = require('../lib/supabase');
const allowCors = require('../lib/cors');

async function handler(req, res) {
  if (req.method === 'GET') {
    const { estado, tipo, fechaDesde, fechaHasta } = req.query;

    let query = supabase
      .from('pedidos')
      .select('*, productos(id, nombre, categoria, unidad)')
      .order('created_at', { ascending: false });

    if (estado) query = query.eq('estado', estado);
    if (tipo) query = query.eq('tipo', tipo);
    if (fechaDesde) query = query.gte('created_at', fechaDesde);
    if (fechaHasta) query = query.lte('created_at', fechaHasta + 'T23:59:59.999Z');

    const { data: pedidos, error } = await query;

    if (error) {
      return res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
    }

    const resultado = pedidos.map(p => ({
      ...p,
      _id: p.id,
      costoEstimado: parseFloat(p.costo_estimado),
      createdAt: p.created_at,
      producto: p.productos ? {
        _id: p.productos.id,
        nombre: p.productos.nombre,
        categoria: p.productos.categoria,
        unidad: p.productos.unidad,
      } : null,
    }));

    return res.json(resultado);
  }

  if (req.method === 'POST') {
    const { producto: productoId, cantidad, tipo, solicitante, observaciones } = req.body;

    if (!productoId || !cantidad || !tipo) {
      return res.status(400).json({ mensaje: 'Producto, cantidad y tipo son obligatorios' });
    }

    if (!['salida', 'entrada', 'requerimiento'].includes(tipo)) {
      return res.status(400).json({ mensaje: 'Tipo inválido' });
    }

    if (cantidad < 1) {
      return res.status(400).json({ mensaje: 'La cantidad debe ser al menos 1' });
    }

    // Obtener producto
    const { data: producto, error: errProd } = await supabase
      .from('productos')
      .select('*')
      .eq('id', productoId)
      .single();

    if (errProd || !producto) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

    // Validar stock para salidas
    if (tipo === 'salida' && cantidad > producto.cantidad) {
      return res.status(400).json({
        mensaje: `Stock insuficiente. Disponible: ${producto.cantidad} ${producto.unidad}`,
      });
    }

    // Actualizar inventario
    let nuevaCantidad = producto.cantidad;
    if (tipo === 'salida') nuevaCantidad -= cantidad;
    else if (tipo === 'entrada') nuevaCantidad += cantidad;

    if (tipo !== 'requerimiento') {
      await supabase
        .from('productos')
        .update({ cantidad: nuevaCantidad, updated_at: new Date().toISOString() })
        .eq('id', productoId);
    }

    const costoEstimado = cantidad * parseFloat(producto.precio_unitario);

    // Crear pedido
    const { data: pedido, error: errPedido } = await supabase
      .from('pedidos')
      .insert({
        producto_id: productoId,
        cantidad,
        tipo,
        solicitante: solicitante || 'Sin asignar',
        observaciones,
        costo_estimado: costoEstimado,
        estado: tipo === 'requerimiento' ? 'pendiente' : 'completado',
      })
      .select('*, productos(id, nombre, categoria, unidad)')
      .single();

    if (errPedido) {
      return res.status(500).json({ mensaje: 'Error al crear pedido', error: errPedido.message });
    }

    return res.status(201).json({
      mensaje: `${tipo.charAt(0).toUpperCase() + tipo.slice(1)} registrada correctamente`,
      pedido: {
        ...pedido,
        _id: pedido.id,
        costoEstimado: parseFloat(pedido.costo_estimado),
        createdAt: pedido.created_at,
        producto: pedido.productos ? {
          _id: pedido.productos.id,
          nombre: pedido.productos.nombre,
          categoria: pedido.productos.categoria,
          unidad: pedido.productos.unidad,
        } : null,
      },
    });
  }

  return res.status(405).json({ mensaje: 'Método no permitido' });
}

module.exports = allowCors(handler);
