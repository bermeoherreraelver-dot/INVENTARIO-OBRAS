const { verificarToken } = require('../lib/auth');
const allowCors = require('../lib/cors');

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ mensaje: 'Método no permitido' });
  }

  const usuario = await verificarToken(req);
  if (!usuario) {
    return res.status(401).json({ mensaje: 'No autorizado' });
  }

  res.json({ usuario });
}

module.exports = allowCors(handler);
