import React, { useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, SectionList, TextInput, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOrders } from '../context/OrderContext';
import colors from '../theme/colors';
import fonts from '../theme/fonts';

const SECTIONS = [
  {
    title: 'Café Caliente',
    data: [
      { id: '1', nombre: 'Americano', precio: 35 },
      { id: '2', nombre: 'Capuccino', precio: 45 },
      { id: '3', nombre: 'Espresso', precio: 30 },
    ],
  },
  {
    title: 'Frappés',
    data: [
      { id: '4', nombre: 'Frappé Mocha', precio: 55 },
      { id: '5', nombre: 'Frappé Vainilla', precio: 55 },
    ],
  },
  {
    title: 'Postres',
    data: [
      { id: '6', nombre: 'Croissant Almendras', precio: 45 },
      { id: '7', nombre: 'Pastel de Zanahoria', precio: 60 },
    ],
  },
];

// Menú de platillos con SectionList. Los productos que se agregan
// van directo al carrito del Context, visible luego en "Confirmar".
export default function FlatListScreen({ navigation }) {
  const [busqueda, setBusqueda] = useState('');
  const { cart, addToCart, mesaActual } = useOrders();

  const totalItems = cart.reduce((sum, p) => sum + p.cantidad, 0);

  const sectionsFiltradas = SECTIONS.map((s) => ({
    ...s,
    data: s.data.filter((p) => p.nombre.toLowerCase().includes(busqueda.toLowerCase())),
  })).filter((s) => s.data.length > 0);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.mesaBar}>
        <Text style={styles.mesaText}>
          <Ionicons name="location-outline" size={13} color={colors.primary} /> {mesaActual || 'Sin mesa seleccionada'}
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
        sections={sectionsFiltradas}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section: { title } }) => <Text style={styles.sectionHeader}>{title}</Text>}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View>
              <Text style={styles.itemName}>{item.nombre}</Text>
              <Text style={styles.itemPrice}>${item.precio.toFixed(2)}</Text>
            </View>
            <Pressable style={styles.addBtn} onPress={() => addToCart(item)}>
              <Text style={styles.addBtnText}>+</Text>
            </Pressable>
          </View>
        )}
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
