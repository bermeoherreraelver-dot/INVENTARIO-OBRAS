const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const JWT_SECRET = process.env.JWT_SECRET;

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Content-Type': 'application/json',
};

const respond = (statusCode, body) => ({
  statusCode,
  headers,
  body: JSON.stringify(body),
});

const verificarToken = async (event) => {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('id, nombre, email, rol')
      .eq('id', decoded.id)
      .single();
    return usuario;
  } catch {
    return null;
  }
};

const formatProducto = (p) => ({
  ...p,
  _id: p.id,
  stockMinimo: p.stock_minimo,
  precioUnitario: parseFloat(p.precio_unitario),
  stockBajo: p.cantidad <= p.stock_minimo,
});

const formatPedido = (p) => ({
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
});

// ============ HANDLERS ============

async function handleLogin(body) {
  const { email, password } = body;
  if (!email || !password) return respond(400, { mensaje: 'Email y contraseña son obligatorios' });

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .single();

  if (!usuario) return respond(401, { mensaje: 'Credenciales incorrectas.' });

  const valid = await bcrypt.compare(password, usuario.password);
  if (!valid) return respond(401, { mensaje: 'Credenciales incorrectas.' });

  const token = jwt.sign({ id: usuario.id }, JWT_SECRET, { expiresIn: '7d' });
  return respond(200, {
    token,
    usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
  });
}

async function handleRegistro(body) {
  const { nombre, email, password, rol } = body;
  if (!nombre || !email || !password) return respond(400, { mensaje: 'Todos los campos son obligatorios' });
  if (password.length < 6) return respond(400, { mensaje: 'Mínimo 6 caracteres' });

  const { data: existente } = await supabase.from('usuarios').select('id').eq('email', email.toLowerCase().trim()).single();
  if (existente) return respond(400, { mensaje: 'El email ya está registrado.' });

  const hashed = await bcrypt.hash(password, 12);
  const { data: usuario, error } = await supabase
    .from('usuarios')
    .insert({ nombre: nombre.trim(), email: email.toLowerCase().trim(), password: hashed, rol: rol || 'almacenero' })
    .select('id, nombre, email, rol')
    .single();

  if (error) return respond(500, { mensaje: 'Error al crear usuario', error: error.message });

  const token = jwt.sign({ id: usuario.id }, JWT_SECRET, { expiresIn: '7d' });
  return respond(201, { token, usuario });
}

async function handleGetProductos(params) {
  let query = supabase.from('productos').select('*').order('nombre');
  if (params.buscar) query = query.ilike('nombre', `%${params.buscar}%`);
  if (params.categoria) query = query.eq('categoria', params.categoria);

  const { data, error } = await query;
  if (error) return respond(500, { mensaje: 'Error', error: error.message });

  let resultado = (data || []).map(formatProducto);
  if (params.stockBajo === 'true') resultado = resultado.filter(p => p.stockBajo);
  return respond(200, resultado);
}

async function handleCrearProducto(body) {
  const { nombre, categoria, unidad, cantidad, stockMinimo, precioUnitario, ubicacion } = body;
  if (!nombre || !categoria || !unidad) return respond(400, { mensaje: 'Nombre, categoría y unidad son obligatorios' });

  const { data, error } = await supabase
    .from('productos')
    .insert({
      nombre: nombre.trim(), categoria, unidad: unidad.trim(),
      cantidad: cantidad || 0, stock_minimo: stockMinimo || 5,
      precio_unitario: precioUnitario || 0, ubicacion: ubicacion || 'Almacén principal',
    })
    .select().single();

  if (error) {
    if (error.code === '23505') return respond(400, { mensaje: 'Ya existe un producto con ese nombre.' });
    return respond(500, { mensaje: 'Error', error: error.message });
  }
  return respond(201, formatProducto(data));
}

async function handleUpdateProducto(id, body) {
  const updateData = {};
  if (body.nombre !== undefined) updateData.nombre = body.nombre.trim();
  if (body.categoria !== undefined) updateData.categoria = body.categoria;
  if (body.unidad !== undefined) updateData.unidad = body.unidad.trim();
  if (body.cantidad !== undefined) updateData.cantidad = body.cantidad;
  if (body.stockMinimo !== undefined) updateData.stock_minimo = body.stockMinimo;
  if (body.precioUnitario !== undefined) updateData.precio_unitario = body.precioUnitario;
  if (body.ubicacion !== undefined) updateData.ubicacion = body.ubicacion;
  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabase.from('productos').update(updateData).eq('id', id).select().single();
  if (error || !data) return respond(404, { mensaje: 'Producto no encontrado' });
  return respond(200, formatProducto(data));
}

