import React, { useState, useCallback } from 'react';
import {
  SafeAreaView, ScrollView, View, Text, StyleSheet, Pressable, TextInput, Alert, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getIngredientes, crearGasto, CATEGORIA_GASTO_COMPRA } from '../services/api';
import colors from '../theme/colors';
import fonts from '../theme/fonts';

// Módulo Caja: Compras de suministros. Registra la compra de un ingrediente
// como un gasto con detalle de compra (POST /v1/gastos/ con compra_ingredientes).
// La API suma la cantidad al stock del ingrediente automáticamente.
export default function ComprasScreen() {
  const [ingredientes, setIngredientes] = useState([]);
  const [seleccion, setSeleccion] = useState(null);
  const [cantidad, setCantidad] = useState('');
  const [precio, setPrecio] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      const r = await getIngredientes();
      setIngredientes(r.data);
      setSeleccion((prev) => prev || r.data[0]?.id || null);
    } catch (e) {
      setIngredientes([]);
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  const ingSel = ingredientes.find((i) => i.id === seleccion);

  const comprar = async () => {
    const cant = parseFloat(cantidad);
    const pu = parseFloat(precio);
    if (!seleccion || isNaN(cant) || cant <= 0 || isNaN(pu) || pu < 0) {
      Alert.alert('Datos incompletos', 'Elige un ingrediente y captura cantidad y precio válidos.');
      return;
    }
    const monto = +(cant * pu).toFixed(2);
    try {
      setGuardando(true);
      await crearGasto({
        id_categoria_gasto: CATEGORIA_GASTO_COMPRA,
        descripcion: `Compra de ${cant} ${ingSel?.unidad_medida} de ${ingSel?.nombre}`,
        monto,
        compra_ingredientes: [{ id_ingrediente: seleccion, cantidad: cant, precio_unitario: pu }],
      });
      Alert.alert('Compra registrada', `Se agregaron ${cant} ${ingSel?.unidad_medida} de ${ingSel?.nombre} al inventario y se generó un gasto de $${monto.toFixed(2)}.`);
      setCantidad(''); setPrecio('');
      cargar();
    } catch (e) {
      Alert.alert('No se pudo registrar', e.message);
    } finally {
      setGuardando(false);
    }
  };

  const total = (parseFloat(cantidad) || 0) * (parseFloat(precio) || 0);

  if (cargando) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando suministros...</Text>
      </SafeAreaView>
    );
  }

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
                Stock actual: {parseFloat(ingSel.stock_actual)} {ingSel.unidad_medida} · mín. {parseFloat(ingSel.stock_minimo)} {ingSel.unidad_medida}
              </Text>
            )}

            <Text style={styles.fieldLabel}>Cantidad ({ingSel?.unidad_medida || '—'})</Text>
            <TextInput style={styles.input} placeholder="ej. 5" placeholderTextColor={colors.textSecondary}
              value={cantidad} onChangeText={setCantidad} keyboardType="decimal-pad" />

            <Text style={styles.fieldLabel}>Precio unitario</Text>
            <TextInput style={styles.input} placeholder="ej. 80" placeholderTextColor={colors.textSecondary}
              value={precio} onChangeText={setPrecio} keyboardType="decimal-pad" />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total de la compra</Text>
              <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
            </View>

            <Pressable style={styles.btn} onPress={comprar} disabled={guardando}>
              {guardando ? <ActivityIndicator color={colors.white} /> : (
                <>
                  <Ionicons name="cart-outline" size={18} color={colors.white} />
                  <Text style={styles.btnText}>REGISTRAR COMPRA</Text>
                </>
              )}
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
  center: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: colors.textSecondary },
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
