import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getPedidos, getGanancias, ESTATUS } from '../services/api';
import colors from '../theme/colors';
import fonts from '../theme/fonts';

// Accesos rápidos por rol: cada uno navega a una pantalla que ese rol sí tiene
// en su Drawer.
const ACCESOS = {
  Mesero: [
    { screen: 'MeseroFlow', label: '+ Nuevo Pedido', desc: 'Selecciona mesa y arma el pedido' },
    { screen: 'Entregas', label: 'Mis Pedidos', desc: 'Envía tus pedidos a cocina' },
  ],
  Cocinero: [
    { screen: 'Cocina', label: 'Ir a Cocina', desc: 'Prepara y marca pedidos como listos' },
    { screen: 'Menu', label: 'Gestión del Menú', desc: 'Alta y disponibilidad de platillos' },
    { screen: 'Inventario', label: 'Inventario', desc: 'Revisa el stock de suministros' },
  ],
  Cajero: [
    { screen: 'Caja', label: 'Ir a Caja', desc: 'Cobra pedidos listos' },
    { screen: 'Ganancias', label: 'Ganancias', desc: 'Ingresos, egresos y ganancia neta' },
    { screen: 'Gastos', label: 'Gastos', desc: 'Registra gastos operativos' },
  ],
  Admin: [
    { screen: 'MeseroFlow', label: '+ Nuevo Pedido', desc: 'Selecciona mesa y arma el pedido' },
    { screen: 'Cocina', label: 'Ir a Cocina', desc: 'Ver pedidos entrantes' },
    { screen: 'Caja', label: 'Ir a Caja', desc: 'Cobrar pedidos listos' },
  ],
};

export default function DashboardScreen({ navigation }) {
  const { usuario, rol } = useAuth();
  const [pedidos, setPedidos] = useState([]);
  const [ingresos, setIngresos] = useState(null);
  const [cargando, setCargando] = useState(true);

  const verIngresos = rol === 'Admin' || rol === 'Cajero';

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      const r = await getPedidos();
      setPedidos(r.data);
      if (verIngresos) {
        try {
          const g = await getGanancias();
          setIngresos(g.data.ingresos);
        } catch (e) { setIngresos(null); }
      }
    } catch (e) {
      setPedidos([]);
    } finally {
      setCargando(false);
    }
  }, [verIngresos]);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  const contar = (idEstatus) => pedidos.filter((p) => p.id_estatus === idEstatus).length;
  const accesos = ACCESOS[rol] || [];

  if (cargando) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando resumen...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={{ padding: 20 }}
        refreshControl={<RefreshControl refreshing={cargando} onRefresh={cargar} colors={[colors.primary]} />}
      >
        <View style={styles.titleRow}>
          <Text style={styles.title}>HOLA, {(usuario?.nombre || '').toUpperCase()}</Text>
          <Ionicons name="cafe" size={22} color={colors.text} />
        </View>
        <Text style={styles.subtitle}>Resumen del día · {rol}</Text>

        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>PENDIENTES</Text>
            <Text style={styles.statValue}>{contar(ESTATUS.PENDIENTE)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>EN PREPARACIÓN</Text>
            <Text style={styles.statValue}>{contar(ESTATUS.EN_PREPARACION)}</Text>
          </View>
        </View>
        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>LISTOS P/ COBRO</Text>
            <Text style={styles.statValue}>{contar(ESTATUS.LISTO)}</Text>
          </View>
          {verIngresos && (
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>INGRESOS</Text>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {ingresos == null ? '—' : `$${ingresos.toFixed(2)}`}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>ACCESOS RÁPIDOS</Text>

        {accesos.map((a) => (
          <Pressable
            key={a.screen}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => navigation.navigate(a.screen)}
          >
            <Text style={styles.cardLabel}>{a.label}</Text>
            <Text style={styles.cardDesc}>{a.desc}</Text>
          </Pressable>
        ))}

        <Text style={styles.hint}>
          <Ionicons name="menu" size={12} color={colors.textSecondary} /> Desliza desde el borde izquierdo o toca el ícono de menú para navegar.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: colors.textSecondary },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 22, fontFamily: fonts.bold, textTransform: 'uppercase', letterSpacing: 1, color: colors.text },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginBottom: 20, marginTop: 4 },
  statRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: { flex: 1, backgroundColor: colors.white, borderRadius: 12, padding: 14 },
  statLabel: { fontSize: 10, color: colors.textSecondary, textTransform: 'uppercase' },
  statValue: { fontSize: 20, fontFamily: fonts.bold, color: colors.text, marginTop: 4 },
  sectionTitle: { fontSize: 12, color: colors.textSecondary, textTransform: 'uppercase', marginTop: 20, marginBottom: 10 },
  card: { backgroundColor: colors.white, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
  cardPressed: { backgroundColor: '#DCECE3' },
  cardLabel: { fontSize: 16, fontFamily: fonts.bold, color: colors.primary },
  cardDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  hint: { fontSize: 11, color: colors.textSecondary, marginTop: 10, textAlign: 'center' },
});
