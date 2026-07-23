import React, { useState, useCallback } from 'react';
import {
  SafeAreaView, ScrollView, View, Text, StyleSheet, Pressable, TextInput, Alert, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getGastos, getCategoriasGasto, crearGasto } from '../services/api';
import colors from '../theme/colors';
import fonts from '../theme/fonts';

// Módulo Caja: Gastos contra la API. Registra y consulta los gastos operativos
// (POST/GET /v1/gastos/). La categoría se elige de un catálogo real para
// mandar el id_categoria_gasto correcto.
export default function GastosScreen() {
  const [gastos, setGastos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [idCategoria, setIdCategoria] = useState(null);
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      const [rg, rcat] = await Promise.all([getGastos(), getCategoriasGasto()]);
      setGastos(rg.data);
      setCategorias(rcat.data);
      setIdCategoria((prev) => prev || rcat.data[0]?.id || null);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  const totalGastos = gastos.reduce((sum, g) => sum + g.monto, 0);

  const registrar = async () => {
    const montoNum = parseFloat(monto);
    if (!idCategoria || isNaN(montoNum) || montoNum <= 0) {
      Alert.alert('Datos incompletos', 'Elige una categoría y captura un monto válido.');
      return;
    }
    try {
      setGuardando(true);
      await crearGasto({
        id_categoria_gasto: idCategoria,
        descripcion: descripcion.trim() || null,
        monto: montoNum,
      });
      setDescripcion(''); setMonto('');
      cargar();
    } catch (e) {
      Alert.alert('No se pudo registrar', e.message);
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando gastos...</Text>
      </SafeAreaView>
    );
  }

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
              {categorias.map((c) => (
                <Pressable key={c.id} onPress={() => setIdCategoria(c.id)}
                  style={[styles.chip, idCategoria === c.id && styles.chipOn]}>
                  <Text style={[styles.chipText, idCategoria === c.id && styles.chipTextOn]}>{c.nombre}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput style={styles.input} placeholder="Descripción (opcional)" placeholderTextColor={colors.textSecondary}
              value={descripcion} onChangeText={setDescripcion} />
            <TextInput style={styles.input} placeholder="Monto (ej. 500)" placeholderTextColor={colors.textSecondary}
              value={monto} onChangeText={setMonto} keyboardType="decimal-pad" />
            <Pressable style={styles.btn} onPress={registrar} disabled={guardando}>
              {guardando ? <ActivityIndicator color={colors.white} /> : (
                <>
                  <Ionicons name="add" size={18} color={colors.white} />
                  <Text style={styles.btnText}>REGISTRAR GASTO</Text>
                </>
              )}
            </Pressable>
          </View>

          <Text style={styles.sectionTitle}>HISTORIAL</Text>
          {gastos.length === 0 && <Text style={styles.empty}>Aún no hay gastos registrados.</Text>}
          {gastos.map((g) => (
            <View key={g.id} style={styles.gastoRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>{g.descripcion || g.categoria}</Text>
                <Text style={styles.rowSub}>{g.categoria} · {g.usuario}</Text>
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
  center: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: colors.textSecondary },
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
