const supabase = require('../lib/supabase');
const allowCors = require('../lib/cors');

async function handler(req, res) {
  if (req.method === 'GET') {
    const { buscar, categoria, stockBajo } = req.query;

    let query = supabase.from('productos').select('*').order('nombre');

    if (buscar) {
      query = query.ilike('nombre', `%${buscar}%`);
    }
    if (categoria) {
      query = query.eq('categoria', categoria);
    }

    const { data: productos, error } = await query;

    if (error) {
      return res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
    }

    let resultado = productos.map(p => ({
      ...p,
      _id: p.id,
      stockMinimo: p.stock_minimo,
      precioUnitario: parseFloat(p.precio_unitario),
      stockBajo: p.cantidad <= p.stock_minimo,
    }));

    if (stockBajo === 'true') {
      resultado = resultado.filter(p => p.stockBajo);
    }

    return res.json(resultado);
  }

  if (req.method === 'POST') {
    const { nombre, categoria, unidad, cantidad, stockMinimo, precioUnitario, ubicacion } = req.body;

    if (!nombre || !categoria || !unidad) {
      return res.status(400).json({ mensaje: 'Nombre, categoría y unidad son obligatorios' });
    }

    const { data: producto, error } = await supabase
      .from('productos')
      .insert({
        nombre: nombre.trim(),
        categoria,
        unidad: unidad.trim(),
        cantidad: cantidad || 0,
        stock_minimo: stockMinimo || 5,
        precio_unitario: precioUnitario || 0,
        ubicacion: ubicacion || 'Almacén principal',
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ mensaje: 'Ya existe un producto con ese nombre.' });
      }
      return res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
    }

    return res.status(201).json({
      ...producto,
      _id: producto.id,
      stockMinimo: producto.stock_minimo,
      precioUnitario: parseFloat(producto.precio_unitario),
      stockBajo: producto.cantidad <= producto.stock_minimo,
    });
  }

  return res.status(405).json({ mensaje: 'Método no permitido' });
}

module.exports = allowCors(handler);
