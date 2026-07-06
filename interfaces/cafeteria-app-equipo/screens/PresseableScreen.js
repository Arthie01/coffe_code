import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOrders } from '../context/OrderContext';
import colors from '../theme/colors';
import fonts from '../theme/fonts';

const mesasIniciales = [
  { id: '1', nombre: 'Mesa 1', ocupada: false },
  { id: '2', nombre: 'Mesa 2', ocupada: true },
  { id: '3', nombre: 'Mesa 3', ocupada: false },
  { id: '4', nombre: 'Mesa 4', ocupada: false },
];

// Módulo Mesero: selección de mesa con Pressable.
// La mesa elegida se guarda en el Context para usarse en el resto del flujo.
export default function PresseableScreen({ navigation }) {
  const { setMesaActual } = useOrders();
  const [seleccionId, setSeleccionId] = useState(null);

  const seleccionar = (mesa) => {
    setSeleccionId(mesa.id);
    setMesaActual(mesa.nombre);
  };

  const continuar = () => {
    if (!seleccionId) return;
    navigation.navigate('MenuPlatillos');
  };

  const paraLlevar = () => {
    setSeleccionId('llevar');
    setMesaActual('Para llevar');
    navigation.navigate('MenuPlatillos');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={{ padding: 20 }}>
        <Text style={styles.title}>SELECCIONAR MESA</Text>
        <Text style={styles.subtitle}>Asigna una ubicación para el nuevo pedido.</Text>

        <View style={styles.grid}>
          {mesasIniciales.map((mesa) => (
            <Pressable
              key={mesa.id}
              disabled={mesa.ocupada}
              onPress={() => seleccionar(mesa)}
              style={({ pressed }) => [
                styles.mesa,
                mesa.ocupada && styles.mesaOcupada,
                seleccionId === mesa.id && styles.mesaSeleccionada,
                pressed && !mesa.ocupada && { opacity: 0.7 },
              ]}
            >
              <Text style={styles.mesaTexto}>{mesa.nombre}</Text>
              {mesa.ocupada && <Text style={styles.mesaEstado}>OCUPADA</Text>}
            </Pressable>
          ))}
        </View>

        <Pressable
          style={[styles.paraLlevarBtn, seleccionId === 'llevar' && styles.mesaSeleccionada]}
          onPress={paraLlevar}
        >
          <Text style={styles.paraLlevarText}>
            <Ionicons name="bag-handle-outline" size={15} color={colors.text} />  Para Llevar
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.button,
            !seleccionId && styles.buttonDisabled,
            pressed && seleccionId && { backgroundColor: colors.primaryDark },
          ]}
          disabled={!seleccionId}
          onPress={continuar}
        >
          <Text style={styles.buttonText}>CONTINUAR AL MENÚ</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: 22, fontFamily: fonts.bold, textTransform: 'uppercase', letterSpacing: 1, color: colors.text },
  subtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 4, marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  mesa: {
    width: '47%',
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  mesaOcupada: { backgroundColor: '#F3DEDE' },
  mesaSeleccionada: { backgroundColor: colors.primary },
  mesaTexto: { fontFamily: fonts.bold, color: colors.text },
  mesaEstado: { fontSize: 10, color: colors.danger, marginTop: 4, fontWeight: 'bold' },
  paraLlevarBtn: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  paraLlevarText: { fontFamily: fonts.bold, color: colors.text },
  button: { backgroundColor: colors.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  buttonDisabled: { backgroundColor: colors.border },
  buttonText: { color: colors.white, fontFamily: fonts.bold, letterSpacing: 1 },
});
