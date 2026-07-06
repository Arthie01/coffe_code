import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useOrders } from '../context/OrderContext';
import colors from '../theme/colors';
import fonts from '../theme/fonts';

// Encabezado con la marca de la cafetería + lista de módulos +
// botón de cerrar sesión, todo dentro de la barra lateral.
export default function CustomDrawerContent(props) {
  const { pedidos } = useOrders();
  const activos = pedidos.filter((p) => p.estado !== 'Pagado').length;

  const cerrarSesion = () => {
    const parent = props.navigation.getParent();
    if (parent) {
      parent.replace('Login');
    } else {
      props.navigation.replace('Login');
    }
  };

  return (
    <View style={styles.container}>
      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }} style={{ backgroundColor: colors.primary }}>
        <View style={styles.header}>
          <Ionicons name="cafe" size={38} color={colors.white} />
          <Text style={styles.title}>CAFÉ APP</Text>
          <Text style={styles.subtitle}>{activos} pedido(s) activos</Text>
        </View>

        <View style={styles.items}>
          <DrawerItemList {...props} />
        </View>
      </DrawerContentScrollView>

      <Pressable style={styles.logout} onPress={cerrarSesion}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  header: { padding: 24, paddingTop: 40, marginBottom: 8 },
  logo: { fontSize: 36 },
  title: { color: colors.white, fontFamily: fonts.bold, fontSize: 18, marginTop: 6, letterSpacing: 1 },
  subtitle: { color: '#DFF3E9', fontSize: 11, marginTop: 4 },
  items: { paddingTop: 8 },
  logout: { padding: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.25)' },
  logoutText: { color: colors.white, fontFamily: fonts.bold, textAlign: 'center' },
});
