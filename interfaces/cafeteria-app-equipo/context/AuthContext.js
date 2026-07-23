import React, { createContext, useContext, useState } from 'react';
import { login as apiLogin, cerrarSesion as apiCerrarSesion } from '../services/api';

// Guarda la sesión del usuario logueado (incluye su ROL). El rol es lo que
// usa el Drawer para mostrar solo las interfaces que le corresponden a cada
// quien (Mesero / Cocinero / Cajero / Admin).
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);

  // Inicia sesión contra la API y guarda el usuario (con su rol).
  const iniciarSesion = async (correo, password) => {
    const datos = await apiLogin(correo, password);
    setUsuario(datos);
    return datos;
  };

  const cerrarSesion = () => {
    apiCerrarSesion();
    setUsuario(null);
  };

  // Rol en texto: "Admin" | "Mesero" | "Cocinero" | "Cajero"
  const rol = usuario?.rol || null;

  return (
    <AuthContext.Provider value={{ usuario, rol, iniciarSesion, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
