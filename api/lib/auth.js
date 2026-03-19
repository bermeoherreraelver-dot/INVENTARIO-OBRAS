const jwt = require('jsonwebtoken');
const supabase = require('./supabase');

const verificarToken = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
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

const generarToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

module.exports = { verificarToken, generarToken };
