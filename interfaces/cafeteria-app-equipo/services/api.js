// Servicio central de conexión con la API Coffee Code.
//
// Misma arquitectura que en PM_204 (usuarioApi): una URL base + `fetch`.
// La diferencia es que esta API está protegida con JWT, así que guardamos el
// token en memoria tras el login y lo mandamos en el header Authorization de
// cada petición. Aquí viven TODAS las llamadas a la API; las pantallas solo
// importan estas funciones.

import { API_URL } from '../config/api';

// ── Sesión en memoria ─────────────────────────────────────────────
let _token = null;     // JWT devuelto por /v1/auth/login
let _usuario = null;   // datos del usuario logueado (id, nombre, rol, ...)

export function getToken() { return _token; }
export function getUsuario() { return _usuario; }
export function cerrarSesion() { _token = null; _usuario = null; }

// ── IDs de catálogo fijos (según el seed de la API) ───────────────
// Se usan para no depender de textos y evitar errores al mandar datos.
export const ESTATUS = {
  ACTIVO: 1, INACTIVO: 2,
  PENDIENTE: 3, EN_PREPARACION: 4, LISTO: 5, ENTREGADO: 6, CANCELADO: 7,
  DISPONIBLE: 8, OCUPADA: 9, RESERVADA: 10,
};
export const CATEGORIA_GASTO_COMPRA = 1; // "Compra de ingredientes"

// ── Wrapper de fetch ──────────────────────────────────────────────
// Arma la URL con la base, agrega headers JSON + Authorization (si hay token),
// serializa el body y devuelve el JSON ya parseado. Si la API responde con
// error, lanza un Error con el mensaje que ella misma manda (detail/mensaje).
export async function apiFetch(endpoint, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && _token) {
    headers.Authorization = `Bearer ${_token}`;
  }

  let respuesta;
  try {
    respuesta = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    console.log('Error de red al llamar a la API:', error);
    throw new Error('No se pudo conectar con el servidor. Revisa la conexión.');
  }

  let datos = null;
  try {
    datos = await respuesta.json();
  } catch (e) {
    datos = null;
  }

  if (!respuesta.ok) {
    const mensaje = datos?.detail || datos?.mensaje || `Error ${respuesta.status}`;
    throw new Error(mensaje);
  }

  return datos;
}

// ══════════════════════════════════════════════════════════════════
// AUTENTICACIÓN
// ══════════════════════════════════════════════════════════════════
export async function login(correo, password) {
  const datos = await apiFetch('/v1/auth/login', {
    method: 'POST',
    auth: false,
    body: { correo, password },
  });
  _token = datos.access_token;
  _usuario = datos.data;
  return datos.data;
}

// ══════════════════════════════════════════════════════════════════
// CATÁLOGOS
// ══════════════════════════════════════════════════════════════════
export const getCategoriasComida = () => apiFetch('/v1/catalogos/categorias-comida');
export const getCategoriasGasto = () => apiFetch('/v1/catalogos/categorias-gasto');
export const getMetodosPago = () => apiFetch('/v1/catalogos/metodos-pago');

// ══════════════════════════════════════════════════════════════════
// MESAS
// ══════════════════════════════════════════════════════════════════
export const getMesas = () => apiFetch('/v1/mesas/');

// ══════════════════════════════════════════════════════════════════
// COMIDAS (menú)
// ══════════════════════════════════════════════════════════════════
export const getComidas = () => apiFetch('/v1/comidas/');
export const crearComida = (data) => apiFetch('/v1/comidas/', { method: 'POST', body: data });
export const actualizarComida = (id, data) => apiFetch(`/v1/comidas/${id}`, { method: 'PATCH', body: data });
export const eliminarComida = (id) => apiFetch(`/v1/comidas/${id}`, { method: 'DELETE' });

// ══════════════════════════════════════════════════════════════════
// INGREDIENTES (inventario)
// ══════════════════════════════════════════════════════════════════
export const getIngredientes = () => apiFetch('/v1/ingredientes/');
export const actualizarIngrediente = (id, data) => apiFetch(`/v1/ingredientes/${id}`, { method: 'PATCH', body: data });

// ══════════════════════════════════════════════════════════════════
// PEDIDOS
// ══════════════════════════════════════════════════════════════════
export const getPedidos = (query = '') => apiFetch(`/v1/pedidos/${query}`);
export const getPedido = (id) => apiFetch(`/v1/pedidos/${id}`);
export const crearPedido = (data) => apiFetch('/v1/pedidos/', { method: 'POST', body: data });
export const cambiarEstadoPedido = (id, idEstatus) =>
  apiFetch(`/v1/pedidos/${id}/estado`, { method: 'PATCH', body: { id_estatus: idEstatus } });

// ══════════════════════════════════════════════════════════════════
// PAGOS (caja)
// ══════════════════════════════════════════════════════════════════
export const getPagos = () => apiFetch('/v1/pagos/');
export const crearPago = (data) => apiFetch('/v1/pagos/', { method: 'POST', body: data });

// ══════════════════════════════════════════════════════════════════
// GASTOS / COMPRAS
// ══════════════════════════════════════════════════════════════════
export const getGastos = () => apiFetch('/v1/gastos/');
export const crearGasto = (data) => apiFetch('/v1/gastos/', { method: 'POST', body: data });

// ══════════════════════════════════════════════════════════════════
// REPORTES (ganancias)
// ══════════════════════════════════════════════════════════════════
export const getGanancias = () => apiFetch('/v1/reportes/ganancias');
