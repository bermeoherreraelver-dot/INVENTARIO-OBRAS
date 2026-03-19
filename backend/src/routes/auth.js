const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Usuario = require('../models/Usuario');
const { proteger } = require('../middleware/auth');

const router = express.Router();

const generarToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// POST /api/auth/registro
router.post('/registro', [
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio'),
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('Mínimo 6 caracteres'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errores: errors.array() });
    }

    const { nombre, email, password, rol } = req.body;

    const existente = await Usuario.findOne({ email });
    if (existente) {
      return res.status(400).json({ mensaje: 'El email ya está registrado.' });
    }

    const usuario = await Usuario.create({ nombre, email, password, rol });
    const token = generarToken(usuario._id);

    res.status(201).json({
      token,
      usuario: { id: usuario._id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
});

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('La contraseña es obligatoria'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errores: errors.array() });
    }

    const { email, password } = req.body;
    const usuario = await Usuario.findOne({ email }).select('+password');

    if (!usuario || !(await usuario.verificarPassword(password))) {
      return res.status(401).json({ mensaje: 'Credenciales incorrectas.' });
    }

    const token = generarToken(usuario._id);

    res.json({
      token,
      usuario: { id: usuario._id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
});

// GET /api/auth/perfil
router.get('/perfil', proteger, async (req, res) => {
  res.json({ usuario: req.usuario });
});

module.exports = router;
