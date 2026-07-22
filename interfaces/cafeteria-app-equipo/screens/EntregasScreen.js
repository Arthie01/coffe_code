import React from 'react';
import { SafeAreaView, ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOrders } from '../context/OrderContext';
import colors from '../theme/colors';
import fonts from '../theme/fonts';

// Módulo Mesero: Surtido / entrega de pedidos al cliente. Muestra los
// pedidos que Cocina ya marcó como "Listo" y permite entregarlos.
export default function EntregasScreen() {
  const { pedidos, actualizarEstado } = useOrders();
  const listos = pedidos.filter((p) => p.estado === 'Listo');
  const entregados = pedidos.filter((p) => p.estado === 'Entregado');

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>ENTREGAS AL CLIENTE</Text>

        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>POR ENTREGAR</Text>
            <Text style={styles.statValue}>{listos.length}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>ENTREGADOS</Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>{entregados.length}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>LISTOS EN COCINA</Text>
        {listos.length === 0 && (
          <Text style={styles.empty}>No hay pedidos listos por entregar. Espera a que Cocina marque alguno como "Listo".</Text>
        )}

        {listos.map((pedido) => (
          <View key={pedido.id} style={styles.panel}>
            <View style={styles.rowTop}>
              <Text style={styles.rowLabel}>Ticket #{pedido.id} · {pedido.mesa}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>LISTO</Text>
              </View>
            </View>
            {pedido.items.map((it) => (
              <Text key={it.id} style={styles.rowSub}>{it.cantidad}x {it.nombre}</Text>
            ))}
            <Pressable style={styles.entregarBtn} onPress={() => actualizarEstado(pedido.id, 'Entregado')}>
              <Ionicons name="checkmark-done-outline" size={16} color={colors.white} />
              <Text style={styles.entregarText}>MARCAR ENTREGADO</Text>
            </Pressable>
          </View>
        ))}

        {entregados.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>ENTREGADOS (PENDIENTES DE COBRO)</Text>
            {entregados.map((pedido) => (
              <View key={pedido.id} style={styles.rowDone}>
                <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                <Text style={styles.doneText}>Ticket #{pedido.id} · {pedido.mesa}</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontFamily: fonts.bold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16, color: colors.text },
  statRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: colors.white, borderRadius: 12, padding: 14 },
  statLabel: { fontSize: 10, color: colors.textSecondary, textTransform: 'uppercase' },
  statValue: { fontSize: 22, fontFamily: fonts.bold, color: colors.text, marginTop: 4 },
  sectionTitle: { fontSize: 12, color: colors.textSecondary, textTransform: 'uppercase', marginBottom: 10, marginTop: 6 },
  empty: { fontSize: 12, color: colors.textSecondary, marginBottom: 20 },
  panel: { backgroundColor: colors.white, borderRadius: 12, padding: 14, marginBottom: 14 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  rowLabel: { fontFamily: fonts.semibold, color: colors.text },
  rowSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  badge: { backgroundColor: '#C9ECD8', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 10, fontFamily: fonts.bold, color: colors.primaryDark },
  entregarBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.primary, borderRadius: 10, padding: 10, marginTop: 10 },
  entregarText: { color: colors.white, fontFamily: fonts.bold, fontSize: 11, letterSpacing: 1 },
  rowDone: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.white, borderRadius: 10, padding: 12, marginBottom: 8 },
  doneText: { fontFamily: fonts.medium, color: colors.text, fontSize: 13 },
});