async function handleDeleteProducto(id) {
  const { error } = await supabase.from('productos').delete().eq('id', id);
  if (error) return respond(500, { mensaje: 'Error', error: error.message });
  return respond(200, { mensaje: 'Producto eliminado correctamente' });
}

async function handleGetPedidos(params) {
  let query = supabase.from('pedidos').select('*, productos(id, nombre, categoria, unidad)').order('created_at', { ascending: false });
  if (params.estado) query = query.eq('estado', params.estado);
  if (params.tipo) query = query.eq('tipo', params.tipo);
  if (params.fechaDesde) query = query.gte('created_at', params.fechaDesde);
  if (params.fechaHasta) query = query.lte('created_at', params.fechaHasta + 'T23:59:59.999Z');

  const { data, error } = await query;
  if (error) return respond(500, { mensaje: 'Error', error: error.message });
  return respond(200, (data || []).map(formatPedido));
}

async function handleCrearPedido(body) {
  const { producto: productoId, cantidad, tipo, solicitante, observaciones } = body;
  if (!productoId || !cantidad || !tipo) return respond(400, { mensaje: 'Producto, cantidad y tipo son obligatorios' });
  if (!['salida', 'entrada', 'requerimiento'].includes(tipo)) return respond(400, { mensaje: 'Tipo inválido' });
  if (cantidad < 1) return respond(400, { mensaje: 'La cantidad debe ser al menos 1' });

  const { data: producto } = await supabase.from('productos').select('*').eq('id', productoId).single();
  if (!producto) return respond(404, { mensaje: 'Producto no encontrado' });

  if (tipo === 'salida' && cantidad > producto.cantidad) {
    return respond(400, { mensaje: `Stock insuficiente. Disponible: ${producto.cantidad} ${producto.unidad}` });
  }

  if (tipo === 'salida') {
    await supabase.from('productos').update({ cantidad: producto.cantidad - cantidad, updated_at: new Date().toISOString() }).eq('id', productoId);
  } else if (tipo === 'entrada') {
    await supabase.from('productos').update({ cantidad: producto.cantidad + cantidad, updated_at: new Date().toISOString() }).eq('id', productoId);
  }

  const costoEstimado = cantidad * parseFloat(producto.precio_unitario);
  const { data: pedido, error } = await supabase
    .from('pedidos')
    .insert({
      producto_id: productoId, cantidad, tipo,
      solicitante: solicitante || 'Sin asignar', observaciones,
      costo_estimado: costoEstimado,
      estado: tipo === 'requerimiento' ? 'pendiente' : 'completado',
    })
    .select('*, productos(id, nombre, categoria, unidad)')
    .single();

  if (error) return respond(500, { mensaje: 'Error', error: error.message });
  return respond(201, {
    mensaje: `${tipo.charAt(0).toUpperCase() + tipo.slice(1)} registrada correctamente`,
    pedido: formatPedido(pedido),
  });
}

async function handleAccionPedido(id, accion) {
  const { data: pedido } = await supabase.from('pedidos').select('*, productos(id, nombre, categoria, unidad, cantidad)').eq('id', id).single();
  if (!pedido) return respond(404, { mensaje: 'Pedido no encontrado' });

  if (accion === 'completar') {
    if (pedido.estado === 'completado') return respond(400, { mensaje: 'El pedido ya está completado' });
    if (pedido.tipo === 'requerimiento' && pedido.productos) {
      await supabase.from('productos').update({ cantidad: pedido.productos.cantidad + pedido.cantidad, updated_at: new Date().toISOString() }).eq('id', pedido.producto_id);
    }
    const { data } = await supabase.from('pedidos').update({ estado: 'completado', updated_at: new Date().toISOString() }).eq('id', id).select('*, productos(id, nombre, categoria, unidad)').single();
    return respond(200, { mensaje: 'Pedido completado', pedido: formatPedido(data) });
  }

  if (accion === 'cancelar') {
    if (pedido.estado !== 'pendiente') return respond(400, { mensaje: 'Solo se pueden cancelar pedidos pendientes' });
    await supabase.from('pedidos').update({ estado: 'cancelado', updated_at: new Date().toISOString() }).eq('id', id);
    return respond(200, { mensaje: 'Pedido cancelado' });
  }

  return respond(400, { mensaje: 'Acción inválida' });
}

