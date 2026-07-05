import React, { createContext, useContext, useState } from 'react';

const OrderContext = createContext();

// Códigos de descuento válidos y su porcentaje. Cuando conecten el API,
// esto se reemplaza por una consulta real (ej. GET /descuentos/:codigo).
const CODIGOS_DESCUENTO = {
  CAFE10: 0.1,
  BIENVENIDO: 0.15,
  ESTUDIANTE: 0.2,
};

// Este Context es el "cerebro" de la app: guarda el carrito que se está
// armando y la lista de pedidos ya enviados, para que Mesero, Cocina y
// Caja vean y modifiquen la misma información en tiempo real.
export function OrderProvider({ children }) {
  const [cart, setCart] = useState([]); // [{id, nombre, precio, cantidad}]
  const [mesaActual, setMesaActual] = useState(null);
  const [pedidos, setPedidos] = useState([]); // [{id, mesa, items, total, estado, fecha}]
  const [siguienteId, setSiguienteId] = useState(1001);

  const addToCart = (producto) => {
    setCart((prev) => {
      const existe = prev.find((p) => p.id === producto.id);
      if (existe) {
        return prev.map((p) =>
          p.id === producto.id ? { ...p, cantidad: p.cantidad + 1 } : p
        );
      }
      return [...prev, { ...producto, cantidad: 1 }];
    });
  };

  const clearCart = () => setCart([]);

  const submitOrder = () => {
    if (cart.length === 0) return null;
    const total = cart.reduce((sum, p) => sum + p.precio * p.cantidad * 1.16, 0);
    const nuevoPedido = {
      id: siguienteId,
      mesa: mesaActual || 'Para llevar',
      items: cart,
      total,
      totalOriginal: total,
      descuentoCodigo: null,
      descuentoPorcentaje: 0,
      estado: 'Pendiente',
      fecha: new Date(),
    };
    setPedidos((prev) => [nuevoPedido, ...prev]);
    setSiguienteId((id) => id + 1);
    clearCart();
    setMesaActual(null);
    return nuevoPedido;
  };

  const actualizarEstado = (id, estado) => {
    setPedidos((prev) => prev.map((p) => (p.id === id ? { ...p, estado } : p)));
  };

  // Valida el código y, si existe, recalcula el total de ESE pedido
  // (siempre a partir del total original, para poder quitar/cambiar el
  // descuento sin arrastrar errores de redondeo).
  const aplicarDescuento = (id, codigoIngresado) => {
    const codigo = codigoIngresado.trim().toUpperCase();
    const porcentaje = CODIGOS_DESCUENTO[codigo];

    if (!porcentaje) {
      return { ok: false, mensaje: 'Código inválido o vencido.' };
    }

    let nuevoTotal = 0;
    setPedidos((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const base = p.totalOriginal ?? p.total;
        nuevoTotal = base * (1 - porcentaje);
        return {
          ...p,
          total: nuevoTotal,
          totalOriginal: base,
          descuentoCodigo: codigo,
          descuentoPorcentaje: porcentaje,
        };
      })
    );

    return { ok: true, porcentaje, mensaje: `Descuento del ${porcentaje * 100}% aplicado.` };
  };

  const quitarDescuento = (id) => {
    setPedidos((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const base = p.totalOriginal ?? p.total;
        return { ...p, total: base, descuentoCodigo: null, descuentoPorcentaje: 0 };
      })
    );
  };

  return (
    <OrderContext.Provider
      value={{
        cart,
        addToCart,
        clearCart,
        mesaActual,
        setMesaActual,
        pedidos,
        submitOrder,
        actualizarEstado,
        aplicarDescuento,
        quitarDescuento,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export const useOrders = () => useContext(OrderContext);
