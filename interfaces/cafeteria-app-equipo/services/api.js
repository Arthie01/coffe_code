// Servicio central de conexión con la API Coffee Code.
//
// Misma arquitectura que en PM_204 (usuarioApi): se define una URL base y se
// consume la API con `fetch`. La diferencia es que esta API está protegida con
// JWT, así que guardamos el token en memoria tras el login y lo mandamos en el
// header Authorization de cada petición.

import { API_URL } from '../config/api';

// ── Sesión en memoria ─────────────────────────────────────────────
let _token = null;     // JWT devuelto por /v1/auth/login
let _usuario = null;   // datos del usuario logueado (id, nombre, rol, ...)

export function setToken(token) { _token = token; }
export function getToken() { return _token; }
export function getUsuario() { return _usuario; }
export function cerrarSesion() { _token = null; _usuario = null; }

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
    // Falla de red: la API no responde (IP mal puesta, sin conexión, etc.)
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

// ── Autenticación ─────────────────────────────────────────────────
// Llama a POST /v1/auth/login, guarda el token y los datos del usuario,
// y devuelve el usuario. Lanza Error si las credenciales son incorrectas.
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

// ── Ejemplos de consumo de la API ─────────────────────────────────
// Una vez logueado, el token viaja solo. Agrega aquí las funciones que
// necesiten las pantallas, siguiendo el mismo patrón:
//
//   export const getMenu     = () => apiFetch('/v1/comidas/');
//   export const getPedidos  = () => apiFetch('/v1/pedidos/');
//   export const crearPedido = (pedido) => apiFetch('/v1/pedidos/', { method: 'POST', body: pedido });
