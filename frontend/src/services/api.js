import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Productos
export const getProductos = (params) => api.get('/productos', { params });
export const getProducto = (id) => api.get(`/productos/${id}`);
export const crearProducto = (data) => api.post('/productos', data);
export const actualizarProducto = (id, data) => api.put(`/productos/${id}`, data);
export const eliminarProducto = (id) => api.delete(`/productos/${id}`);

// Pedidos
export const getPedidos = (params) => api.get('/pedidos', { params });
export const crearPedido = (data) => api.post('/pedidos', data);
export const completarPedido = (id) => api.patch(`/pedidos/${id}/completar`);
export const cancelarPedido = (id) => api.patch(`/pedidos/${id}/cancelar`);
export const getReporteResumen = (params) => api.get('/pedidos/reporte/resumen', { params });

// Auth
export const login = (data) => api.post('/auth/login', data);
export const registro = (data) => api.post('/auth/registro', data);
export const getPerfil = () => api.get('/auth/perfil');

export default api;
