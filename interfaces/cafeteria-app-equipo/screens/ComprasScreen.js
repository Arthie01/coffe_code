import React, { useState } from 'react';
import {
  SafeAreaView, ScrollView, View, Text, StyleSheet, Pressable, TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOrders } from '../context/OrderContext';
import colors from '../theme/colors';
import fonts from '../theme/fonts';

// Módulo Caja: Compras de suministros. Registra la compra de un ingrediente
// (suma al inventario y genera un gasto automáticamente).
export default function ComprasScreen() {
  const { ingredientes, registrarCompra } = useOrders();
  const [seleccion, setSeleccion] = useState(ingredientes[0]?.id || null);
  const [cantidad, setCantidad] = useState('');
  const [precio, setPrecio] = useState('');

  const ingSel = ingredientes.find((i) => i.id === seleccion);

  const comprar = () => {
    const cant = parseFloat(cantidad);
    const pu = parseFloat(precio);
    if (!seleccion || isNaN(cant) || cant <= 0 || isNaN(pu) || pu <= 0) {
      Alert.alert('Datos incompletos', 'Elige un ingrediente y captura cantidad y precio válidos.');
      return;
    }
    registrarCompra(seleccion, cant, pu);
    Alert.alert('Compra registrada', `Se agregaron ${cant} ${ingSel?.unidad} de ${ingSel?.nombre} al inventario y se generó un gasto de $${(cant * pu).toFixed(2)}.`);
    setCantidad(''); setPrecio('');
  };

  const total = (parseFloat(cantidad) || 0) * (parseFloat(precio) || 0);

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>COMPRAS DE SUMINISTROS</Text>

          <View style={styles.panel}>
            <Text style={styles.fieldLabel}>Ingrediente a comprar</Text>
            <View style={styles.chips}>
              {ingredientes.map((i) => (
                <Pressable key={i.id} onPress={() => setSeleccion(i.id)}
                  style={[styles.chip, seleccion === i.id && styles.chipOn]}>
                  <Text style={[styles.chipText, seleccion === i.id && styles.chipTextOn]}>{i.nombre}</Text>
                </Pressable>
              ))}
            </View>

            {ingSel && (
              <Text style={styles.stockNote}>
                Stock actual: {ingSel.stock} {ingSel.unidad} · mín. {ingSel.minimo} {ingSel.unidad}
              </Text>
            )}

            <Text style={styles.fieldLabel}>Cantidad ({ingSel?.unidad || '—'})</Text>
            <TextInput style={styles.input} placeholder="ej. 5" placeholderTextColor={colors.textSecondary}
              value={cantidad} onChangeText={setCantidad} keyboardType="decimal-pad" />

            <Text style={styles.fieldLabel}>Precio unitario</Text>
            <TextInput style={styles.input} placeholder="ej. 80" placeholderTextColor={colors.textSecondary}
              value={precio} onChangeText={setPrecio} keyboardType="decimal-pad" />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total de la compra</Text>
              <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
            </View>

            <Pressable style={styles.btn} onPress={comprar}>
              <Ionicons name="cart-outline" size={18} color={colors.white} />
              <Text style={styles.btnText}>REGISTRAR COMPRA</Text>
            </Pressable>
          </View>

          <Text style={styles.note}>
            <Ionicons name="information-circle-outline" size={13} color={colors.textSecondary} />
            {' '}La compra suma al inventario y queda registrada como gasto en la sección "Gastos".
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontFamily: fonts.bold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16, color: colors.text },
  panel: { backgroundColor: colors.white, borderRadius: 12, padding: 16, marginBottom: 16 },
  fieldLabel: { fontSize: 11, color: colors.textSecondary, textTransform: 'uppercase', marginBottom: 6, marginTop: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12, color: colors.textSecondary, fontFamily: fonts.medium },
  chipTextOn: { color: colors.white },
  stockNote: { fontSize: 12, color: colors.textSecondary, marginTop: 8, fontFamily: fonts.medium },
  input: { backgroundColor: colors.backgroundLight, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 14, fontSize: 14, color: colors.text, fontFamily: fonts.regular },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 12 },
  totalLabel: { fontSize: 13, color: colors.textSecondary, fontFamily: fonts.medium },
  totalValue: { fontSize: 20, fontFamily: fonts.bold, color: colors.primary },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.primary, borderRadius: 10, padding: 14 },
  btnText: { color: colors.white, fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1 },
  note: { fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
});
