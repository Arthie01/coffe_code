import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { useOrders } from '../context/OrderContext';
import { crearPedido } from '../services/api';
import colors from '../theme/colors';
import fonts from '../theme/fonts';

// Revisión final del pedido. Al confirmar se crea el pedido REAL en la API
// (POST /v1/pedidos/) con el id_mesa y los id_comida reales. El mesero queda
// auto-asignado por el token; el pedido nace en estatus "Pendiente".
export default function ModalBottomSheetScreen({ navigation }) {
  const { cart, mesa, total, clearCart, setMesa } = useOrders();
  const [sheetVisible, setSheetVisible] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const confirmarEnvio = async () => {
    if (cart.length === 0 || !mesa) return;
    try {
      setEnviando(true);
      const body = {
        id_mesa: mesa.id,
        items: cart.map((p) => ({ id_comida: p.id_comida, cantidad: p.cantidad })),
      };
      const r = await crearPedido(body);
      setSheetVisible(false);
      clearCart();
      setMesa(null);
      Alert.alert('Pedido enviado', `Ticket #${r.data.id} creado por $${r.data.precio_total.toFixed(2)}.`, [
        {
          text: 'OK',
          onPress: () => {
            const parent = navigation.getParent();
            if (parent) parent.navigate('Dashboard');
            else navigation.popToTop();
          },
        },
      ]);
    } catch (e) {
      setSheetVisible(false);
      Alert.alert('No se pudo crear el pedido', e.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>{mesa?.nombre || 'Sin mesa'}</Text>
        <Text style={styles.subtitle}>{cart.length} platillo(s) en el pedido</Text>

        {cart.length === 0 ? (
          <Text style={styles.empty}>Aún no has agregado productos. Regresa al menú para agregar algo.</Text>
        ) : (
          <View style={styles.detailCard}>
            {cart.map((p) => (
              <View key={p.id_comida} style={styles.row}>
                <Text style={styles.rowText}>{p.cantidad}x {p.nombre}</Text>
                <Text style={styles.rowText}>${(p.precio * p.cantidad).toFixed(2)}</Text>
              </View>
            ))}
            <View style={[styles.row, { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 8 }]}>
              <Text style={styles.total}>TOTAL</Text>
              <Text style={styles.total}>${total.toFixed(2)}</Text>
            </View>
          </View>
        )}

        {cart.length > 0 && (
          <Pressable style={[styles.button, { backgroundColor: colors.text }]} onPress={() => setSheetVisible(true)}>
            <Text style={styles.buttonText}>ENVIAR A COCINA</Text>
          </Pressable>
        )}
      </View>

      {/* Bottom sheet de confirmación */}
      <Modal visible={sheetVisible} animationType="slide" transparent onRequestClose={() => setSheetVisible(false)}>
        <View style={styles.sheetOverlay}>
          <Pressable style={{ flex: 1 }} onPress={() => !enviando && setSheetVisible(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.modalTitle}>Confirmar pedido a cocina</Text>
            <Text style={styles.sheetText}>
              El pedido de {mesa?.nombre} se creará por un total de ${total.toFixed(2)}.
            </Text>
            <Pressable
              style={[styles.button, { backgroundColor: colors.primary, marginTop: 10 }]}
              onPress={confirmarEnvio}
              disabled={enviando}
            >
              {enviando ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>CONFIRMAR</Text>}
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: 20 },
  title: { fontSize: 22, fontFamily: fonts.bold, textTransform: 'uppercase', letterSpacing: 1, color: colors.text },
  subtitle: { fontSize: 12, color: colors.textSecondary, marginBottom: 20 },
  empty: { color: colors.textSecondary, fontSize: 13, marginBottom: 20 },
  detailCard: { backgroundColor: colors.white, borderRadius: 12, padding: 16, marginBottom: 24 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  rowText: { color: colors.text },
  total: { fontFamily: fonts.bold, color: colors.primary },
  button: { backgroundColor: colors.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  buttonText: { color: colors.white, fontFamily: fonts.bold, letterSpacing: 0.5, fontSize: 12 },
  modalTitle: { fontFamily: fonts.bold, fontSize: 16, marginBottom: 12, color: colors.text },
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  sheetHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetText: { color: colors.textSecondary, fontSize: 13, lineHeight: 20 },
});
