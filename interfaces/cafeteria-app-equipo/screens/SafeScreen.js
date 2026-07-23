import React, { useState, useCallback } from 'react';
import { SafeAreaView, ScrollView, View, Text, StyleSheet, Pressable, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getPedidos, getPedido, cambiarEstadoPedido, ESTATUS } from '../services/api';
import colors from '../theme/colors';
import fonts from '../theme/fonts';

// Módulo Cocina: cola de pedidos entrantes desde la API. El Cocinero ve los
// pedidos Pendientes / En preparación y los marca como "Listo"
// (PATCH /v1/pedidos/{id}/estado). Ese es el único cambio de estado que su
// rol puede hacer; de ahí el pedido pasa a Caja.
const ACTIVOS = [ESTATUS.PENDIENTE, ESTATUS.EN_PREPARACION];

export default function SafeScreen() {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      const r = await getPedidos();
      const activos = r.data.filter((p) => ACTIVOS.includes(p.id_estatus));
      // Se pide el detalle de cada pedido para mostrar sus platillos
      const detalles = await Promise.all(activos.map((p) => getPedido(p.id)));
      setPedidos(detalles.map((d) => d.data));
    } catch (e) {
      setPedidos([]);
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  const marcarListo = async (pedido) => {
    try {
      await cambiarEstadoPedido(pedido.id, ESTATUS.LISTO);
      cargar();
    } catch (e) {
      Alert.alert('No se pudo actualizar', e.message);
    }
  };

  if (cargando) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando cocina...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={cargando} onRefresh={cargar} colors={[colors.primary]} />}
      >
        <Text style={styles.title}>PEDIDOS ENTRANTES</Text>

        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>PEDIDOS ACTIVOS</Text>
            <Text style={styles.statValue}>{pedidos.length}</Text>
          </View>
        </View>

        {pedidos.length === 0 && (
          <Text style={styles.empty}>No hay pedidos pendientes por ahora.</Text>
        )}

        {pedidos.map((pedido) => (
          <View key={pedido.id} style={styles.panel}>
            <View style={styles.pedidoHeader}>
              <Text style={styles.rowLabel}>Ticket #{pedido.id} · {pedido.mesa}</Text>
              <View
                style={[
                  styles.badge,
                  pedido.id_estatus === ESTATUS.PENDIENTE && { backgroundColor: '#F5DEB0' },
                  pedido.id_estatus === ESTATUS.EN_PREPARACION && { backgroundColor: '#C9DCF5' },
                ]}
              >
                <Text style={styles.badgeText}>{pedido.estatus?.toUpperCase()}</Text>
              </View>
            </View>
            {pedido.items.map((it) => (
              <Text key={it.id} style={styles.rowSub}>
                {it.cantidad}x {it.nombre}
                {it.observaciones ? ` — ${it.observaciones}` : ''}
              </Text>
            ))}
            {pedido.notas ? <Text style={styles.notas}>Nota: {pedido.notas}</Text> : null}
            <Pressable style={styles.avanzarBtn} onPress={() => marcarListo(pedido)}>
              <Text style={styles.avanzarText}>MARCAR LISTO</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: colors.textSecondary },
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
  rowLabel: { fontFamily: fonts.semibold, color: colors.text },
  rowSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  notas: { fontSize: 12, color: colors.warning, marginTop: 6, fontFamily: fonts.medium },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 10, fontFamily: fonts.bold },
  avanzarBtn: { backgroundColor: colors.primary, borderRadius: 10, padding: 10, alignItems: 'center', marginTop: 10 },
  avanzarText: { color: colors.white, fontFamily: fonts.bold, fontSize: 11 },
});
