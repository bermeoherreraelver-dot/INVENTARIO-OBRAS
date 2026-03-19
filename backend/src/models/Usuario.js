const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const usuarioSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'El email es obligatorio'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'La contraseña es obligatoria'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
    select: false,
  },
  rol: {
    type: String,
    enum: ['admin', 'jefe_obra', 'almacenero'],
    default: 'almacenero',
  },
}, {
  timestamps: true,
});

usuarioSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

usuarioSchema.methods.verificarPassword = async function (candidata) {
  return await bcrypt.compare(candidata, this.password);
};

module.exports = mongoose.model('Usuario', usuarioSchema);
