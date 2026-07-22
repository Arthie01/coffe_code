import React, { useState } from 'react';
import {
  SafeAreaView, ScrollView, View, Text, StyleSheet, Pressable, TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOrders } from '../context/OrderContext';
import colors from '../theme/colors';
import fonts from '../theme/fonts';

const CATEGORIAS = ['Suministros', 'Mantenimiento', 'Servicios', 'Nómina', 'Otros'];

// Módulo Caja: Gastos. Registra y consulta los gastos operativos de la
// cafetería (gestión monetaria).
export default function GastosScreen() {
  const { gastos, registrarGasto } = useOrders();
  const [categoria, setCategoria] = useState(CATEGORIAS[0]);
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');

  const totalGastos = gastos.reduce((sum, g) => sum + g.monto, 0);

  const registrar = () => {
    const montoNum = parseFloat(monto);
    if (!descripcion.trim() || isNaN(montoNum) || montoNum <= 0) {
      Alert.alert('Datos incompletos', 'Escribe una descripción y un monto válido.');
      return;
    }
    registrarGasto({ categoria, descripcion: descripcion.trim(), monto: montoNum });
    setDescripcion(''); setMonto('');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>GASTOS</Text>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>TOTAL DE GASTOS</Text>
            <Text style={styles.statValue}>${totalGastos.toFixed(2)}</Text>
          </View>

          <View style={styles.panel}>
            <Text style={styles.formTitle}>REGISTRAR GASTO</Text>
            <Text style={styles.fieldLabel}>Categoría</Text>
            <View style={styles.chips}>
              {CATEGORIAS.map((c) => (
                <Pressable key={c} onPress={() => setCategoria(c)}
                  style={[styles.chip, categoria === c && styles.chipOn]}>
                  <Text style={[styles.chipText, categoria === c && styles.chipTextOn]}>{c}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput style={styles.input} placeholder="Descripción" placeholderTextColor={colors.textSecondary}
              value={descripcion} onChangeText={setDescripcion} />
            <TextInput style={styles.input} placeholder="Monto (ej. 500)" placeholderTextColor={colors.textSecondary}
              value={monto} onChangeText={setMonto} keyboardType="decimal-pad" />
            <Pressable style={styles.btn} onPress={registrar}>
              <Ionicons name="add" size={18} color={colors.white} />
              <Text style={styles.btnText}>REGISTRAR GASTO</Text>
            </Pressable>
          </View>

          <Text style={styles.sectionTitle}>HISTORIAL</Text>
          {gastos.length === 0 && <Text style={styles.empty}>Aún no hay gastos registrados.</Text>}
          {gastos.map((g) => (
            <View key={g.id} style={styles.gastoRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>{g.descripcion}</Text>
                <Text style={styles.rowSub}>{g.categoria}</Text>
              </View>
              <Text style={styles.monto}>- ${g.monto.toFixed(2)}</Text>
            </View>
          ))}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontFamily: fonts.bold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16, color: colors.text },
  statCard: { backgroundColor: colors.white, borderRadius: 12, padding: 16, marginBottom: 18, borderLeftWidth: 3, borderLeftColor: colors.danger },
  statLabel: { fontSize: 10, color: colors.textSecondary, textTransform: 'uppercase' },
  statValue: { fontSize: 24, fontFamily: fonts.bold, color: colors.danger, marginTop: 4 },
  panel: { backgroundColor: colors.white, borderRadius: 12, padding: 16, marginBottom: 20 },
  formTitle: { fontSize: 12, fontFamily: fonts.bold, color: colors.text, letterSpacing: 1, marginBottom: 12 },
  fieldLabel: { fontSize: 11, color: colors.textSecondary, textTransform: 'uppercase', marginBottom: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12, color: colors.textSecondary, fontFamily: fonts.medium },
  chipTextOn: { color: colors.white },
  input: { backgroundColor: colors.backgroundLight, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 14, marginBottom: 12, fontSize: 14, color: colors.text, fontFamily: fonts.regular },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.primary, borderRadius: 10, padding: 14, marginTop: 4 },
  btnText: { color: colors.white, fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1 },
  sectionTitle: { fontSize: 12, color: colors.textSecondary, textTransform: 'uppercase', marginBottom: 10 },
  empty: { fontSize: 12, color: colors.textSecondary },
  gastoRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 12, padding: 14, marginBottom: 10 },
  rowLabel: { fontFamily: fonts.semibold, color: colors.text },
  rowSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  monto: { fontFamily: fonts.bold, color: colors.danger, fontSize: 15 },
});
