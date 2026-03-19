const mongoose = require('mongoose');

const productoSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre del producto es obligatorio'],
    trim: true,
    unique: true,
  },
  categoria: {
    type: String,
    enum: ['material', 'equipo', 'epp'],
    required: [true, 'La categoría es obligatoria'],
  },
  unidad: {
    type: String,
    required: [true, 'La unidad de medida es obligatoria'],
    trim: true,
  },
  cantidad: {
    type: Number,
    required: true,
    default: 0,
    min: [0, 'La cantidad no puede ser negativa'],
  },
  stockMinimo: {
    type: Number,
    default: 5,
    min: 0,
  },
  precioUnitario: {
    type: Number,
    default: 0,
    min: 0,
  },
  ubicacion: {
    type: String,
    trim: true,
    default: 'Almacén principal',
  },
}, {
  timestamps: true,
});

productoSchema.virtual('stockBajo').get(function () {
  return this.cantidad <= this.stockMinimo;
});

productoSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Producto', productoSchema);
