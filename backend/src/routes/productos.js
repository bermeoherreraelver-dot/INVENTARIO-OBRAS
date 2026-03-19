const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Producto = require('../models/Producto');

const router = express.Router();

// GET /api/productos - Listar todos con filtros
router.get('/', async (req, res) => {
  try {
    const { buscar, categoria, stockBajo } = req.query;
    const filtro = {};

    if (buscar) {
      filtro.nombre = { $regex: buscar, $options: 'i' };
    }
    if (categoria) {
      filtro.categoria = categoria;
    }

    let productos = await Producto.find(filtro).sort({ nombre: 1 });

    if (stockBajo === 'true') {
      productos = productos.filter(p => p.cantidad <= p.stockMinimo);
    }

    res.json(productos);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
});

// GET /api/productos/:id
router.get('/:id', async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id);
    if (!producto) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }
    res.json(producto);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
});

// POST /api/productos
router.post('/', [
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio'),
  body('categoria').isIn(['material', 'equipo', 'epp']).withMessage('Categoría inválida'),
  body('unidad').trim().notEmpty().withMessage('La unidad es obligatoria'),
  body('cantidad').isInt({ min: 0 }).withMessage('Cantidad debe ser >= 0'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errores: errors.array() });
    }

    const producto = await Producto.create(req.body);
    res.status(201).json(producto);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ mensaje: 'Ya existe un producto con ese nombre.' });
    }
    res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
});

// PUT /api/productos/:id
router.put('/:id', async (req, res) => {
  try {
    const producto = await Producto.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!producto) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }
    res.json(producto);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
});

// DELETE /api/productos/:id
router.delete('/:id', async (req, res) => {
  try {
    const producto = await Producto.findByIdAndDelete(req.params.id);
    if (!producto) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }
    res.json({ mensaje: 'Producto eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
});

module.exports = router;
