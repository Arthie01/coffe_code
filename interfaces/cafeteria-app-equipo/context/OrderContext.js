import React, { createContext, useContext, useState } from 'react';

// Carrito del pedido que el Mesero está armando en este momento.
// El resto de los datos (pedidos, menú, inventario, gastos, pagos) ya NO vive
// aquí en memoria: cada pantalla los pide y los modifica directo en la API.
// Este Context solo sostiene lo que se está construyendo antes de mandarlo
// con POST /v1/pedidos/.
const OrderContext = createContext();

export function OrderProvider({ children }) {
  // Mesa elegida: { id, nombre }
  const [mesa, setMesa] = useState(null);
  // Carrito: [{ id_comida, nombre, precio, cantidad }]
  const [cart, setCart] = useState([]);

  const addToCart = (comida) => {
    setCart((prev) => {
      const existe = prev.find((p) => p.id_comida === comida.id_comida);
      if (existe) {
        return prev.map((p) =>
          p.id_comida === comida.id_comida ? { ...p, cantidad: p.cantidad + 1 } : p
        );
      }
      return [...prev, { ...comida, cantidad: 1 }];
    });
  };

  const restarDelCart = (idComida) => {
    setCart((prev) =>
      prev
        .map((p) => (p.id_comida === idComida ? { ...p, cantidad: p.cantidad - 1 } : p))
        .filter((p) => p.cantidad > 0)
    );
  };

  const clearCart = () => setCart([]);

  const total = cart.reduce((sum, p) => sum + p.precio * p.cantidad, 0);

  return (
    <OrderContext.Provider
      value={{ mesa, setMesa, cart, addToCart, restarDelCart, clearCart, total }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export const useOrders = () => useContext(OrderContext);
