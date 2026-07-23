import React, { useState, useCallback } from 'react';
import { SafeAreaView, View, Text, StyleSheet, SectionList, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useOrders } from '../context/OrderContext';
import { getComidas, ESTATUS } from '../services/api';
import colors from '../theme/colors';
import fonts from '../theme/fonts';

// Menú de platillos con SectionList. Los platillos se traen de la API
// (GET /v1/comidas/), agrupados por categoría y solo los que están activos.
// Al tocar "+" se agregan al carrito del Context con su id_comida real.
export default function FlatListScreen({ navigation }) {
  const [busqueda, setBusqueda] = useState('');
  const [comidas, setComidas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const { cart, addToCart, mesa } = useOrders();

  const totalItems = cart.reduce((sum, p) => sum + p.cantidad, 0);

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      const r = await getComidas();
      // Solo platillos disponibles (activos)
      setComidas(r.data.filter((c) => c.id_estatus === ESTATUS.ACTIVO));
    } catch (e) {
      setComidas([]);
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  // Agrupa las comidas por categoría para la SectionList
  const secciones = Object.values(
    comidas
      .filter((c) => c.nombre.toLowerCase().includes(busqueda.toLowerCase()))
      .reduce((acc, c) => {
        const key = c.categoria || 'Otros';
        if (!acc[key]) acc[key] = { title: key, data: [] };
        acc[key].data.push(c);
        return acc;
      }, {})
  );

  const agregar = (c) => addToCart({ id_comida: c.id, nombre: c.nombre, precio: c.precio });

  if (cargando) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando menú...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.mesaBar}>
        <Text style={styles.mesaText}>
          <Ionicons name="location-outline" size={13} color={colors.primary} /> {mesa?.nombre || 'Sin mesa seleccionada'}
        </Text>
      </View>

      <View style={styles.header}>
        <TextInput
          style={styles.search}
          placeholder="Buscar platillo..."
          placeholderTextColor={colors.textSecondary}
          value={busqueda}
          onChangeText={setBusqueda}
        />
        <Pressable style={styles.cart} onPress={() => navigation.navigate('Confirmar')}>
          <Text style={styles.cartText}>
            <Ionicons name="cart-outline" size={14} color={colors.white} /> {totalItems}
          </Text>
        </Pressable>
      </View>

      <SectionList
        sections={secciones}
        keyExtractor={(item) => String(item.id)}
        renderSectionHeader={({ section: { title } }) => <Text style={styles.sectionHeader}>{title}</Text>}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.nombre}</Text>
              <Text style={styles.itemPrice}>${item.precio.toFixed(2)}</Text>
            </View>
            <Pressable style={styles.addBtn} onPress={() => agregar(item)}>
              <Text style={styles.addBtnText}>+</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No hay platillos disponibles.</Text>}
        contentContainerStyle={{ padding: 16, paddingBottom: 90 }}
        stickySectionHeadersEnabled
      />

      {totalItems > 0 && (
        <Pressable style={styles.floatingBtn} onPress={() => navigation.navigate('Confirmar')}>
          <Text style={styles.floatingBtnText}>VER PEDIDO ({totalItems})</Text>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: colors.textSecondary },
  empty: { textAlign: 'center', color: colors.textSecondary, marginTop: 30 },
  mesaBar: { paddingHorizontal: 16, paddingTop: 12 },
  mesaText: { fontFamily: fonts.bold, color: colors.primary, fontSize: 13 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 10 },
  search: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cart: { backgroundColor: colors.text, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  cartText: { color: colors.white, fontWeight: 'bold' },
  sectionHeader: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.primary,
    backgroundColor: colors.background,
    paddingVertical: 8,
    textTransform: 'uppercase',
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  itemName: { fontFamily: fonts.semibold, color: colors.text },
  itemPrice: { color: colors.primary, marginTop: 2, fontFamily: fonts.bold },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.text,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
  floatingBtn: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: colors.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  floatingBtnText: { color: colors.white, fontFamily: fonts.bold, letterSpacing: 0.5 },
});
