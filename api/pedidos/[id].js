const supabase = require('../lib/supabase');
const allowCors = require('../lib/cors');

async function handler(req, res) {
  const { id } = req.query;

  // Extraer acción de la URL (completar o cancelar)
  // Vercel pasa el path completo, necesitamos parsear
  const url = req.url || '';

  if (req.method === 'PATCH') {
    const { data: pedido, error: errBuscar } = await supabase
      .from('pedidos')
      .select('*, productos(id, nombre, categoria, unidad, cantidad)')
      .eq('id', id)
      .single();

    if (errBuscar || !pedido) {
      return res.status(404).json({ mensaje: 'Pedido no encontrado' });
    }

    const { accion } = req.body;

    if (accion === 'completar') {
      if (pedido.estado === 'completado') {
        return res.status(400).json({ mensaje: 'El pedido ya está completado' });
      }

      // Si es requerimiento, al completar se registra como entrada
      if (pedido.tipo === 'requerimiento' && pedido.productos) {
        await supabase
          .from('productos')
          .update({
            cantidad: pedido.productos.cantidad + pedido.cantidad,
            updated_at: new Date().toISOString(),
          })
          .eq('id', pedido.producto_id);
      }

      const { data: actualizado } = await supabase
        .from('pedidos')
        .update({ estado: 'completado', updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('*, productos(id, nombre, categoria, unidad)')
        .single();

      return res.json({
        mensaje: 'Pedido completado',
        pedido: {
          ...actualizado,
          _id: actualizado.id,
          costoEstimado: parseFloat(actualizado.costo_estimado),
          createdAt: actualizado.created_at,
          producto: actualizado.productos ? {
            _id: actualizado.productos.id,
            nombre: actualizado.productos.nombre,
          } : null,
        },
      });
    }

    if (accion === 'cancelar') {
      if (pedido.estado !== 'pendiente') {
        return res.status(400).json({ mensaje: 'Solo se pueden cancelar pedidos pendientes' });
      }

      await supabase
        .from('pedidos')
        .update({ estado: 'cancelado', updated_at: new Date().toISOString() })
        .eq('id', id);

      return res.json({ mensaje: 'Pedido cancelado' });
    }

    return res.status(400).json({ mensaje: 'Acción inválida. Use "completar" o "cancelar"' });
  }

  return res.status(405).json({ mensaje: 'Método no permitido' });
}

module.exports = allowCors(handler);
