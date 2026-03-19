require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns');
const bcrypt = require('bcryptjs');

dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const Producto = require('../models/Producto');
const Usuario = require('../models/Usuario');

const productos = [
  { nombre: 'Cemento Portland Tipo I', categoria: 'material', unidad: 'bolsas', cantidad: 150, stockMinimo: 20, precioUnitario: 28.50, ubicacion: 'Almacén principal' },
  { nombre: 'Arena fina', categoria: 'material', unidad: 'm3', cantidad: 30, stockMinimo: 5, precioUnitario: 45.00, ubicacion: 'Patio de materiales' },
  { nombre: 'Arena gruesa', categoria: 'material', unidad: 'm3', cantidad: 25, stockMinimo: 5, precioUnitario: 50.00, ubicacion: 'Patio de materiales' },
  { nombre: 'Piedra chancada 1/2"', categoria: 'material', unidad: 'm3', cantidad: 20, stockMinimo: 5, precioUnitario: 65.00, ubicacion: 'Patio de materiales' },
  { nombre: 'Fierro corrugado 1/2"', categoria: 'material', unidad: 'varillas', cantidad: 200, stockMinimo: 30, precioUnitario: 32.00, ubicacion: 'Almacén principal' },
  { nombre: 'Fierro corrugado 3/8"', categoria: 'material', unidad: 'varillas', cantidad: 180, stockMinimo: 30, precioUnitario: 18.50, ubicacion: 'Almacén principal' },
  { nombre: 'Alambre negro N°16', categoria: 'material', unidad: 'kg', cantidad: 50, stockMinimo: 10, precioUnitario: 5.80, ubicacion: 'Almacén principal' },
  { nombre: 'Ladrillo King Kong', categoria: 'material', unidad: 'millares', cantidad: 8, stockMinimo: 2, precioUnitario: 650.00, ubicacion: 'Patio de materiales' },
  { nombre: 'Tubo PVC 4" x 3m', categoria: 'material', unidad: 'unidades', cantidad: 40, stockMinimo: 10, precioUnitario: 35.00, ubicacion: 'Almacén principal' },
  { nombre: 'Cable THW 14 AWG', categoria: 'material', unidad: 'metros', cantidad: 500, stockMinimo: 100, precioUnitario: 2.50, ubicacion: 'Almacén eléctrico' },
  { nombre: 'Mezcladora de concreto 9p3', categoria: 'equipo', unidad: 'unidades', cantidad: 2, stockMinimo: 1, precioUnitario: 8500.00, ubicacion: 'Patio de equipos' },
  { nombre: 'Vibrador de concreto', categoria: 'equipo', unidad: 'unidades', cantidad: 3, stockMinimo: 1, precioUnitario: 2800.00, ubicacion: 'Patio de equipos' },
  { nombre: 'Amoladora 7"', categoria: 'equipo', unidad: 'unidades', cantidad: 4, stockMinimo: 2, precioUnitario: 450.00, ubicacion: 'Almacén de herramientas' },
  { nombre: 'Taladro percutor', categoria: 'equipo', unidad: 'unidades', cantidad: 3, stockMinimo: 1, precioUnitario: 380.00, ubicacion: 'Almacén de herramientas' },
  { nombre: 'Nivel topográfico', categoria: 'equipo', unidad: 'unidades', cantidad: 1, stockMinimo: 1, precioUnitario: 3500.00, ubicacion: 'Oficina técnica' },
  { nombre: 'Casco de seguridad', categoria: 'epp', unidad: 'unidades', cantidad: 30, stockMinimo: 10, precioUnitario: 25.00, ubicacion: 'Almacén EPP' },
  { nombre: 'Guantes de cuero', categoria: 'epp', unidad: 'pares', cantidad: 40, stockMinimo: 15, precioUnitario: 12.00, ubicacion: 'Almacén EPP' },
  { nombre: 'Lentes de seguridad', categoria: 'epp', unidad: 'unidades', cantidad: 35, stockMinimo: 10, precioUnitario: 8.50, ubicacion: 'Almacén EPP' },
  { nombre: 'Botas de seguridad', categoria: 'epp', unidad: 'pares', cantidad: 3, stockMinimo: 5, precioUnitario: 85.00, ubicacion: 'Almacén EPP' },
  { nombre: 'Chaleco reflectivo', categoria: 'epp', unidad: 'unidades', cantidad: 25, stockMinimo: 10, precioUnitario: 15.00, ubicacion: 'Almacén EPP' },
  { nombre: 'Arnés de seguridad', categoria: 'epp', unidad: 'unidades', cantidad: 4, stockMinimo: 3, precioUnitario: 180.00, ubicacion: 'Almacén EPP' },
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado a MongoDB');

    await Producto.deleteMany({});
    await Usuario.deleteMany({});

    await Producto.insertMany(productos);
    console.log(`${productos.length} productos insertados`);

    await Usuario.create({
      nombre: 'Administrador',
      email: 'admin@inventario.com',
      password: 'admin123',
      rol: 'admin',
    });
    await Usuario.create({
      nombre: 'Juan Almacenero',
      email: 'almacen@inventario.com',
      password: 'almacen123',
      rol: 'almacenero',
    });
    console.log('Usuarios creados');

    console.log('\n=== DATOS DE ACCESO ===');
    console.log('Admin: admin@inventario.com / admin123');
    console.log('Almacenero: almacen@inventario.com / almacen123');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

seedDB();
