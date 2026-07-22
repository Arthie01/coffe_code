import React, { useState } from 'react';
import {
  SafeAreaView, ScrollView, View, Text, StyleSheet, Pressable, Switch, Modal, TextInput, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOrders } from '../context/OrderContext';
import colors from '../theme/colors';
import fonts from '../theme/fonts';

// Módulo Cocina: Gestión del menú. Alta, edición, baja y disponibilidad
// de los platillos de la cafetería.
export default function MenuScreen() {
  const { menu, agregarPlatillo, editarPlatillo, eliminarPlatillo, toggleDisponible } = useOrders();

  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [categoria, setCategoria] = useState('');

  const abrirNuevo = () => {
    setEditId(null); setNombre(''); setPrecio(''); setCategoria(''); setModal(true);
  };
  const abrirEditar = (p) => {
    setEditId(p.id); setNombre(p.nombre); setPrecio(String(p.precio)); setCategoria(p.categoria); setModal(true);
  };

  const guardar = () => {
    const precioNum = parseFloat(precio);
    if (!nombre.trim() || isNaN(precioNum) || precioNum <= 0) {
      Alert.alert('Datos incompletos', 'Escribe un nombre y un precio válido.');
      return;
    }
    const datos = { nombre: nombre.trim(), precio: precioNum, categoria: categoria.trim() || 'General' };
    if (editId) editarPlatillo(editId, datos);
    else agregarPlatillo(datos);
    setModal(false);
  };

  const confirmarEliminar = (p) => {
    Alert.alert('Eliminar platillo', `¿Eliminar "${p.nombre}" del menú?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => eliminarPlatillo(p.id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>GESTIÓN DEL MENÚ</Text>

        <Pressable style={styles.addBtn} onPress={abrirNuevo}>
          <Ionicons name="add-circle-outline" size={18} color={colors.white} />
          <Text style={styles.addText}>NUEVO PLATILLO</Text>
        </Pressable>

        {menu.map((p) => (
          <View key={p.id} style={styles.panel}>
            <View style={styles.rowTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>{p.nombre}</Text>
                <Text style={styles.rowSub}>{p.categoria} · ${p.precio.toFixed(2)} MXN</Text>
              </View>
              <Switch
                value={p.disponible}
                onValueChange={() => toggleDisponible(p.id)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
            <View style={styles.actions}>
              <Text style={[styles.estado, { color: p.disponible ? colors.primary : colors.textSecondary }]}>
                {p.disponible ? 'Disponible' : 'No disponible'}
              </Text>
              <View style={styles.actionBtns}>
                <Pressable style={styles.iconBtn} onPress={() => abrirEditar(p)}>
                  <Ionicons name="pencil-outline" size={16} color={colors.primary} />
                </Pressable>
                <Pressable style={styles.iconBtn} onPress={() => confirmarEliminar(p)}>
                  <Ionicons name="trash-outline" size={16} color={colors.danger} />
                </Pressable>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal visible={modal} transparent animationType="slide" onRequestClose={() => setModal(false)}>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editId ? 'EDITAR PLATILLO' : 'NUEVO PLATILLO'}</Text>
            <TextInput style={styles.input} placeholder="Nombre" placeholderTextColor={colors.textSecondary}
              value={nombre} onChangeText={setNombre} />
            <TextInput style={styles.input} placeholder="Precio (ej. 45)" placeholderTextColor={colors.textSecondary}
              value={precio} onChangeText={setPrecio} keyboardType="decimal-pad" />
            <TextInput style={styles.input} placeholder="Categoría (ej. Bebidas)" placeholderTextColor={colors.textSecondary}
              value={categoria} onChangeText={setCategoria} />
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setModal(false)}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, styles.saveBtn]} onPress={guardar}>
                <Text style={styles.saveText}>Guardar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontFamily: fonts.bold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16, color: colors.text },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary, borderRadius: 12, padding: 14, marginBottom: 18 },
  addText: { color: colors.white, fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1 },
  panel: { backgroundColor: colors.white, borderRadius: 12, padding: 14, marginBottom: 12 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { fontFamily: fonts.semibold, color: colors.text, fontSize: 15 },
  rowSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10 },
  estado: { fontSize: 12, fontFamily: fonts.semibold },
  actionBtns: { flexDirection: 'row', gap: 10 },
  iconBtn: { width: 34, height: 34, borderRadius: 8, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.backgroundLight, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 16, fontFamily: fonts.bold, color: colors.text, letterSpacing: 1, marginBottom: 16 },
  input: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 14, marginBottom: 12, fontSize: 14, color: colors.text, fontFamily: fonts.regular },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 6 },
  modalBtn: { flex: 1, borderRadius: 10, padding: 14, alignItems: 'center' },
  cancelBtn: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  cancelText: { color: colors.textSecondary, fontFamily: fonts.bold },
  saveBtn: { backgroundColor: colors.primary },
  saveText: { color: colors.white, fontFamily: fonts.bold },
});
