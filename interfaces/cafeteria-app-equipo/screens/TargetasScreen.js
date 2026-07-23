import React, { useState, useCallback } from 'react';
import {
  SafeAreaView, View, Text, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, TextInput, Pressable, ScrollView, Alert, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getPedidos, getMetodosPago, getPagos, crearPago, cambiarEstadoPedido, ESTATUS } from '../services/api';
import colors from '../theme/colors';
import fonts from '../theme/fonts';

// Módulo Caja: cobro de pedidos. Trae los pedidos "Listo" desde la API, se
// elige el método de pago, y al cobrar se registra el pago
// (POST /v1/pagos/ — la API calcula total y cambio) y se marca el pedido como
// "Entregado" (PATCH estado). Solo el Cajero puede cerrar el pedido.
export default function TargetasScreen() {
  const [listos, setListos] = useState([]);
  const [metodos, setMetodos] = useState([]);
  const [ingresos, setIngresos] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [cobrandoId, setCobrandoId] = useState(null);

  // Estado por pedido: método de pago elegido y efectivo recibido
  const [metodoSel, setMetodoSel] = useState({}); // { [pedidoId]: id_metodo }
  const [recibido, setRecibido] = useState({});   // { [pedidoId]: 'texto' }

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      const [pedidosR, metodosR, pagosR] = await Promise.all([
        getPedidos(`?id_estatus=${ESTATUS.LISTO}`),
        getMetodosPago(),
        getPagos(),
      ]);
      setListos(pedidosR.data);
      setMetodos(metodosR.data);
      setIngresos(pagosR.data.reduce((sum, p) => sum + p.monto_total, 0));
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  const metodoDe = (pedidoId) => metodoSel[pedidoId] || metodos[0]?.id || null;
  const esEfectivo = (pedidoId) => metodos.find((m) => m.id === metodoDe(pedidoId))?.nombre === 'Efectivo';

  const cobrar = async (pedido) => {
    const idMetodo = metodoDe(pedido.id);
    if (!idMetodo) {
      Alert.alert('Falta método', 'Elige un método de pago.');
      return;
    }
    const body = { id_pedido: pedido.id, id_metodo_pago: idMetodo };
    if (esEfectivo(pedido.id) && recibido[pedido.id]) {
      body.monto_recibido = parseFloat(recibido[pedido.id]);
    }
    try {
      setCobrandoId(pedido.id);
      const r = await crearPago(body);
      // Cerrar el pedido: marcar Entregado
      await cambiarEstadoPedido(pedido.id, ESTATUS.ENTREGADO);
      const cambio = r.data.cambio || 0;
      Alert.alert('Cobro exitoso', cambio > 0 ? `Cambio a entregar: $${cambio.toFixed(2)}` : 'Pago registrado.');
      cargar();
    } catch (e) {
      Alert.alert('No se pudo cobrar', e.message);
    } finally {
      setCobrandoId(null);
    }
  };

  if (cargando) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando caja...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={80}>
        <ScrollView
          contentContainerStyle={{ padding: 20 }}
          refreshControl={<RefreshControl refreshing={cargando} onRefresh={cargar} colors={[colors.primary]} />}
        >
          <Text style={styles.title}>CAJA</Text>

          <View style={styles.statRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>INGRESOS</Text>
              <Text style={[styles.statValue, { color: colors.primary }]}>${ingresos.toFixed(2)}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>POR COBRAR</Text>
              <Text style={styles.statValue}>{listos.length}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>PEDIDOS LISTOS PARA COBRO</Text>
          {listos.length === 0 && (
            <Text style={styles.empty}>No hay pedidos listos todavía. Cocina debe marcarlos como "Listo".</Text>
          )}

          {listos.map((pedido) => (
            <View key={pedido.id} style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.cardLabel}>Ticket #{pedido.id} · {pedido.mesa}</Text>
                <Text style={[styles.cardAmount, { color: colors.primary }]}>${pedido.precio_total.toFixed(2)}</Text>
              </View>
              <Text style={styles.cardSub}>{pedido.items_count} platillo(s)</Text>

              <Text style={styles.fieldLabel}>Método de pago</Text>
              <View style={styles.chips}>
                {metodos.map((m) => (
                  <Pressable key={m.id} onPress={() => setMetodoSel((p) => ({ ...p, [pedido.id]: m.id }))}
                    style={[styles.chip, metodoDe(pedido.id) === m.id && styles.chipOn]}>
                    <Text style={[styles.chipText, metodoDe(pedido.id) === m.id && styles.chipTextOn]}>{m.nombre}</Text>
                  </Pressable>
                ))}
              </View>

              {esEfectivo(pedido.id) && (
                <TextInput
                  style={styles.input}
                  placeholder={`Efectivo recibido (mín. $${pedido.precio_total.toFixed(2)})`}
                  placeholderTextColor={colors.textSecondary}
                  value={recibido[pedido.id] || ''}
                  onChangeText={(t) => setRecibido((p) => ({ ...p, [pedido.id]: t }))}
                  keyboardType="decimal-pad"
                />
              )}

              <Pressable style={styles.cobrarBtn} onPress={() => cobrar(pedido)} disabled={cobrandoId === pedido.id}>
                {cobrandoId === pedido.id
                  ? <ActivityIndicator color={colors.white} />
                  : <Text style={styles.cobrarBtnText}>COBRAR Y ENTREGAR</Text>}
              </Pressable>
            </View>
          ))}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: colors.textSecondary },
  title: { fontSize: 22, fontFamily: fonts.bold, textTransform: 'uppercase', letterSpacing: 1, color: colors.text, marginBottom: 16 },
  statRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: colors.white, borderRadius: 12, padding: 14 },
  statLabel: { fontSize: 10, color: colors.textSecondary, textTransform: 'uppercase' },
  statValue: { fontSize: 20, fontFamily: fonts.bold, marginTop: 4, color: colors.text },
  empty: { fontSize: 12, color: colors.textSecondary, marginBottom: 16 },
  sectionTitle: { fontSize: 12, color: colors.textSecondary, textTransform: 'uppercase', marginTop: 10, marginBottom: 8 },
  card: { backgroundColor: colors.white, borderRadius: 12, padding: 14, marginBottom: 12 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLabel: { fontFamily: fonts.bold, color: colors.text },
  cardAmount: { fontFamily: fonts.bold, fontSize: 16 },
  cardSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2, marginBottom: 10 },
  fieldLabel: { fontSize: 11, color: colors.textSecondary, textTransform: 'uppercase', marginBottom: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12, color: colors.textSecondary, fontFamily: fonts.medium },
  chipTextOn: { color: colors.white },
  input: {
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 13,
    marginBottom: 10,
    color: colors.text,
  },
  cobrarBtn: { backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 2 },
  cobrarBtnText: { color: colors.white, fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1 },
});
