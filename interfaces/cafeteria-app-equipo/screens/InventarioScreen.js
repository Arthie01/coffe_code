import React from 'react';
import { SafeAreaView, ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOrders } from '../context/OrderContext';
import colors from '../theme/colors';
import fonts from '../theme/fonts';

// Módulo Cocina: Inventario de suministros. Lista los ingredientes con su
// stock, marca los que están bajo mínimo y permite ajustar existencias.
export default function InventarioScreen() {
  const { ingredientes, ajustarStock } = useOrders();
  const bajoMinimo = ingredientes.filter((i) => i.stock <= i.minimo).length;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
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
          const bajo = ing.stock <= ing.minimo;
          return (
            <View key={ing.id} style={styles.panel}>
              <View style={styles.rowTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowLabel}>{ing.nombre}</Text>
                  <Text style={styles.rowSub}>
                    Stock: {ing.stock} {ing.unidad} · mín. {ing.minimo} {ing.unidad}
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
                <Pressable style={styles.stepBtn} onPress={() => ajustarStock(ing.id, -0.5)}>
                  <Ionicons name="remove" size={18} color={colors.primary} />
                </Pressable>
                <Text style={styles.stepValue}>{ing.stock} {ing.unidad}</Text>
                <Pressable style={styles.stepBtn} onPress={() => ajustarStock(ing.id, 0.5)}>
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
