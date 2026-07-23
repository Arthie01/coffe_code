import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, ActivityIndicator, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useOrders } from '../context/OrderContext';
import { getMesas, ESTATUS } from '../services/api';
import colors from '../theme/colors';
import fonts from '../theme/fonts';

// Módulo Mesero: selección de mesa. Las mesas se traen de la API
// (GET /v1/mesas/). La mesa elegida se guarda en el Context (con su id real)
// para armar el pedido en el resto del flujo.
export default function PresseableScreen({ navigation }) {
  const { mesa, setMesa } = useOrders();
  const [mesas, setMesas] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      const r = await getMesas();
      setMesas(r.data);
    } catch (e) {
      setMesas([]);
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  const seleccionar = (m) => setMesa({ id: m.id, nombre: m.nombre });

  const continuar = () => {
    if (!mesa) return;
    navigation.navigate('MenuPlatillos');
  };

  if (cargando) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando mesas...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.title}>SELECCIONAR MESA</Text>
        <Text style={styles.subtitle}>Asigna una ubicación para el nuevo pedido.</Text>

        {mesas.length === 0 && (
          <Text style={styles.empty}>No se pudieron cargar las mesas. Revisa tu conexión.</Text>
        )}

        <View style={styles.grid}>
          {mesas.map((m) => {
            const ocupada = m.id_estatus === ESTATUS.OCUPADA;
            const seleccionada = mesa?.id === m.id;
            return (
              <Pressable
                key={m.id}
                disabled={ocupada}
                onPress={() => seleccionar(m)}
                style={({ pressed }) => [
                  styles.mesa,
                  ocupada && styles.mesaOcupada,
                  seleccionada && styles.mesaSeleccionada,
                  pressed && !ocupada && { opacity: 0.7 },
                ]}
              >
                <Text style={[styles.mesaTexto, seleccionada && { color: colors.white }]}>{m.nombre}</Text>
                <Text style={[styles.mesaCap, seleccionada && { color: colors.white }]}>
                  {ocupada ? 'OCUPADA' : `${m.capacidad} pers.`}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.button,
            !mesa && styles.buttonDisabled,
            pressed && mesa && { backgroundColor: colors.primaryDark },
          ]}
          disabled={!mesa}
          onPress={continuar}
        >
          <Text style={styles.buttonText}>CONTINUAR AL MENÚ</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: colors.textSecondary },
  title: { fontSize: 22, fontFamily: fonts.bold, textTransform: 'uppercase', letterSpacing: 1, color: colors.text },
  subtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 4, marginBottom: 20 },
  empty: { fontSize: 13, color: colors.textSecondary, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
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
  mesaSeleccionada: { backgroundColor: colors.primary, borderColor: colors.primary },
  mesaTexto: { fontFamily: fonts.bold, color: colors.text },
  mesaCap: { fontSize: 10, color: colors.textSecondary, marginTop: 4, fontFamily: fonts.medium },
  button: { backgroundColor: colors.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  buttonDisabled: { backgroundColor: colors.border },
  buttonText: { color: colors.white, fontFamily: fonts.bold, letterSpacing: 1 },
});
