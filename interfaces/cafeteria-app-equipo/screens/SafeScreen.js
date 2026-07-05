import React, { useState } from 'react';
import { SafeAreaView, ScrollView, View, Text, StyleSheet, Pressable, Switch } from 'react-native';
import { useOrders } from '../context/OrderContext';
import colors from '../theme/colors';
import fonts from '../theme/fonts';

const menuInicial = [
  { id: '1', nombre: 'Croissant Almendras', precio: 45, activo: true },
  { id: '2', nombre: 'Pastel de Zanahoria', precio: 60, activo: true },
  { id: '3', nombre: 'Frappé Mocha', precio: 55, activo: false },
];

// Módulo Cocina: usa SafeAreaView + ScrollView. Muestra los pedidos
// reales que llegan desde Mesero (Context) y permite avanzar su estado,
// además de un switch de disponibilidad por platillo.
export default function SafeScreen() {
  const { pedidos, actualizarEstado } = useOrders();
  const [menu, setMenu] = useState(menuInicial);

  const toggleMenu = (id) =>
    setMenu((prev) => prev.map((m) => (m.id === id ? { ...m, activo: !m.activo } : m)));

  const avanzarEstado = (pedido) => {
    const siguiente = pedido.estado === 'Pendiente' ? 'En preparación' : 'Listo';
    actualizarEstado(pedido.id, siguiente);
  };

  const pendientes = pedidos.filter((p) => p.estado !== 'Pagado');

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>PEDIDOS ENTRANTES</Text>

        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>PEDIDOS ACTIVOS</Text>
            <Text style={styles.statValue}>{pendientes.length}</Text>
          </View>
        </View>

        {pendientes.length === 0 && (
          <Text style={styles.empty}>No hay pedidos pendientes por ahora. Ve a "Nuevo Pedido" para crear uno.</Text>
        )}

        {pendientes.map((pedido) => (
          <View key={pedido.id} style={styles.panel}>
            <View style={styles.pedidoHeader}>
              <Text style={styles.rowLabel}>
                Ticket #{pedido.id} · {pedido.mesa}
              </Text>
              <View
                style={[
                  styles.badge,
                  pedido.estado === 'Pendiente' && { backgroundColor: '#F5DEB0' },
                  pedido.estado === 'En preparación' && { backgroundColor: '#C9DCF5' },
                  pedido.estado === 'Listo' && { backgroundColor: '#C9ECD8' },
                ]}
              >
                <Text style={styles.badgeText}>{pedido.estado.toUpperCase()}</Text>
              </View>
            </View>
            {pedido.items.map((it) => (
              <Text key={it.id} style={styles.rowSub}>
                {it.cantidad}x {it.nombre}
              </Text>
            ))}
            {pedido.estado !== 'Listo' && (
              <Pressable style={styles.avanzarBtn} onPress={() => avanzarEstado(pedido)}>
                <Text style={styles.avanzarText}>
                  {pedido.estado === 'Pendiente' ? 'MARCAR EN PREPARACIÓN' : 'MARCAR LISTO'}
                </Text>
              </Pressable>
            )}
          </View>
        ))}

        <Text style={styles.sectionTitle}>DISPONIBILIDAD DEL MENÚ</Text>
        <View style={styles.panel}>
          {menu.map((item) => (
            <View key={item.id} style={styles.row}>
              <View>
                <Text style={styles.rowLabel}>{item.nombre}</Text>
                <Text style={styles.rowSub}>${item.precio.toFixed(2)} MXN</Text>
              </View>
              <Switch
                value={item.activo}
                onValueChange={() => toggleMenu(item.id)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 20, paddingBottom: 40 },
  title: {
    fontSize: 22,
    fontFamily: fonts.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
    color: colors.text,
  },
  statRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: colors.white, borderRadius: 12, padding: 14 },
  statLabel: { fontSize: 10, color: colors.textSecondary, textTransform: 'uppercase' },
  statValue: { fontSize: 22, fontFamily: fonts.bold, color: colors.text, marginTop: 4 },
  empty: { fontSize: 12, color: colors.textSecondary, marginBottom: 20 },
  panel: { backgroundColor: colors.white, borderRadius: 12, padding: 14, marginBottom: 14 },
  pedidoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  rowLabel: { fontFamily: fonts.semibold, color: colors.text },
  rowSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 10, fontFamily: fonts.bold },
  avanzarBtn: { backgroundColor: colors.primary, borderRadius: 10, padding: 10, alignItems: 'center', marginTop: 10 },
  avanzarText: { color: colors.white, fontFamily: fonts.bold, fontSize: 11 },
  sectionTitle: { fontSize: 12, color: colors.textSecondary, textTransform: 'uppercase', marginBottom: 8, marginTop: 6 },
});
