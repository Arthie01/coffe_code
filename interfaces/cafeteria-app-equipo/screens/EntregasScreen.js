import React, { useState, useCallback } from 'react';
import { SafeAreaView, ScrollView, View, Text, StyleSheet, Pressable, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getPedidos, cambiarEstadoPedido, ESTATUS } from '../services/api';
import colors from '../theme/colors';
import fonts from '../theme/fonts';

// Módulo Mesero: seguimiento de pedidos. El mesero toma los pedidos que están
// "Pendiente" y los envía a cocina (PATCH estado -> "En preparación"), que es
// la única transición que su rol tiene permitida. Los demás estados se
// muestran solo como seguimiento.
export default function EntregasScreen() {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      const r = await getPedidos();
      setPedidos(r.data);
    } catch (e) {
      setPedidos([]);
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  const enviarACocina = async (pedido) => {
    try {
      await cambiarEstadoPedido(pedido.id, ESTATUS.EN_PREPARACION);
      cargar();
    } catch (e) {
      Alert.alert('No se pudo enviar', e.message);
    }
  };

  const pendientes = pedidos.filter((p) => p.id_estatus === ESTATUS.PENDIENTE);
  const enCurso = pedidos.filter((p) =>
    [ESTATUS.EN_PREPARACION, ESTATUS.LISTO].includes(p.id_estatus)
  );

  if (cargando) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando pedidos...</Text>
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
        <Text style={styles.title}>MIS PEDIDOS</Text>

        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>POR ENVIAR</Text>
            <Text style={styles.statValue}>{pendientes.length}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>EN CURSO</Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>{enCurso.length}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>PENDIENTES DE ENVIAR A COCINA</Text>
        {pendientes.length === 0 && (
          <Text style={styles.empty}>No hay pedidos pendientes. Crea uno en "Nuevo Pedido".</Text>
        )}
        {pendientes.map((pedido) => (
          <View key={pedido.id} style={styles.panel}>
            <View style={styles.rowTop}>
              <Text style={styles.rowLabel}>Ticket #{pedido.id} · {pedido.mesa}</Text>
              <Text style={styles.monto}>${pedido.precio_total.toFixed(2)}</Text>
            </View>
            <Text style={styles.rowSub}>{pedido.items_count} platillo(s)</Text>
            <Pressable style={styles.enviarBtn} onPress={() => enviarACocina(pedido)}>
              <Ionicons name="send-outline" size={15} color={colors.white} />
              <Text style={styles.enviarText}>ENVIAR A COCINA</Text>
            </Pressable>
          </View>
        ))}

        {enCurso.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>EN CURSO</Text>
            {enCurso.map((pedido) => (
              <View key={pedido.id} style={styles.rowDone}>
                <Ionicons
                  name={pedido.id_estatus === ESTATUS.LISTO ? 'checkmark-circle' : 'time-outline'}
                  size={18}
                  color={pedido.id_estatus === ESTATUS.LISTO ? colors.primary : colors.warning}
                />
                <Text style={styles.doneText}>Ticket #{pedido.id} · {pedido.mesa}</Text>
                <Text style={styles.doneEstado}>{pedido.estatus}</Text>
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
  center: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: colors.textSecondary },
  scroll: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontFamily: fonts.bold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16, color: colors.text },
  statRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: colors.white, borderRadius: 12, padding: 14 },
  statLabel: { fontSize: 10, color: colors.textSecondary, textTransform: 'uppercase' },
  statValue: { fontSize: 22, fontFamily: fonts.bold, color: colors.text, marginTop: 4 },
  sectionTitle: { fontSize: 12, color: colors.textSecondary, textTransform: 'uppercase', marginBottom: 10, marginTop: 6 },
  empty: { fontSize: 12, color: colors.textSecondary, marginBottom: 20 },
  panel: { backgroundColor: colors.white, borderRadius: 12, padding: 14, marginBottom: 14 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  rowLabel: { fontFamily: fonts.semibold, color: colors.text },
  rowSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  monto: { fontFamily: fonts.bold, color: colors.primary },
  enviarBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.primary, borderRadius: 10, padding: 10, marginTop: 10 },
  enviarText: { color: colors.white, fontFamily: fonts.bold, fontSize: 11, letterSpacing: 1 },
  rowDone: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.white, borderRadius: 10, padding: 12, marginBottom: 8 },
  doneText: { fontFamily: fonts.medium, color: colors.text, fontSize: 13, flex: 1 },
  doneEstado: { fontSize: 11, fontFamily: fonts.semibold, color: colors.textSecondary },
});
