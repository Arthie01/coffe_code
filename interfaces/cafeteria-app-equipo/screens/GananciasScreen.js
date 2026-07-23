import React, { useState, useCallback } from 'react';
import { SafeAreaView, ScrollView, View, Text, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getGanancias } from '../services/api';
import colors from '../theme/colors';
import fonts from '../theme/fonts';

// Módulo Caja: Ganancias / Resumen financiero desde la API
// (GET /v1/reportes/ganancias). Muestra ingresos (pagos), egresos (gastos) y
// la ganancia neta calculada por el backend.
export default function GananciasScreen() {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      const r = await getGanancias();
      setDatos(r.data);
    } catch (e) {
      setDatos(null);
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  if (cargando) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando finanzas...</Text>
      </SafeAreaView>
    );
  }

  const ingresos = datos?.ingresos ?? 0;
  const egresos = datos?.egresos ?? 0;
  const neta = datos?.ganancia_neta ?? 0;
  const max = Math.max(ingresos, egresos, 1);
  const pctIngresos = (ingresos / max) * 100;
  const pctEgresos = (egresos / max) * 100;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={cargando} onRefresh={cargar} colors={[colors.primary]} />}
      >
        <Text style={styles.title}>GANANCIAS</Text>

        <View style={[styles.netCard, { borderLeftColor: neta >= 0 ? colors.primary : colors.danger }]}>
          <Text style={styles.netLabel}>GANANCIA NETA ({datos?.periodo || 'histórico'})</Text>
          <Text style={[styles.netValue, { color: neta >= 0 ? colors.primary : colors.danger }]}>
            {neta < 0 ? '-' : ''}${Math.abs(neta).toFixed(2)}
          </Text>
          <Text style={styles.netSub}>Ingresos − Egresos</Text>
        </View>

        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <View style={[styles.dot, { backgroundColor: colors.primary }]} />
            <Text style={styles.statLabel}>INGRESOS</Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>${ingresos.toFixed(2)}</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.dot, { backgroundColor: colors.danger }]} />
            <Text style={styles.statLabel}>EGRESOS</Text>
            <Text style={[styles.statValue, { color: colors.danger }]}>${egresos.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>COMPARATIVA</Text>
          <View style={styles.barRow}>
            <Text style={styles.barLabel}>Ingresos</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${pctIngresos}%`, backgroundColor: colors.primary }]} />
            </View>
            <Text style={styles.barValue}>${ingresos.toFixed(0)}</Text>
          </View>
          <View style={styles.barRow}>
            <Text style={styles.barLabel}>Egresos</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${pctEgresos}%`, backgroundColor: colors.danger }]} />
            </View>
            <Text style={styles.barValue}>${egresos.toFixed(0)}</Text>
          </View>
        </View>

        <View style={styles.panel}>
          <View style={styles.dRow}>
            <View style={styles.dLeft}>
              <Ionicons name="receipt-outline" size={16} color={colors.primary} />
              <Text style={styles.dLabel}>Pagos cobrados</Text>
            </View>
            <Text style={styles.dValue}>{datos?.num_pagos ?? 0}</Text>
          </View>
          <View style={[styles.dRow, styles.dRowLast]}>
            <View style={styles.dLeft}>
              <Ionicons name="cart-outline" size={16} color={colors.danger} />
              <Text style={styles.dLabel}>Gastos registrados</Text>
            </View>
            <Text style={styles.dValue}>{datos?.num_gastos ?? 0}</Text>
          </View>
        </View>

        {ingresos === 0 && egresos === 0 && (
          <Text style={styles.empty}>
            Aún no hay movimientos. Cobra pedidos en Caja y registra gastos para ver tus ganancias.
          </Text>
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
  netCard: { backgroundColor: colors.white, borderRadius: 14, padding: 20, marginBottom: 16, borderLeftWidth: 4 },
  netLabel: { fontSize: 11, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  netValue: { fontSize: 34, fontFamily: fonts.bold, marginTop: 6 },
  netSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  statRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: colors.white, borderRadius: 12, padding: 14 },
  dot: { width: 10, height: 10, borderRadius: 5, marginBottom: 8 },
  statLabel: { fontSize: 10, color: colors.textSecondary, textTransform: 'uppercase' },
  statValue: { fontSize: 20, fontFamily: fonts.bold, marginTop: 4 },
  panel: { backgroundColor: colors.white, borderRadius: 12, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 12, color: colors.textSecondary, textTransform: 'uppercase', marginBottom: 14 },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  barLabel: { width: 62, fontSize: 12, color: colors.textSecondary, fontFamily: fonts.medium },
  barTrack: { flex: 1, height: 14, backgroundColor: colors.backgroundLight, borderRadius: 8, overflow: 'hidden', marginHorizontal: 8 },
  barFill: { height: '100%', borderRadius: 8 },
  barValue: { width: 64, textAlign: 'right', fontFamily: fonts.bold, fontSize: 12, color: colors.text },
  dRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  dRowLast: { borderBottomWidth: 0 },
  dLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dLabel: { fontFamily: fonts.semibold, color: colors.text, fontSize: 14 },
  dValue: { fontFamily: fonts.bold, color: colors.text, fontSize: 16 },
  empty: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
});
