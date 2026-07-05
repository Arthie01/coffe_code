import React from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, ScrollView } from 'react-native';
import { useOrders } from '../context/OrderContext';
import colors from '../theme/colors';
import fonts from '../theme/fonts';

// Página principal de la cafetería, visible justo después del login.
// Se accede a todo lo demás desde la barra lateral (Drawer) o desde
// estos accesos rápidos.
export default function DashboardScreen({ navigation }) {
  const { pedidos } = useOrders();
  const pendientes = pedidos.filter((p) => p.estado === 'Pendiente').length;
  const enPreparacion = pedidos.filter((p) => p.estado === 'En preparación').length;
  const listos = pedidos.filter((p) => p.estado === 'Listo').length;
  const ingresos = pedidos.filter((p) => p.estado === 'Pagado').reduce((sum, p) => sum + p.total, 0);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.title}>BIENVENIDO ☕</Text>
        <Text style={styles.subtitle}>Resumen del día</Text>

        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>PENDIENTES</Text>
            <Text style={styles.statValue}>{pendientes}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>EN PREPARACIÓN</Text>
            <Text style={styles.statValue}>{enPreparacion}</Text>
          </View>
        </View>
        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>LISTOS P/ COBRO</Text>
            <Text style={styles.statValue}>{listos}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>INGRESOS HOY</Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>${ingresos.toFixed(2)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>ACCESOS RÁPIDOS</Text>

        <Pressable
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          onPress={() => navigation.navigate('MeseroFlow')}
        >
          <Text style={styles.cardLabel}>+ Nuevo Pedido</Text>
          <Text style={styles.cardDesc}>Selecciona mesa y arma el pedido</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          onPress={() => navigation.navigate('Cocina')}
        >
          <Text style={styles.cardLabel}>Ir a Cocina</Text>
          <Text style={styles.cardDesc}>Ver pedidos entrantes y disponibilidad del menú</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          onPress={() => navigation.navigate('Caja')}
        >
          <Text style={styles.cardLabel}>Ir a Caja</Text>
          <Text style={styles.cardDesc}>Cobrar pedidos listos y ver ingresos</Text>
        </Pressable>

        <Text style={styles.hint}>☰ Desliza desde el borde izquierdo o toca el ícono de menú para navegar.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: 24, fontFamily: fonts.bold, textTransform: 'uppercase', letterSpacing: 1, color: colors.text },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginBottom: 20, marginTop: 4 },
  statRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: { flex: 1, backgroundColor: colors.white, borderRadius: 12, padding: 14 },
  statLabel: { fontSize: 10, color: colors.textSecondary, textTransform: 'uppercase' },
  statValue: { fontSize: 20, fontFamily: fonts.bold, color: colors.text, marginTop: 4 },
  sectionTitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginTop: 20,
    marginBottom: 10,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  cardPressed: { backgroundColor: '#DCECE3' },
  cardLabel: { fontSize: 16, fontFamily: fonts.bold, color: colors.primary },
  cardDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  hint: { fontSize: 11, color: colors.textSecondary, marginTop: 10, textAlign: 'center' },
});
