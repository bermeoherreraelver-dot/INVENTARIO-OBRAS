-- =============================================
-- EJECUTAR ESTE SQL EN SUPABASE > SQL EDITOR
-- =============================================

-- 1. Tabla de usuarios
CREATE TABLE usuarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'almacenero' CHECK (rol IN ('admin', 'jefe_obra', 'almacenero')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de productos (inventario)
CREATE TABLE productos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT UNIQUE NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN ('material', 'equipo', 'epp')),
  unidad TEXT NOT NULL,
  cantidad INTEGER NOT NULL DEFAULT 0 CHECK (cantidad >= 0),
  stock_minimo INTEGER NOT NULL DEFAULT 5 CHECK (stock_minimo >= 0),
  precio_unitario DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (precio_unitario >= 0),
  ubicacion TEXT DEFAULT 'Almacén principal',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de pedidos/movimientos
CREATE TABLE pedidos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  cantidad INTEGER NOT NULL CHECK (cantidad >= 1),
  tipo TEXT NOT NULL CHECK (tipo IN ('salida', 'entrada', 'requerimiento')),
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'completado', 'cancelado')),
  solicitante TEXT DEFAULT 'Sin asignar',
  observaciones TEXT,
  costo_estimado DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Habilitar RLS (Row Level Security) pero permitir todo por ahora
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todo en usuarios" ON usuarios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo en productos" ON productos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo en pedidos" ON pedidos FOR ALL USING (true) WITH CHECK (true);

-- 5. Datos de prueba: Productos
INSERT INTO productos (nombre, categoria, unidad, cantidad, stock_minimo, precio_unitario, ubicacion) VALUES
  ('Cemento Portland Tipo I', 'material', 'bolsas', 150, 20, 28.50, 'Almacén principal'),
  ('Arena fina', 'material', 'm3', 30, 5, 45.00, 'Patio de materiales'),
  ('Arena gruesa', 'material', 'm3', 25, 5, 50.00, 'Patio de materiales'),
  ('Piedra chancada 1/2"', 'material', 'm3', 20, 5, 65.00, 'Patio de materiales'),
  ('Fierro corrugado 1/2"', 'material', 'varillas', 200, 30, 32.00, 'Almacén principal'),
  ('Fierro corrugado 3/8"', 'material', 'varillas', 180, 30, 18.50, 'Almacén principal'),
  ('Alambre negro N°16', 'material', 'kg', 50, 10, 5.80, 'Almacén principal'),
  ('Ladrillo King Kong', 'material', 'millares', 8, 2, 650.00, 'Patio de materiales'),
  ('Tubo PVC 4" x 3m', 'material', 'unidades', 40, 10, 35.00, 'Almacén principal'),
  ('Cable THW 14 AWG', 'material', 'metros', 500, 100, 2.50, 'Almacén eléctrico'),
  ('Mezcladora de concreto 9p3', 'equipo', 'unidades', 2, 1, 8500.00, 'Patio de equipos'),
  ('Vibrador de concreto', 'equipo', 'unidades', 3, 1, 2800.00, 'Patio de equipos'),
  ('Amoladora 7"', 'equipo', 'unidades', 4, 2, 450.00, 'Almacén de herramientas'),
  ('Taladro percutor', 'equipo', 'unidades', 3, 1, 380.00, 'Almacén de herramientas'),
  ('Nivel topográfico', 'equipo', 'unidades', 1, 1, 3500.00, 'Oficina técnica'),
  ('Casco de seguridad', 'epp', 'unidades', 30, 10, 25.00, 'Almacén EPP'),
  ('Guantes de cuero', 'epp', 'pares', 40, 15, 12.00, 'Almacén EPP'),
  ('Lentes de seguridad', 'epp', 'unidades', 35, 10, 8.50, 'Almacén EPP'),
  ('Botas de seguridad', 'epp', 'pares', 3, 5, 85.00, 'Almacén EPP'),
  ('Chaleco reflectivo', 'epp', 'unidades', 25, 10, 15.00, 'Almacén EPP'),
  ('Arnés de seguridad', 'epp', 'unidades', 4, 3, 180.00, 'Almacén EPP');

-- 6. Usuarios de prueba (passwords hasheados con bcrypt: admin123 y almacen123)
INSERT INTO usuarios (nombre, email, password, rol) VALUES
  ('Administrador', 'admin@inventario.com', '$2a$12$F0UT14RnoSlASb.KfguTWOVVuVXOCMeMuoPgoMzfdCNQF3MYVrkhK', 'admin'),
  ('Juan Almacenero', 'almacen@inventario.com', '$2a$12$b3L1rmv22G1C3MSzT98nEu.JGSS8MWL6uZTzFjEhJe27n5/9uLQZy', 'almacenero');
