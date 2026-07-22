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
// armando y la lista de pedidos ya enviados, además del menú, el inventario
// de suministros y los gastos, para que Mesero, Cocina y Caja vean y
// modifiquen la misma información en tiempo real.
export function OrderProvider({ children }) {
  const [cart, setCart] = useState([]); // [{id, nombre, precio, cantidad}]
  const [mesaActual, setMesaActual] = useState(null);
  const [pedidos, setPedidos] = useState([]); // [{id, mesa, items, total, estado, fecha}]
  const [siguienteId, setSiguienteId] = useState(1001);

  // ── Menú (gestión del menú) ─────────────────────────────
  const [menu, setMenu] = useState([
    { id: 'm1', nombre: 'Americano', precio: 35, categoria: 'Bebidas calientes', disponible: true },
    { id: 'm2', nombre: 'Capuccino', precio: 45, categoria: 'Bebidas calientes', disponible: true },
    { id: 'm3', nombre: 'Frappé Mocha', precio: 55, categoria: 'Frappés', disponible: true },
    { id: 'm4', nombre: 'Croissant Almendras', precio: 45, categoria: 'Postres', disponible: true },
    { id: 'm5', nombre: 'Pastel de Zanahoria', precio: 60, categoria: 'Postres', disponible: false },
  ]);
  const agregarPlatillo = (p) => setMenu((prev) => [{ id: 'm' + Date.now(), disponible: true, ...p }, ...prev]);
  const editarPlatillo = (id, cambios) => setMenu((prev) => prev.map((m) => (m.id === id ? { ...m, ...cambios } : m)));
  const eliminarPlatillo = (id) => setMenu((prev) => prev.filter((m) => m.id !== id));
  const toggleDisponible = (id) => setMenu((prev) => prev.map((m) => (m.id === id ? { ...m, disponible: !m.disponible } : m)));

  // ── Inventario de suministros ───────────────────────────
  const [ingredientes, setIngredientes] = useState([
    { id: 'i1', nombre: 'Café molido', unidad: 'kg', stock: 5, minimo: 1 },
    { id: 'i2', nombre: 'Leche entera', unidad: 'L', stock: 20, minimo: 5 },
    { id: 'i3', nombre: 'Azúcar', unidad: 'kg', stock: 8, minimo: 2 },
    { id: 'i4', nombre: 'Chocolate en polvo', unidad: 'kg', stock: 0.4, minimo: 0.5 },
    { id: 'i5', nombre: 'Harina', unidad: 'kg', stock: 4, minimo: 1 },
    { id: 'i6', nombre: 'Mantequilla', unidad: 'kg', stock: 0.3, minimo: 0.5 },
    { id: 'i7', nombre: 'Fresas', unidad: 'kg', stock: 2, minimo: 0.5 },
  ]);
  const ajustarStock = (id, delta) =>
    setIngredientes((prev) =>
      prev.map((i) => (i.id === id ? { ...i, stock: Math.max(0, +(i.stock + delta).toFixed(2)) } : i))
    );

  // ── Gastos ──────────────────────────────────────────────
  const [gastos, setGastos] = useState([]);
  const registrarGasto = (g) => setGastos((prev) => [{ id: 'g' + Date.now(), fecha: new Date(), ...g }, ...prev]);

  // ── Compras de suministros (suma al stock + registra gasto) ──
  const registrarCompra = (idIngrediente, cantidad, precioUnitario) => {
    const ing = ingredientes.find((i) => i.id === idIngrediente);
    ajustarStock(idIngrediente, cantidad);
    registrarGasto({
      categoria: 'Compra de suministros',
      descripcion: `${cantidad} ${ing?.unidad || ''} de ${ing?.nombre || 'ingrediente'}`,
      monto: +(cantidad * precioUnitario).toFixed(2),
    });
  };

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
        // menú
        menu,
        agregarPlatillo,
        editarPlatillo,
        eliminarPlatillo,
        toggleDisponible,
        // inventario
        ingredientes,
        ajustarStock,
        // gastos y compras
        gastos,
        registrarGasto,
        registrarCompra,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export const useOrders = () => useContext(OrderContext);
