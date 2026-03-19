const bcrypt = require('bcryptjs');
const supabase = require('../lib/supabase');
const { generarToken } = require('../lib/auth');
const allowCors = require('../lib/cors');

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ mensaje: 'Método no permitido' });
  }

  const { nombre, email, password, rol } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ mensaje: 'Nombre, email y contraseña son obligatorios' });
  }

  if (password.length < 6) {
    return res.status(400).json({ mensaje: 'La contraseña debe tener al menos 6 caracteres' });
  }

  const { data: existente } = await supabase
    .from('usuarios')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .single();

  if (existente) {
    return res.status(400).json({ mensaje: 'El email ya está registrado.' });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const { data: usuario, error } = await supabase
    .from('usuarios')
    .insert({
      nombre: nombre.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      rol: rol || 'almacenero',
    })
    .select('id, nombre, email, rol')
    .single();

  if (error) {
    return res.status(500).json({ mensaje: 'Error al crear usuario', error: error.message });
  }

  const token = generarToken(usuario.id);

  res.status(201).json({ token, usuario });
}

module.exports = allowCors(handler);
