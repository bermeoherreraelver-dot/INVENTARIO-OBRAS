const allowCors = require('./lib/cors');

async function handler(req, res) {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
}

module.exports = allowCors(handler);
