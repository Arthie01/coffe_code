import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOrders } from '../context/OrderContext';
import colors from '../theme/colors';
import fonts from '../theme/fonts';

// Módulo Caja: ActivityIndicator mientras "carga" el resumen del día
// y KeyboardAvoidingView para el input de descuento. Cobra pedidos
// que Cocina ya marcó como "Listo", con la opción de aplicar un
// código de descuento a CADA ticket antes de cobrarlo.
export default function TargetasScreen() {
  const { pedidos, actualizarEstado, aplicarDescuento, quitarDescuento } = useOrders();
  const [cargando, setCargando] = useState(true);
  const [codigos, setCodigos] = useState({}); // { [pedidoId]: 'texto que se está escribiendo' }

  useEffect(() => {
    const timer = setTimeout(() => setCargando(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const listos = pedidos.filter((p) => p.estado === 'Listo');
  const pagados = pedidos.filter((p) => p.estado === 'Pagado');
  const ingresos = pagados.reduce((sum, p) => sum + p.total, 0);

  const handleCodigoChange = (id, texto) => {
    setCodigos((prev) => ({ ...prev, [id]: texto }));
  };

  const aplicar = (pedido) => {
    const texto = codigos[pedido.id] || '';
    if (!texto.trim()) return;
    const resultado = aplicarDescuento(pedido.id, texto);
    if (!resultado.ok) {
      Alert.alert('Código inválido', resultado.mensaje);
    }
  };

  const cobrar = (pedido) => {
    Alert.alert('Confirmar cobro', `¿Cobrar $${pedido.total.toFixed(2)} de ${pedido.mesa}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cobrar', onPress: () => actualizarEstado(pedido.id, 'Pagado') },
    ]);
  };

  if (cargando) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando finanzas del día...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={80}
      >
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <Text style={styles.title}>CAJA</Text>

          <View style={styles.statRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>INGRESOS HOY</Text>
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

          {listos.map((pedido) => {
            const tieneDescuento = !!pedido.descuentoCodigo;
            return (
              <View key={pedido.id} style={styles.card}>
                <Text style={styles.cardLabel}>
                  Ticket #{pedido.id} · {pedido.mesa}
                </Text>
                <Text style={styles.cardSub}>{pedido.items.length} platillo(s)</Text>

                {tieneDescuento ? (
                  <View style={styles.descuentoBadge}>
                    <Text style={styles.descuentoBadgeText}>
                      <Ionicons name="pricetag-outline" size={11} color={colors.primaryDark} /> {pedido.descuentoCodigo} · -{(pedido.descuentoPorcentaje * 100).toFixed(0)}%
                    </Text>
                    <Pressable onPress={() => quitarDescuento(pedido.id)}>
                      <Text style={styles.quitarText}>Quitar</Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.discountRow}>
                    <TextInput
                      style={styles.input}
                      placeholder="Código de descuento"
                      placeholderTextColor={colors.textSecondary}
                      value={codigos[pedido.id] || ''}
                      onChangeText={(texto) => handleCodigoChange(pedido.id, texto)}
                      autoCapitalize="characters"
                    />
                    <Pressable style={styles.applyBtn} onPress={() => aplicar(pedido)}>
                      <Text style={styles.applyBtnText}>APLICAR</Text>
                    </Pressable>
                  </View>
                )}

                <View style={styles.cobroRow}>
                  <View>
                    {tieneDescuento && (
                      <Text style={styles.totalOriginal}>${pedido.totalOriginal.toFixed(2)}</Text>
                    )}
                    <Text style={[styles.cardAmount, { color: colors.primary }]}>${pedido.total.toFixed(2)}</Text>
                  </View>
                  <Pressable style={styles.cobrarBtn} onPress={() => cobrar(pedido)}>
                    <Text style={styles.cobrarBtnText}>COBRAR</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}

          <Text style={styles.hint}>
            Códigos válidos para pruebas: CAFE10 (10%), BIENVENIDO (15%), ESTUDIANTE (20%).
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: colors.textSecondary },
  title: {
    fontSize: 22,
    fontFamily: fonts.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: colors.text,
    marginBottom: 16,
  },
  statRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: colors.white, borderRadius: 12, padding: 14 },
  statLabel: { fontSize: 10, color: colors.textSecondary, textTransform: 'uppercase' },
  statValue: { fontSize: 20, fontFamily: fonts.bold, marginTop: 4 },
  empty: { fontSize: 12, color: colors.textSecondary, marginBottom: 16 },
  sectionTitle: { fontSize: 12, color: colors.textSecondary, textTransform: 'uppercase', marginTop: 10, marginBottom: 8 },
  card: { backgroundColor: colors.white, borderRadius: 12, padding: 14, marginBottom: 10 },
  cardLabel: { fontFamily: fonts.bold, color: colors.text },
  cardSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2, marginBottom: 10 },
  discountRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 13,
  },
  applyBtn: { backgroundColor: colors.text, borderRadius: 10, paddingHorizontal: 14, justifyContent: 'center' },
  applyBtnText: { color: colors.white, fontFamily: fonts.bold, fontSize: 11 },
  descuentoBadge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#C9ECD8',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 4,
  },
  descuentoBadgeText: { fontSize: 11, fontFamily: fonts.semibold, color: colors.primaryDark },
  quitarText: { fontSize: 11, color: colors.danger, fontFamily: fonts.semibold },
  cobroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 8 },
  totalOriginal: { fontSize: 11, color: colors.textSecondary, textDecorationLine: 'line-through' },
  cardAmount: { fontFamily: fonts.bold, fontSize: 16 },
  cobrarBtn: { backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  cobrarBtnText: { color: colors.white, fontFamily: fonts.bold, fontSize: 11 },
  hint: { fontSize: 11, color: colors.textSecondary, marginTop: 16, textAlign: 'center' },
});
