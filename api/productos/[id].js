const supabase = require('../lib/supabase');
const allowCors = require('../lib/cors');

async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    const { data: producto, error } = await supabase
      .from('productos')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !producto) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

    return res.json({
      ...producto,
      _id: producto.id,
      stockMinimo: producto.stock_minimo,
      precioUnitario: parseFloat(producto.precio_unitario),
      stockBajo: producto.cantidad <= producto.stock_minimo,
    });
  }

  if (req.method === 'PUT') {
    const { nombre, categoria, unidad, cantidad, stockMinimo, precioUnitario, ubicacion } = req.body;

    const updateData = {};
    if (nombre !== undefined) updateData.nombre = nombre.trim();
    if (categoria !== undefined) updateData.categoria = categoria;
    if (unidad !== undefined) updateData.unidad = unidad.trim();
    if (cantidad !== undefined) updateData.cantidad = cantidad;
    if (stockMinimo !== undefined) updateData.stock_minimo = stockMinimo;
    if (precioUnitario !== undefined) updateData.precio_unitario = precioUnitario;
    if (ubicacion !== undefined) updateData.ubicacion = ubicacion;
    updateData.updated_at = new Date().toISOString();

    const { data: producto, error } = await supabase
      .from('productos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !producto) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

    return res.json({
      ...producto,
      _id: producto.id,
      stockMinimo: producto.stock_minimo,
      precioUnitario: parseFloat(producto.precio_unitario),
      stockBajo: producto.cantidad <= producto.stock_minimo,
    });
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase
      .from('productos')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({ mensaje: 'Error al eliminar', error: error.message });
    }

    return res.json({ mensaje: 'Producto eliminado correctamente' });
  }

  return res.status(405).json({ mensaje: 'Método no permitido' });
}

module.exports = allowCors(handler);
