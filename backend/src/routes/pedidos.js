const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Pedido = require('../models/Pedido');
const Producto = require('../models/Producto');

const router = express.Router();

// GET /api/pedidos - Listar con filtros
router.get('/', async (req, res) => {
  try {
    const { estado, tipo, fechaDesde, fechaHasta } = req.query;
    const filtro = {};

    if (estado) filtro.estado = estado;
    if (tipo) filtro.tipo = tipo;

    if (fechaDesde || fechaHasta) {
      filtro.createdAt = {};
      if (fechaDesde) filtro.createdAt.$gte = new Date(fechaDesde);
      if (fechaHasta) filtro.createdAt.$lte = new Date(fechaHasta + 'T23:59:59.999Z');
    }

    const pedidos = await Pedido.find(filtro)
      .populate('producto', 'nombre categoria unidad')
      .sort({ createdAt: -1 });

    res.json(pedidos);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
});

// POST /api/pedidos - Crear pedido
router.post('/', [
  body('producto').notEmpty().withMessage('El producto es obligatorio'),
  body('cantidad').isInt({ min: 1 }).withMessage('La cantidad debe ser al menos 1'),
  body('tipo').isIn(['salida', 'entrada', 'requerimiento']).withMessage('Tipo inválido'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errores: errors.array() });
    }

    const { producto: productoId, cantidad, tipo, solicitante, observaciones } = req.body;

    const producto = await Producto.findById(productoId);
    if (!producto) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

    // Validar stock para salidas
    if (tipo === 'salida' && cantidad > producto.cantidad) {
      return res.status(400).json({
        mensaje: `Stock insuficiente. Disponible: ${producto.cantidad} ${producto.unidad}`,
      });
    }

    // Actualizar inventario según tipo
    if (tipo === 'salida') {
      producto.cantidad -= cantidad;
    } else if (tipo === 'entrada') {
      producto.cantidad += cantidad;
    }
    // 'requerimiento' no modifica stock hasta que se complete

    await producto.save();

    const costoEstimado = cantidad * producto.precioUnitario;

    const pedido = await Pedido.create({
      producto: productoId,
      cantidad,
      tipo,
      solicitante,
      observaciones,
      costoEstimado,
      estado: tipo === 'requerimiento' ? 'pendiente' : 'completado',
    });

    const pedidoPopulado = await pedido.populate('producto', 'nombre categoria unidad');

    res.status(201).json({
      mensaje: `${tipo.charAt(0).toUpperCase() + tipo.slice(1)} registrada correctamente`,
      pedido: pedidoPopulado,
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
});

// PATCH /api/pedidos/:id/completar - Marcar como completado
router.patch('/:id/completar', async (req, res) => {
  try {
    const pedido = await Pedido.findById(req.params.id);
    if (!pedido) {
      return res.status(404).json({ mensaje: 'Pedido no encontrado' });
    }

    if (pedido.estado === 'completado') {
      return res.status(400).json({ mensaje: 'El pedido ya está completado' });
    }

    // Si es requerimiento, al completar se registra como entrada
    if (pedido.tipo === 'requerimiento') {
      const producto = await Producto.findById(pedido.producto);
      if (producto) {
        producto.cantidad += pedido.cantidad;
        await producto.save();
      }
    }

    pedido.estado = 'completado';
    await pedido.save();

    const pedidoPopulado = await pedido.populate('producto', 'nombre categoria unidad');

    res.json({ mensaje: 'Pedido completado', pedido: pedidoPopulado });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
});

// PATCH /api/pedidos/:id/cancelar
router.patch('/:id/cancelar', async (req, res) => {
  try {
    const pedido = await Pedido.findById(req.params.id);
    if (!pedido) {
      return res.status(404).json({ mensaje: 'Pedido no encontrado' });
    }

    if (pedido.estado !== 'pendiente') {
      return res.status(400).json({ mensaje: 'Solo se pueden cancelar pedidos pendientes' });
    }

    pedido.estado = 'cancelado';
    await pedido.save();

    res.json({ mensaje: 'Pedido cancelado' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
});

// GET /api/pedidos/reporte/resumen
router.get('/reporte/resumen', async (req, res) => {
  try {
    const { fechaDesde, fechaHasta } = req.query;
    const filtroFecha = {};

    if (fechaDesde || fechaHasta) {
      filtroFecha.createdAt = {};
      if (fechaDesde) filtroFecha.createdAt.$gte = new Date(fechaDesde);
      if (fechaHasta) filtroFecha.createdAt.$lte = new Date(fechaHasta + 'T23:59:59.999Z');
    }

    const [resumenPorProducto, resumenPorTipo, productosStockBajo] = await Promise.all([
      Pedido.aggregate([
        { $match: { ...filtroFecha, estado: 'completado' } },
        { $group: {
          _id: '$producto',
          totalCantidad: { $sum: '$cantidad' },
          totalCosto: { $sum: '$costoEstimado' },
          numeroPedidos: { $sum: 1 },
        }},
        { $lookup: { from: 'productos', localField: '_id', foreignField: '_id', as: 'producto' } },
        { $unwind: '$producto' },
        { $project: {
          nombre: '$producto.nombre',
          categoria: '$producto.categoria',
          totalCantidad: 1,
          totalCosto: 1,
          numeroPedidos: 1,
        }},
        { $sort: { totalCantidad: -1 } },
      ]),
      Pedido.aggregate([
        { $match: filtroFecha },
        { $group: {
          _id: '$tipo',
          total: { $sum: 1 },
          costoTotal: { $sum: '$costoEstimado' },
        }},
      ]),
      Producto.find({ $expr: { $lte: ['$cantidad', '$stockMinimo'] } }),
    ]);

    res.json({
      resumenPorProducto,
      resumenPorTipo,
      productosStockBajo,
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
});

module.exports = router;
