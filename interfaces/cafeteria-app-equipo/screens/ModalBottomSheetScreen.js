import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, SafeAreaView, Alert } from 'react-native';
import { useOrders } from '../context/OrderContext';
import colors from '../theme/colors';
import fonts from '../theme/fonts';

// Revisión final del pedido: Modal centrado para ver el desglose
// y Bottom Sheet para confirmar el envío a cocina (esto crea el
// pedido real en el Context, visible luego en Cocina y Caja).
export default function ModalBottomSheetScreen({ navigation }) {
  const { cart, mesaActual, submitOrder } = useOrders();
  const [modalVisible, setModalVisible] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);

  const subtotal = cart.reduce((sum, p) => sum + p.precio * p.cantidad, 0);
  const iva = subtotal * 0.16;
  const total = subtotal + iva;

  const confirmarEnvio = () => {
    const pedido = submitOrder();
    setSheetVisible(false);
    if (pedido) {
      Alert.alert('Pedido enviado', `Ticket #${pedido.id} enviado a cocina.`, [
        {
          text: 'OK',
          onPress: () => {
            // Regresa a la pantalla principal del Drawer (fuera del stack de Mesero)
            const parent = navigation.getParent();
            if (parent) {
              parent.navigate('Dashboard');
            } else {
              navigation.popToTop();
            }
          },
        },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>{mesaActual || 'Sin mesa'}</Text>
        <Text style={styles.subtitle}>{cart.length} platillo(s) en el pedido</Text>

        {cart.length === 0 ? (
          <Text style={styles.empty}>Aún no has agregado productos. Regresa al menú para agregar algo.</Text>
        ) : (
          <View style={styles.detailCard}>
            {cart.map((p) => (
              <View key={p.id} style={styles.row}>
                <Text style={styles.rowText}>
                  {p.cantidad}x {p.nombre}
                </Text>
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
          <>
            <Pressable style={styles.button} onPress={() => setModalVisible(true)}>
              <Text style={styles.buttonText}>VER DESGLOSE</Text>
            </Pressable>

            <Pressable style={[styles.button, { backgroundColor: colors.text }]} onPress={() => setSheetVisible(true)}>
              <Text style={styles.buttonText}>ENVIAR A COCINA</Text>
            </Pressable>
          </>
        )}
      </View>

      {/* Modal centrado con el desglose */}
      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Desglose del pedido</Text>
            <View style={styles.row}>
              <Text>Subtotal</Text>
              <Text>${subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.row}>
              <Text>IVA (16%)</Text>
              <Text>${iva.toFixed(2)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.total}>Total</Text>
              <Text style={styles.total}>${total.toFixed(2)}</Text>
            </View>
            <Pressable style={styles.closeBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeBtnText}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Bottom sheet de confirmación */}
      <Modal visible={sheetVisible} animationType="slide" transparent>
        <View style={styles.sheetOverlay}>
          <Pressable style={{ flex: 1 }} onPress={() => setSheetVisible(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.modalTitle}>Confirmar pedido a cocina</Text>
            <Text style={styles.sheetText}>
              El pedido de {mesaActual} será enviado a cocina por un total de ${total.toFixed(2)}.
            </Text>
            <Pressable style={[styles.button, { backgroundColor: colors.primary, marginTop: 10 }]} onPress={confirmarEnvio}>
              <Text style={styles.buttonText}>CONFIRMAR</Text>
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { backgroundColor: colors.white, borderRadius: 16, padding: 20, width: '85%' },
  modalTitle: { fontFamily: fonts.bold, fontSize: 16, marginBottom: 12, color: colors.text },
  closeBtn: { marginTop: 16, alignSelf: 'flex-end' },
  closeBtnText: { color: colors.primary, fontFamily: fonts.bold },
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
