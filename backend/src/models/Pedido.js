const mongoose = require('mongoose');

const pedidoSchema = new mongoose.Schema({
  producto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Producto',
    required: [true, 'El producto es obligatorio'],
  },
  cantidad: {
    type: Number,
    required: [true, 'La cantidad es obligatoria'],
    min: [1, 'La cantidad debe ser al menos 1'],
  },
  tipo: {
    type: String,
    enum: ['salida', 'entrada', 'requerimiento'],
    required: [true, 'El tipo de pedido es obligatorio'],
  },
  estado: {
    type: String,
    enum: ['pendiente', 'completado', 'cancelado'],
    default: 'pendiente',
  },
  solicitante: {
    type: String,
    trim: true,
    default: 'Sin asignar',
  },
  observaciones: {
    type: String,
    trim: true,
  },
  costoEstimado: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Pedido', pedidoSchema);
