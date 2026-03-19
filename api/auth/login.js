const bcrypt = require('bcryptjs');
const supabase = require('../lib/supabase');
const { generarToken } = require('../lib/auth');
const allowCors = require('../lib/cors');

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ mensaje: 'Método no permitido' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ mensaje: 'Email y contraseña son obligatorios' });
  }

  const { data: usuario, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .single();

  if (error || !usuario) {
    return res.status(401).json({ mensaje: 'Credenciales incorrectas.' });
  }

  const passwordValida = await bcrypt.compare(password, usuario.password);
  if (!passwordValida) {
    return res.status(401).json({ mensaje: 'Credenciales incorrectas.' });
  }

  const token = generarToken(usuario.id);

  res.json({
    token,
    usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
  });
}

module.exports = allowCors(handler);