async function handleReporte(params) {
  let queryPedidos = supabase.from('pedidos').select('*, productos(id, nombre, categoria)').eq('estado', 'completado');
  if (params.fechaDesde) queryPedidos = queryPedidos.gte('created_at', params.fechaDesde);
  if (params.fechaHasta) queryPedidos = queryPedidos.lte('created_at', params.fechaHasta + 'T23:59:59.999Z');
  const { data: pedidos } = await queryPedidos;

  const porProducto = {};
  (pedidos || []).forEach(p => {
    const nombre = p.productos?.nombre || 'N/A';
    if (!porProducto[nombre]) porProducto[nombre] = { nombre, categoria: p.productos?.categoria, totalCantidad: 0, totalCosto: 0, numeroPedidos: 0 };
    porProducto[nombre].totalCantidad += p.cantidad;
    porProducto[nombre].totalCosto += parseFloat(p.costo_estimado || 0);
    porProducto[nombre].numeroPedidos += 1;
  });

  let queryTodos = supabase.from('pedidos').select('tipo, costo_estimado');
  if (params.fechaDesde) queryTodos = queryTodos.gte('created_at', params.fechaDesde);
  if (params.fechaHasta) queryTodos = queryTodos.lte('created_at', params.fechaHasta + 'T23:59:59.999Z');
  const { data: todosPedidos } = await queryTodos;

  const porTipo = {};
  (todosPedidos || []).forEach(p => {
    if (!porTipo[p.tipo]) porTipo[p.tipo] = { _id: p.tipo, total: 0, costoTotal: 0 };
    porTipo[p.tipo].total += 1;
    porTipo[p.tipo].costoTotal += parseFloat(p.costo_estimado || 0);
  });

  const { data: todosProductos } = await supabase.from('productos').select('*');
  const productosStockBajo = (todosProductos || []).filter(p => p.cantidad <= p.stock_minimo).map(formatProducto);

  return respond(200, {
    resumenPorProducto: Object.values(porProducto).sort((a, b) => b.totalCantidad - a.totalCantidad),
    resumenPorTipo: Object.values(porTipo),
    productosStockBajo,
  });
}

// ============ ROUTER ============

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const path = event.path.replace('/.netlify/functions/api', '');
  const method = event.httpMethod;
  const body = event.body ? JSON.parse(event.body) : {};
  const params = event.queryStringParameters || {};

  try {
    // AUTH
    if (path === '/auth/login' && method === 'POST') return await handleLogin(body);
    if (path === '/auth/registro' && method === 'POST') return await handleRegistro(body);
    if (path === '/auth/perfil' && method === 'GET') {
      const usuario = await verificarToken(event);
      if (!usuario) return respond(401, { mensaje: 'No autorizado' });
      return respond(200, { usuario });
    }

    // PRODUCTOS
    if (path === '/productos' && method === 'GET') return await handleGetProductos(params);
    if (path === '/productos' && method === 'POST') return await handleCrearProducto(body);

    const productoMatch = path.match(/^\/productos\/(.+)$/);
    if (productoMatch) {
      const id = productoMatch[1];
      if (method === 'GET') {
        const { data } = await supabase.from('productos').select('*').eq('id', id).single();
        if (!data) return respond(404, { mensaje: 'Producto no encontrado' });
        return respond(200, formatProducto(data));
      }
      if (method === 'PUT') return await handleUpdateProducto(id, body);
      if (method === 'DELETE') return await handleDeleteProducto(id);
    }

    // PEDIDOS
    if (path === '/pedidos/reporte' && method === 'GET') return await handleReporte(params);
    if (path === '/pedidos' && method === 'GET') return await handleGetPedidos(params);
    if (path === '/pedidos' && method === 'POST') return await handleCrearPedido(body);

    const pedidoMatch = path.match(/^\/pedidos\/(.+)$/);
    if (pedidoMatch && method === 'PATCH') {
      return await handleAccionPedido(pedidoMatch[1], body.accion);
    }

    // HEALTH
    if (path === '/health') return respond(200, { status: 'ok', timestamp: new Date().toISOString() });

    return respond(404, { mensaje: 'Ruta no encontrada' });
  } catch (error) {
    return respond(500, { mensaje: 'Error del servidor', error: error.message });
  }
};
