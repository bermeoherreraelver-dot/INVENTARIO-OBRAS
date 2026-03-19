# Inventario Obras - Sistema de Gestión de Materiales y Equipos

Sistema web para el control de inventario de materiales, equipos y EPPs en obras de construcción.

## Requisitos Previos

- **Node.js** v18 o superior
- **MongoDB** corriendo localmente en `mongodb://localhost:27017`

## Inicio Rápido

### 1. Instalar dependencias

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configurar variables de entorno

El archivo `backend/.env` ya está configurado para desarrollo local:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/inventario-obras
JWT_SECRET=tu_clave_secreta_cambiar_en_produccion
```

### 3. Cargar datos de prueba (opcional)

```bash
cd backend
npm run seed
```

Esto crea productos de ejemplo y dos usuarios:
- **Admin:** admin@inventario.com / admin123
- **Almacenero:** almacen@inventario.com / almacen123

### 4. Iniciar la aplicación

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend:
```bash
cd frontend
npm start
```

La aplicación estará disponible en `http://localhost:3000`

## Estructura del Proyecto

```
inventario-obras/
├── backend/
│   └── src/
│       ├── config/       # Conexión a base de datos
│       ├── middleware/    # Autenticación JWT
│       ├── models/       # Modelos: Producto, Pedido, Usuario
│       ├── routes/       # Endpoints de la API
│       ├── utils/        # Script de seed
│       └── server.js     # Punto de entrada
└── frontend/
    └── src/
        ├── components/   # Navbar, Modal
        ├── context/      # AuthContext
        ├── pages/        # Inventario, Pedidos, NuevoPedido, Reportes, Login
        └── services/     # Configuración de Axios
```

## API Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /api/auth/registro | Registrar usuario |
| POST | /api/auth/login | Iniciar sesión |
| GET | /api/productos | Listar productos |
| POST | /api/productos | Crear producto |
| PUT | /api/productos/:id | Actualizar producto |
| DELETE | /api/productos/:id | Eliminar producto |
| GET | /api/pedidos | Listar pedidos |
| POST | /api/pedidos | Crear pedido/movimiento |
| PATCH | /api/pedidos/:id/completar | Completar pedido |
| PATCH | /api/pedidos/:id/cancelar | Cancelar pedido |
| GET | /api/pedidos/reporte/resumen | Reporte con agregaciones |

## Funcionalidades

- Gestión completa de inventario (CRUD de productos)
- Registro de entradas, salidas y requerimientos
- Filtros por categoría, nombre, fecha y estado
- Alertas de stock bajo
- Reportes con gráficos (barras y pie)
- Autenticación con JWT y roles (admin, jefe_obra, almacenero)
- Diseño responsive

## Tecnologías

- **Frontend:** React, React Router, Axios, Recharts
- **Backend:** Node.js, Express, Mongoose
- **Base de datos:** MongoDB
- **Auth:** JWT + bcrypt
