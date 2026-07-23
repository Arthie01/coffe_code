import React, { useState, useCallback } from 'react';
import {
  SafeAreaView, ScrollView, View, Text, StyleSheet, Pressable, Switch, Modal, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import {
  getComidas, getCategoriasComida, crearComida, actualizarComida, eliminarComida, ESTATUS,
} from '../services/api';
import colors from '../theme/colors';
import fonts from '../theme/fonts';

// Módulo Cocina: Gestión del menú contra la API. Alta, edición, baja y
// disponibilidad (activo/inactivo) de los platillos. La categoría se elige de
// un catálogo real (GET /v1/catalogos/categorias-comida) para mandar el
// id_categoria correcto.
export default function MenuScreen() {
  const [menu, setMenu] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [modal, setModal] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [editId, setEditId] = useState(null);
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [idCategoria, setIdCategoria] = useState(null);

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      const [rc, rcat] = await Promise.all([getComidas(), getCategoriasComida()]);
      setMenu(rc.data);
      setCategorias(rcat.data);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  const abrirNuevo = () => {
    setEditId(null); setNombre(''); setPrecio(''); setIdCategoria(categorias[0]?.id || null); setModal(true);
  };
  const abrirEditar = (p) => {
    setEditId(p.id); setNombre(p.nombre); setPrecio(String(p.precio)); setIdCategoria(p.id_categoria); setModal(true);
  };

  const guardar = async () => {
    const precioNum = parseFloat(precio);
    if (!nombre.trim() || isNaN(precioNum) || precioNum < 0 || !idCategoria) {
      Alert.alert('Datos incompletos', 'Escribe un nombre, un precio válido y una categoría.');
      return;
    }
    try {
      setGuardando(true);
      if (editId) {
        await actualizarComida(editId, { nombre: nombre.trim(), precio: precioNum, id_categoria: idCategoria });
      } else {
        await crearComida({ nombre: nombre.trim(), precio: precioNum, id_categoria: idCategoria, id_estatus: ESTATUS.ACTIVO });
      }
      setModal(false);
      cargar();
    } catch (e) {
      Alert.alert('No se pudo guardar', e.message);
    } finally {
      setGuardando(false);
    }
  };

  const toggleDisponible = async (p) => {
    try {
      const nuevo = p.id_estatus === ESTATUS.ACTIVO ? ESTATUS.INACTIVO : ESTATUS.ACTIVO;
      await actualizarComida(p.id, { id_estatus: nuevo });
      cargar();
    } catch (e) {
      Alert.alert('No se pudo actualizar', e.message);
    }
  };

  const confirmarEliminar = (p) => {
    Alert.alert('Eliminar platillo', `¿Eliminar "${p.nombre}" del menú?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try { await eliminarComida(p.id); cargar(); }
          catch (e) { Alert.alert('No se pudo eliminar', e.message); }
        },
      },
    ]);
  };

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
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>GESTIÓN DEL MENÚ</Text>

        <Pressable style={styles.addBtn} onPress={abrirNuevo}>
          <Ionicons name="add-circle-outline" size={18} color={colors.white} />
          <Text style={styles.addText}>NUEVO PLATILLO</Text>
        </Pressable>

        {menu.map((p) => {
          const disponible = p.id_estatus === ESTATUS.ACTIVO;
          return (
            <View key={p.id} style={styles.panel}>
              <View style={styles.rowTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowLabel}>{p.nombre}</Text>
                  <Text style={styles.rowSub}>{p.categoria} · ${p.precio.toFixed(2)} MXN</Text>
                </View>
                <Switch
                  value={disponible}
                  onValueChange={() => toggleDisponible(p)}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.white}
                />
              </View>
              <View style={styles.actions}>
                <Text style={[styles.estado, { color: disponible ? colors.primary : colors.textSecondary }]}>
                  {disponible ? 'Disponible' : 'No disponible'}
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
          );
        })}
      </ScrollView>

      <Modal visible={modal} transparent animationType="slide" onRequestClose={() => setModal(false)}>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editId ? 'EDITAR PLATILLO' : 'NUEVO PLATILLO'}</Text>
            <TextInput style={styles.input} placeholder="Nombre" placeholderTextColor={colors.textSecondary}
              value={nombre} onChangeText={setNombre} />
            <TextInput style={styles.input} placeholder="Precio (ej. 45)" placeholderTextColor={colors.textSecondary}
              value={precio} onChangeText={setPrecio} keyboardType="decimal-pad" />

            <Text style={styles.fieldLabel}>Categoría</Text>
            <View style={styles.chips}>
              {categorias.map((c) => (
                <Pressable key={c.id} onPress={() => setIdCategoria(c.id)}
                  style={[styles.chip, idCategoria === c.id && styles.chipOn]}>
                  <Text style={[styles.chipText, idCategoria === c.id && styles.chipTextOn]}>{c.nombre}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setModal(false)} disabled={guardando}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, styles.saveBtn]} onPress={guardar} disabled={guardando}>
                {guardando ? <ActivityIndicator color={colors.white} /> : <Text style={styles.saveText}>Guardar</Text>}
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
  center: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: colors.textSecondary },
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
  fieldLabel: { fontSize: 11, color: colors.textSecondary, textTransform: 'uppercase', marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12, color: colors.textSecondary, fontFamily: fonts.medium },
  chipTextOn: { color: colors.white },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 6 },
  modalBtn: { flex: 1, borderRadius: 10, padding: 14, alignItems: 'center' },
  cancelBtn: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  cancelText: { color: colors.textSecondary, fontFamily: fonts.bold },
  saveBtn: { backgroundColor: colors.primary },
  saveText: { color: colors.white, fontFamily: fonts.bold },
});
