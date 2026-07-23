import React, { useState, useCallback } from 'react';
import { SafeAreaView, ScrollView, View, Text, StyleSheet, Pressable, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getIngredientes, actualizarIngrediente } from '../services/api';
import colors from '../theme/colors';
import fonts from '../theme/fonts';

// Módulo Cocina: Inventario de suministros contra la API. Lista los
// ingredientes con su stock, marca los que están bajo mínimo y permite
// ajustar existencias (PATCH /v1/ingredientes/{id} con stock_actual).
export default function InventarioScreen() {
  const [ingredientes, setIngredientes] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      const r = await getIngredientes();
      setIngredientes(r.data);
    } catch (e) {
      setIngredientes([]);
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  const ajustar = async (ing, delta) => {
    const nuevoStock = Math.max(0, +(parseFloat(ing.stock_actual) + delta).toFixed(2));
    // Actualización optimista para que el stepper se sienta inmediato
    setIngredientes((prev) => prev.map((i) => (i.id === ing.id ? { ...i, stock_actual: nuevoStock } : i)));
    try {
      await actualizarIngrediente(ing.id, { stock_actual: nuevoStock });
    } catch (e) {
      Alert.alert('No se pudo actualizar', e.message);
      cargar(); // revertir con datos reales
    }
  };

  const bajoMinimo = ingredientes.filter((i) => parseFloat(i.stock_actual) <= parseFloat(i.stock_minimo)).length;

  if (cargando) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando inventario...</Text>
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
        <Text style={styles.title}>INVENTARIO DE SUMINISTROS</Text>

        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>INGREDIENTES</Text>
            <Text style={styles.statValue}>{ingredientes.length}</Text>
          </View>
          <View style={[styles.statCard, bajoMinimo > 0 && { borderLeftWidth: 3, borderLeftColor: colors.danger }]}>
            <Text style={styles.statLabel}>BAJO MÍNIMO</Text>
            <Text style={[styles.statValue, bajoMinimo > 0 && { color: colors.danger }]}>{bajoMinimo}</Text>
          </View>
        </View>

        {ingredientes.map((ing) => {
          const stock = parseFloat(ing.stock_actual);
          const minimo = parseFloat(ing.stock_minimo);
          const bajo = stock <= minimo;
          return (
            <View key={ing.id} style={styles.panel}>
              <View style={styles.rowTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowLabel}>{ing.nombre}</Text>
                  <Text style={styles.rowSub}>
                    Stock: {stock} {ing.unidad_medida} · mín. {minimo} {ing.unidad_medida}
                  </Text>
                </View>
                {bajo && (
                  <View style={styles.badge}>
                    <Ionicons name="warning-outline" size={11} color={colors.danger} />
                    <Text style={styles.badgeText}> BAJO MÍNIMO</Text>
                  </View>
                )}
              </View>
              <View style={styles.stepper}>
                <Pressable style={styles.stepBtn} onPress={() => ajustar(ing, -0.5)}>
                  <Ionicons name="remove" size={18} color={colors.primary} />
                </Pressable>
                <Text style={styles.stepValue}>{stock} {ing.unidad_medida}</Text>
                <Pressable style={styles.stepBtn} onPress={() => ajustar(ing, 0.5)}>
                  <Ionicons name="add" size={18} color={colors.primary} />
                </Pressable>
              </View>
            </View>
          );
        })}
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
  panel: { backgroundColor: colors.white, borderRadius: 12, padding: 14, marginBottom: 12 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  rowLabel: { fontFamily: fonts.semibold, color: colors.text, fontSize: 15 },
  rowSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F6E4E1', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 9, fontFamily: fonts.bold, color: colors.danger },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 14, marginTop: 12 },
  stepBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1.5, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  stepValue: { fontFamily: fonts.bold, color: colors.text, minWidth: 70, textAlign: 'center' },
});
